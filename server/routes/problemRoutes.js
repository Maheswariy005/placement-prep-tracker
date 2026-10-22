const express = require("express");
const Problem = require("../models/Problem");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const router = express.Router();

// GET /api/problems
router.get("/", authMiddleware, async (req, res) => {
  try {
    const problems = await Problem.find({
      user: req.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ problems });
  } catch (error) {
    console.error("Fetch problems error:", error.message);

    return res.status(500).json({
      message: "Failed to fetch problems",
    });
  }
});


router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      platform,
      topic,
      difficulty,
      status,
      notes,
      nextReviewDate,
    } = req.body;

    // Validate required fields
    if (!title?.trim() || !topic?.trim()) {
      return res.status(400).json({
        message: "Title and topic are required",
      });
    }

    const normalizedTitle = title.trim();
    const normalizedPlatform = platform?.trim() || "LeetCode";

    // Check whether this user already has the same problem
    const existingProblem = await Problem.findOne({
      user: req.userId,
      title: {
        $regex: `^${normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
      platform: {
        $regex: `^${normalizedPlatform.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (existingProblem) {
      return res.status(409).json({
        message: "This problem already exists in your tracker.",
      });
    }

    // Create a problem for the logged-in user
    const problem = await Problem.create({
      title: normalizedTitle,
      platform: normalizedPlatform,
      topic: topic.trim(),
      difficulty,
      status,
      notes: notes?.trim() || "",
      nextReviewDate,
      user: req.userId,
    });

    return res.status(201).json({
      message: "Problem created successfully",
      problem,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Create problem error:", error.message);

    return res.status(500).json({
      message: "Failed to create problem",
    });
  }
});


router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "platform",
      "topic",
      "difficulty",
      "status",
      "notes",
      "nextReviewDate",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update",
      });
    }

    const problem = await Problem.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.userId,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    return res.status(200).json({
      message: "Problem updated successfully",
      problem,
    });
  } catch (error) {
    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        message: "Invalid problem ID or field values",
      });
    }

    console.error("Update problem error:", error.message);

    return res.status(500).json({
      message: "Failed to update problem",
    });
  }
});


router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const problem = await Problem.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!problem) {
      return res.status(404).json({
        message: "Problem not found",
      });
    }

    return res.status(200).json({
      message: "Problem deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid problem ID",
      });
    }

    console.error("Delete problem error:", error.message);

    return res.status(500).json({
      message: "Failed to delete problem",
    });
  }
});


// GET /api/problems/revisions
router.get("/revisions", authMiddleware, async (req, res) => {
  try {
    const problems = await Problem.find({
      user: req.userId,
      status: "revisit",
    }).sort({ updatedAt: -1 });
    res.json({ problems });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch revision problems",
    });
  }
});


// POST /api/problems/sync-leetcode
router.post("/sync-leetcode", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("leetcodeUsername");

    if (!user || !user.leetcodeUsername) {
      return res.status(400).json({
        message: "Connect your LeetCode profile before syncing.",
      });
    }

    const username = user.leetcodeUsername;

    async function leetcodeQuery(query, variables = {}) {
      const response = await fetch("https://leetcode.com/graphql/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Referer": `https://leetcode.com/u/${encodeURIComponent(username)}/`,
          "User-Agent": "Mozilla/5.0",
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error("LeetCode is temporarily unavailable.");
      }

      const result = await response.json();

      if (result.errors || !result.data) {
        throw new Error("Could not retrieve LeetCode submission data.");
      }

      return result.data;
    }

    // Fetch recent accepted submissions.
    const submissionData = await leetcodeQuery(
      `
        query recentAccepted($username: String!, $limit: Int!) {
          recentAcSubmissionList(username: $username, limit: $limit) {
            id
            title
            titleSlug
            timestamp
          }
        }
      `,
      { username, limit: 20 }
    );

    const submissions = submissionData.recentAcSubmissionList;

    if (!Array.isArray(submissions)) {
      return res.status(502).json({
        message: "LeetCode returned an unexpected submission response.",
      });
    }

    // A user may have accepted the same problem multiple times.
    const uniqueSubmissions = [
      ...new Map(
        submissions
          .filter((item) => item.titleSlug && item.title)
          .map((item) => [item.titleSlug, item])
      ).values(),
    ];

    let imported = 0;
    let skipped = 0;
    const importedProblems = [];

    for (const submission of uniqueSubmissions) {
      const slug = submission.titleSlug.toLowerCase();

      // Check by stable LeetCode slug, not just the display title.
      const existing = await Problem.findOne({
        user: req.userId,
        source: "leetcode",
        leetcodeSlug: slug,
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Retrieve metadata for the problem.
      const questionData = await leetcodeQuery(
        `
          query questionDetails($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              title
              difficulty
              topicTags {
                name
              }
            }
          }
        `,
        { titleSlug: slug }
      );

    const question = questionData.question;

    if (!question) {
      skipped++;
      continue;
    }

    // Skip if the same problem already exists manually.
    const existingManualProblem = await Problem.findOne({
      user: req.userId,
      source: "manual",
      platform: { $regex: /^LeetCode$/i },
      title: {
        $regex: `^${(question.title || submission.title).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });

    if (existingManualProblem) {
      skipped++;
      continue;
    }

      const difficulty = question.difficulty?.toLowerCase();

      if (!["easy", "medium", "hard"].includes(difficulty)) {
        skipped++;
        continue;
      }

      try {
        const problem = await Problem.create({
          title: question.title || submission.title,
          platform: "LeetCode",
          topic: question.topicTags?.[0]?.name || "Unknown",
          difficulty,
          status: "solved",
          source: "leetcode",
          leetcodeSlug: slug,
          user: req.userId,
        });

        imported++;
        importedProblems.push(problem);
      } catch (error) {
        // Handles a duplicate import if two syncs run concurrently.
        if (error.code === 11000) {
          skipped++;
          continue;
        }

        throw error;
      }
    }

    return res.status(200).json({
      message: "LeetCode sync completed.",
      username,
      found: uniqueSubmissions.length,
      imported,
      skipped,
      problems: importedProblems,
    });
  } catch (error) {
    console.error("LeetCode sync error:", error.message);

    return res.status(502).json({
      message:
        error.name === "TimeoutError"
          ? "LeetCode took too long to respond. Please try again."
          : error.message || "LeetCode sync failed.",
    });
  }
});



module.exports = router;