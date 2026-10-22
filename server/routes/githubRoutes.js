
const express = require("express");
const router = express.Router();

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const GITHUB_API = "https://api.github.com";

const githubHeaders = {
  Accept: "application/vnd.github+json",
  "User-Agent": "Placement-Prep-Tracker",
};

function isValidUsername(username) {
  return (
    typeof username === "string" &&
    /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(
      username.trim()
    )
  );
}

// Fetch a public GitHub profile and its repositories.
async function fetchGitHubData(username) {
  const encodedUsername = encodeURIComponent(username);

  const [profileResponse, reposResponse] = await Promise.all([
    fetch(`${GITHUB_API}/users/${encodedUsername}`, {
      headers: githubHeaders,
      signal: AbortSignal.timeout(10000),
    }),
    fetch(
      `${GITHUB_API}/users/${encodedUsername}/repos?sort=updated&per_page=100`,
      {
        headers: githubHeaders,
        signal: AbortSignal.timeout(10000),
      }
    ),
  ]);

  if (profileResponse.status === 404) {
    const error = new Error("GitHub user not found.");
    error.status = 404;
    throw error;
  }

  if (profileResponse.status === 403 || reposResponse.status === 403) {
    const error = new Error(
      "GitHub API rate limit reached. Please try again later."
    );
    error.status = 429;
    throw error;
  }

  if (!profileResponse.ok || !reposResponse.ok) {
    throw new Error("GitHub API is temporarily unavailable.");
  }

  const profileData = await profileResponse.json();
  const reposData = await reposResponse.json();

  if (!Array.isArray(reposData)) {
    throw new Error("Unexpected response from GitHub.");
  }

  // Save only the public fields this application needs.
  const profile = {
    username: profileData.login,
    name: profileData.name,
    avatarUrl: profileData.avatar_url,
    bio: profileData.bio,
    location: profileData.location,
    profileUrl: profileData.html_url,
    publicRepos: profileData.public_repos,
    followers: profileData.followers,
    following: profileData.following,
    createdAt: profileData.created_at,
  };

  const repositories = reposData.map((repo) => ({
    id: repo.id,
    name: repo.name,
    description: repo.description,
    url: repo.html_url,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    updatedAt: repo.updated_at,
    isFork: repo.fork,
  }));

  return { profile, repositories };
}

// GET /api/github/me
// Get the current user's saved GitHub connection and data.
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "githubUsername githubConnectedAt githubLastSyncedAt githubProfile githubRepositories"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      github: {
        username: user.githubUsername,
        connectedAt: user.githubConnectedAt,
        lastSyncedAt: user.githubLastSyncedAt,
        profile: user.githubProfile,
        repositories: user.githubRepositories || [],
      },
    });
  } catch (error) {
    console.error("Get GitHub details error:", error.message);
    return res.status(500).json({
      message: "Could not retrieve GitHub details.",
    });
  }
});

// POST /api/github/connect
// Connect a publicly accessible GitHub username.
router.post("/connect", authMiddleware, async (req, res) => {
  try {
    const username =
      typeof req.body.username === "string"
        ? req.body.username.trim()
        : "";

    if (!isValidUsername(username)) {
      return res.status(400).json({
        message: "Please enter a valid GitHub username.",
      });
    }

    // Confirm that this public profile exists.
    const response = await fetch(
      `${GITHUB_API}/users/${encodeURIComponent(username)}`,
      {
        headers: githubHeaders,
        signal: AbortSignal.timeout(10000),
      }
    );

    if (response.status === 404) {
      return res.status(404).json({
        message: "GitHub user not found.",
      });
    }

    if (response.status === 403) {
      return res.status(429).json({
        message: "GitHub API rate limit reached. Please try again later.",
      });
    }

    if (!response.ok) {
      return res.status(502).json({
        message: "Could not verify the GitHub profile right now.",
      });
    }

    const profileData = await response.json();

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          githubUsername: profileData.login,
          githubConnectedAt: new Date(),
        },
      },
      { new: true }
    ).select("githubUsername githubConnectedAt");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "GitHub public profile connected successfully.",
      github: {
        username: user.githubUsername,
        connectedAt: user.githubConnectedAt,
      },
    });
  } catch (error) {
    console.error("Connect GitHub error:", error.message);

    return res.status(error.name === "TimeoutError" ? 504 : 502).json({
      message:
        error.name === "TimeoutError"
          ? "GitHub took too long to respond. Please try again."
          : "Could not connect to GitHub right now.",
    });
  }
});

// POST /api/github/sync
// Refresh and save the connected user's public GitHub data.
router.post("/sync", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("githubUsername");

    if (!user || !user.githubUsername) {
      return res.status(400).json({
        message: "Connect your GitHub profile before syncing.",
      });
    }

    const { profile, repositories } = await fetchGitHubData(
      user.githubUsername
    );

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          githubProfile: profile,
          githubRepositories: repositories,
          githubLastSyncedAt: new Date(),
        },
      },
      { new: true }
    ).select("githubUsername githubLastSyncedAt");

    return res.status(200).json({
      message: "GitHub sync completed successfully.",
      username: updatedUser.githubUsername,
      lastSyncedAt: updatedUser.githubLastSyncedAt,
      repositoryCount: repositories.length,
      profile,
      repositories,
    });
  } catch (error) {
    console.error("GitHub sync error:", error.message);

    const status = error.status || (
      error.name === "TimeoutError" ? 504 : 502
    );

    return res.status(status).json({
      message:
        error.name === "TimeoutError"
          ? "GitHub took too long to respond. Please try again."
          : error.message || "GitHub sync failed.",
    });
  }
});

// GET /api/github/:username
// Public lookup endpoint retained for compatibility.
router.get("/:username", async (req, res) => {
  try {
    const username = req.params.username.trim();

    if (!isValidUsername(username)) {
      return res.status(400).json({
        message: "Please enter a valid GitHub username.",
      });
    }

    const { profile, repositories } = await fetchGitHubData(username);

    return res.status(200).json({ profile, repositories });
  } catch (error) {
    console.error("GitHub lookup error:", error.message);

    return res.status(error.status || (
      error.name === "TimeoutError" ? 504 : 502
    )).json({
      message:
        error.name === "TimeoutError"
          ? "GitHub took too long to respond. Please try again."
          : error.message || "Could not fetch GitHub profile.",
    });
  }
});

module.exports = router;
