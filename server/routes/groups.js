const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const User = require("../models/User");
const PendingInvite = require("../models/PendingInvite");
const auth = require("../middleware/auth");
const sendInviteEmail = require("../utils/sendInvite");

// Create a group
router.post("/", auth, async (req, res) => {
  const { name, description } = req.body;
  const group = await Group.create({
    name,
    description,
    members: [req.user.id],
    createdBy: req.user.id,
  });
  res.status(201).json(group);
});

// Get all groups for logged-in user
router.get("/", auth, async (req, res) => {
  const groups = await Group.find({ members: req.user.id }).populate("members", "name email");
  res.json(groups);
});

// Get a single group
router.get("/:id", auth, async (req, res) => {
  const group = await Group.findById(req.params.id).populate("members", "name email");
  if (!group) return res.status(404).json({ message: "Group not found" });
  res.json(group);
});

// Add member to group by email
router.post("/:id/members", auth, async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  const group = await Group.findById(req.params.id).populate("createdBy", "name");

  if (!user) {
    const alreadyInvited = await PendingInvite.findOne({ email, group: group._id });
    if (!alreadyInvited) {
      await PendingInvite.create({ email, group: group._id });
      try {
        await sendInviteEmail(email, group.name, group.createdBy.name);
        console.log("Invite email sent to:", email);
      } catch (emailErr) {
        console.error("EMAIL ERROR:", emailErr.message, emailErr.code);
      }
    }
    return res.status(200).json({ message: "User not registered. Invite email sent!" });
  }

  if (group.members.includes(user._id))
    return res.status(400).json({ message: "User already in group" });

  group.members.push(user._id);
  await group.save();
  res.json(group);
});

module.exports = router;
