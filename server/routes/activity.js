const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  const userId = req.user.id;

  // Get all groups user belongs to
  const groups = await Group.find({ members: userId });
  const groupIds = groups.map((g) => g._id);
  const groupMap = {};
  groups.forEach((g) => (groupMap[g._id.toString()] = g.name));

  // Get recent expenses
  const expenses = await Expense.find({ group: { $in: groupIds } })
    .populate("paidBy", "name")
    .sort({ createdAt: -1 })
    .limit(30);

  // Get recent settlements
  const settlements = await Settlement.find({ group: { $in: groupIds } })
    .populate("paidBy", "name")
    .populate("paidTo", "name")
    .sort({ createdAt: -1 })
    .limit(30);

  // Combine and format activity
  const activity = [];

  expenses.forEach((e) => {
    activity.push({
      type: "expense",
      description: `${e.paidBy.name} added "${e.description}"`,
      amount: e.amount,
      group: groupMap[e.group.toString()],
      groupId: e.group,
      date: e.createdAt,
    });
  });

  settlements.forEach((s) => {
    activity.push({
      type: "settlement",
      description: `${s.paidBy.name} settled with ${s.paidTo.name}`,
      amount: s.amount,
      group: groupMap[s.group.toString()],
      groupId: s.group,
      date: s.createdAt,
    });
  });

  // Sort by date descending
  activity.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json(activity.slice(0, 30));
});

module.exports = router;
