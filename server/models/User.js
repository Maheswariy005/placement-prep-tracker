
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },
        leetcodeUsername: {
            type: String,
            trim: true,
            default: null,
        },
        leetcodeConnectedAt: {
            type: Date,
            default: null,
        },
        // GitHub public profile connection
        githubUsername: {
        type: String,
        trim: true,
        default: null,
        },

        githubConnectedAt: {
        type: Date,
        default: null,
        },

        githubLastSyncedAt: {
        type: Date,
        default: null,
        },

        githubProfile: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
        },

        githubRepositories: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
        },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
