const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  const userId = req.user.id;

  // Get all groups the user is part of
  const groups = await Group.find({ members: userId }).populate("members", "name email");

  const owedToMe = [];   // people who owe me
  const iOwe = [];       // people I owe

  for (const group of groups) {
    const expenses = await Expense.find({ group: group._id })
      .populate("paidBy", "name")
      .populate("splits.user", "name");

    const settlements = await Settlement.find({ group: group._id })
      .populate("paidBy", "name")
      .populate("paidTo", "name");

    // Calculate net balances within this group
    const balances = {};

    const ensure = (id, name) => {
      if (!balances[id]) balances[id] = { id, name, balance: 0 };
    };

    expenses.forEach((expense) => {
      const payerId = expense.paidBy._id.toString();
      ensure(payerId, expense.paidBy.name);
      balances[payerId].balance += expense.amount;

      expense.splits.forEach((split) => {
        const splitUserId = split.user._id.toString();
        ensure(splitUserId, split.user.name);
        balances[splitUserId].balance -= split.amount;
      });
    });

    settlements.forEach((s) => {
      const payerId = s.paidBy._id.toString();
      const payeeId = s.paidTo._id.toString();
      ensure(payerId, s.paidBy.name);
      ensure(payeeId, s.paidTo.name);
      balances[payerId].balance += s.amount;
      balances[payeeId].balance -= s.amount;
    });

    // Simplified debts
    const people = Object.values(balances);
    const creditors = people.filter((p) => p.balance > 0.01).sort((a, b) => b.balance - a.balance);
    const debtors = people.filter((p) => p.balance < -0.01).sort((a, b) => a.balance - b.balance);

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(-debtor.balance, creditor.balance);

      if (creditor.id === userId) {
        owedToMe.push({
          person: debtor.name,
          personId: debtor.id,
          amount: parseFloat(amount.toFixed(2)),
          group: group.name,
          groupId: group._id,
        });
      }

      if (debtor.id === userId) {
        iOwe.push({
          person: creditor.name,
          personId: creditor.id,
          amount: parseFloat(amount.toFixed(2)),
          group: group.name,
          groupId: group._id,
        });
      }

      debtor.balance += amount;
      creditor.balance -= amount;

      if (Math.abs(debtor.balance) < 0.01) i++;
      if (Math.abs(creditor.balance) < 0.01) j++;
    }
  }

  const totalOwedToMe = owedToMe.reduce((sum, o) => sum + o.amount, 0);
  const totalIOwe = iOwe.reduce((sum, o) => sum + o.amount, 0);

  res.json({
    totalOwedToMe: parseFloat(totalOwedToMe.toFixed(2)),
    totalIOwe: parseFloat(totalIOwe.toFixed(2)),
    owedToMe,
    iOwe,
    groups,
  });
});

module.exports = router;
