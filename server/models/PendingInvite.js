const mongoose = require("mongoose");

const pendingInviteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
}, { timestamps: true });

module.exports = mongoose.model("PendingInvite", pendingInviteSchema);
