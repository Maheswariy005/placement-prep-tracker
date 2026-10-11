const express = require("express");
const Problem = require("../models/Problem");
const authMiddleware = require("../middleware/authMiddleware");

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

    // Create a problem for the logged-in user
    const problem = await Problem.create({
      title: title.trim(),
      platform: platform?.trim() || "LeetCode",
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

module.exports = router;