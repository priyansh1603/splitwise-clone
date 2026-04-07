const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Group = require("../models/Group");
const PendingInvite = require("../models/PendingInvite");
const auth = require("../middleware/auth");

// Register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already in use" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });

  // Auto-add user to any groups they were invited to
  const pendingInvites = await PendingInvite.find({ email });
  for (const invite of pendingInvites) {
    await Group.findByIdAndUpdate(invite.group, { $addToSet: { members: user._id } });
  }
  await PendingInvite.deleteMany({ email });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
});

// Update profile
router.put("/profile", auth, async (req, res) => {
  const { name } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name },
    { new: true }
  );
  res.json({ id: user._id, name: user.name, email: user.email });
});

// Get profile + stats
router.get("/profile", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  const groups = await Group.find({ members: req.user.id });
  const { Expense } = require("../models/Expense") || require("../models/Expense");
  const ExpenseModel = require("../models/Expense");
  const SettlementModel = require("../models/Settlement");

  const groupIds = groups.map((g) => g._id);
  const totalExpenses = await ExpenseModel.countDocuments({ group: { $in: groupIds }, paidBy: req.user.id });
  const settlements = await SettlementModel.find({
    group: { $in: groupIds },
    $or: [{ paidBy: req.user.id }, { paidTo: req.user.id }],
  });
  const totalSettled = settlements.reduce((sum, s) => sum + s.amount, 0);

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    stats: {
      groupsJoined: groups.length,
      totalExpenses,
      totalSettled: parseFloat(totalSettled.toFixed(2)),
    },
  });
});

module.exports = router;
