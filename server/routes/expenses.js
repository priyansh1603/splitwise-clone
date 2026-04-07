const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");
const Group = require("../models/Group");
const auth = require("../middleware/auth");

// Add expense to a group
router.post("/:groupId", auth, async (req, res) => {
  const { description, amount, splitType = "equal", splits } = req.body;
  const group = await Group.findById(req.params.groupId);
  if (!group) return res.status(404).json({ message: "Group not found" });

  let computedSplits = [];

  if (splitType === "equal") {
    const splitAmount = amount / group.members.length;
    computedSplits = group.members.map((memberId) => ({
      user: memberId,
      amount: parseFloat(splitAmount.toFixed(2)),
    }));

  } else if (splitType === "percentage") {
    // splits: [{ userId, percentage }]
    const totalPercent = splits.reduce((sum, s) => sum + s.percentage, 0);
    if (Math.abs(totalPercent - 100) > 0.01)
      return res.status(400).json({ message: "Percentages must add up to 100" });

    computedSplits = splits.map((s) => ({
      user: s.userId,
      amount: parseFloat(((s.percentage / 100) * amount).toFixed(2)),
      percentage: s.percentage,
    }));

  } else if (splitType === "exact") {
    // splits: [{ userId, amount }]
    const totalExact = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(totalExact - amount) > 0.01)
      return res.status(400).json({ message: "Exact amounts must add up to total" });

    computedSplits = splits.map((s) => ({
      user: s.userId,
      amount: parseFloat(s.amount.toFixed(2)),
    }));
  }

  const expense = await Expense.create({
    description,
    amount,
    paidBy: req.user.id,
    group: req.params.groupId,
    splitType,
    splits: computedSplits,
  });

  await expense.populate("paidBy", "name");
  await expense.populate("splits.user", "name");
  res.status(201).json(expense);
});

// Get all expenses for a group
router.get("/:groupId", auth, async (req, res) => {
  const expenses = await Expense.find({ group: req.params.groupId })
    .populate("paidBy", "name")
    .populate("splits.user", "name")
    .sort({ date: -1 });
  res.json(expenses);
});

// Delete an expense
router.delete("/:id", auth, async (req, res) => {
  await Expense.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// Settle up
router.post("/:groupId/settle", auth, async (req, res) => {
  const { paidToId, amount } = req.body;
  const settlement = await Settlement.create({
    group: req.params.groupId,
    paidBy: req.user.id,
    paidTo: paidToId,
    amount,
  });
  await settlement.populate("paidBy", "name");
  await settlement.populate("paidTo", "name");
  res.status(201).json(settlement);
});

// Get balances + simplified debts for a group
router.get("/:groupId/balances/summary", auth, async (req, res) => {
  const expenses = await Expense.find({ group: req.params.groupId })
    .populate("paidBy", "name")
    .populate("splits.user", "name");

  const settlements = await Settlement.find({ group: req.params.groupId })
    .populate("paidBy", "name")
    .populate("paidTo", "name");

  // Calculate net balance per user
  const balances = {};

  const ensureUser = (id, name) => {
    if (!balances[id]) balances[id] = { id, name, balance: 0 };
  };

  expenses.forEach((expense) => {
    const payerId = expense.paidBy._id.toString();
    ensureUser(payerId, expense.paidBy.name);
    balances[payerId].balance += expense.amount;

    expense.splits.forEach((split) => {
      const splitUserId = split.user._id.toString();
      ensureUser(splitUserId, split.user.name);
      balances[splitUserId].balance -= split.amount;
    });
  });

  // Apply settlements to balances
  settlements.forEach((s) => {
    const payerId = s.paidBy._id.toString();
    const payeeId = s.paidTo._id.toString();
    ensureUser(payerId, s.paidBy.name);
    ensureUser(payeeId, s.paidTo.name);
    balances[payerId].balance += s.amount;
    balances[payeeId].balance -= s.amount;
  });

  // Simplified debts algorithm
  const people = Object.values(balances);
  const creditors = people.filter((p) => p.balance > 0.01).sort((a, b) => b.balance - a.balance);
  const debtors = people.filter((p) => p.balance < -0.01).sort((a, b) => a.balance - b.balance);

  const transactions = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(-debtor.balance, creditor.balance);

    transactions.push({
      from: debtor.name,
      fromId: debtor.id,
      to: creditor.name,
      toId: creditor.id,
      amount: parseFloat(amount.toFixed(2)),
    });

    debtor.balance += amount;
    creditor.balance -= amount;

    if (Math.abs(debtor.balance) < 0.01) i++;
    if (Math.abs(creditor.balance) < 0.01) j++;
  }

  res.json({
    balances: Object.values(balances),
    transactions,
    settlements,
  });
});

module.exports = router;
