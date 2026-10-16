const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    platform: {
      type: String,
      trim: true,
      default: "LeetCode",
    },

    topic: {
      type: String,
      trim: true,
      default: "Unknown",
    },

    difficulty: {
      type: String,
      required: true,
      enum: ["easy", "medium", "hard"],
    },

    status: {
      type: String,
      enum: ["todo", "solved", "revisit"],
      default: "todo",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    nextReviewDate: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Identifies where the problem came from.
    source: {
      type: String,
      enum: ["manual", "leetcode"],
      default: "manual",
    },

    // LeetCode's stable problem identifier, e.g. "two-sum".
    leetcodeSlug: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate imports of the same LeetCode problem
// for the same user. Manual problems aren't affected.
problemSchema.index(
  { user: 1, leetcodeSlug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      source: "leetcode",
      leetcodeSlug: { $type: "string" },
    },
  }
);

module.exports = mongoose.model("Problem", problemSchema);