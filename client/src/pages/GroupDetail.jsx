import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import emailjs from "@emailjs/browser";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Modal from "../components/Modal";

const TABS = ["Expenses", "Balances", "Members", "Settlements"];

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [activeTab, setActiveTab] = useState("Expenses");

  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  // Expense form
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [splitType, setSplitType] = useState("equal");
  const [customSplits, setCustomSplits] = useState([]);
  const [expenseError, setExpenseError] = useState("");

  // Member form
  const [memberEmail, setMemberEmail] = useState("");
  const [memberMsg, setMemberMsg] = useState({ text: "", type: "" });

  const [settleSuccess, setSettleSuccess] = useState("");

  const fetchAll = async () => {
    const [groupRes, expensesRes, balancesRes] = await Promise.all([
      api.get(`/groups/${id}`),
      api.get(`/expenses/${id}`),
      api.get(`/expenses/${id}/balances/summary`),
    ]);
    setGroup(groupRes.data);
    setExpenses(expensesRes.data);
    setBalances(balancesRes.data.balances);
    setTransactions(balancesRes.data.transactions);
    setSettlements(balancesRes.data.settlements || []);
    setCustomSplits(
      groupRes.data.members.map((m) => ({
        userId: m._id,
        name: m.name,
        percentage: parseFloat((100 / groupRes.data.members.length).toFixed(2)),
        amount: 0,
      }))
    );
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleSplitTypeChange = (type) => {
    setSplitType(type);
    if (group) {
      setCustomSplits(
        group.members.map((m) => ({
          userId: m._id,
          name: m.name,
          percentage: parseFloat((100 / group.members.length).toFixed(2)),
          amount: 0,
        }))
      );
    }
  };

  const handleCustomSplitChange = (index, field, value) => {
    const updated = [...customSplits];
    updated[index][field] = parseFloat(value) || 0;
    setCustomSplits(updated);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setExpenseError("");
    try {
      const payload = { description, amount: parseFloat(amount), splitType };
      if (splitType !== "equal") payload.splits = customSplits;
      await api.post(`/expenses/${id}`, payload);
      setDescription(""); setAmount(""); setSplitType("equal");
      setShowAddExpense(false);
      fetchAll();
    } catch (err) {
      setExpenseError(err.response?.data?.message || "Failed to add expense");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberMsg({ text: "", type: "" });
    try {
      const res = await api.post(`/groups/${id}/members`, { email: memberEmail });
      if (res.data.message?.includes("not registered")) {
        await emailjs.send(
          "service_2a900it",
          "template_docccls",
          {
            to_email: memberEmail,
            inviter_name: user.name,
            group_name: group.name,
          },
          "fWQROXKp0PZvGo49R"
        );
      }
      setMemberEmail("");
      if (res.data.message) {
        setMemberMsg({ text: res.data.message, type: "success" });
      } else {
        setMemberMsg({ text: "Member added!", type: "success" });
        fetchAll();
      }
    } catch (err) {
      setMemberMsg({ text: err.response?.data?.message || "Failed to add member", type: "error" });
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm("Delete this expense?")) return;
    await api.delete(`/expenses/${expenseId}`);
    fetchAll();
  };

  const handleSettle = async (toId, amount) => {
    setSettleSuccess("");
    await api.post(`/expenses/${id}/settle`, { paidToId: toId, amount });
    setSettleSuccess("Settlement recorded!");
    fetchAll();
  };

  if (!group) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{group.name}</h2>
            {group.description && <p className="text-gray-400 text-sm">{group.description}</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddMember(true)}
              className="border border-green-500 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition font-semibold text-sm"
            >
              + Member
            </button>
            <button
              onClick={() => setShowAddExpense(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold text-sm"
            >
              + Expense
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}

        {/* EXPENSES TAB */}
        {activeTab === "Expenses" && (
          <div className="space-y-3">
            {expenses.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <p className="text-gray-400">No expenses yet.</p>
              </div>
            ) : expenses.map((e) => (
              <div key={e._id} className="bg-white rounded-xl shadow p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{e.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Paid by {e.paidBy.name} · {new Date(e.date).toLocaleDateString()} · {e.splitType} split
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {e.splits.map((s) => (
                        <span key={s.user._id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {s.user.name}: ₹{s.amount}
                          {e.splitType === "percentage" && s.percentage ? ` (${s.percentage}%)` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-bold text-gray-700">₹{e.amount}</span>
                    <button onClick={() => handleDelete(e._id)} className="text-red-400 text-sm hover:text-red-600">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* BALANCES TAB */}
        {activeTab === "Balances" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="text-base font-semibold text-gray-700 mb-3">Net Balances</h3>
              {balances.length === 0 ? (
                <p className="text-gray-400 text-sm">No expenses yet.</p>
              ) : (
                <div className="space-y-2">
                  {balances.map((b, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                      <span className="text-gray-700 font-medium">{b.name}</span>
                      <span className={`font-semibold ${b.balance >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {b.balance >= 0 ? `gets back ₹${b.balance.toFixed(2)}` : `owes ₹${Math.abs(b.balance).toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {transactions.length > 0 && (
              <div className="bg-white rounded-xl shadow p-5">
                <h3 className="text-base font-semibold text-gray-700 mb-3">Who pays whom</h3>
                {settleSuccess && <p className="text-green-600 text-sm mb-3">{settleSuccess}</p>}
                <div className="space-y-2">
                  {transactions.map((t, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-3">
                      <span className="text-sm text-gray-700">
                        <span className="font-semibold text-red-500">{t.from}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="font-semibold text-green-600">{t.to}</span>
                        <span className="ml-3 font-bold text-gray-700">₹{t.amount}</span>
                      </span>
                      {t.fromId === user.id && (
                        <button
                          onClick={() => handleSettle(t.toId, t.amount)}
                          className="text-xs bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition"
                        >
                          Settle Up
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MEMBERS TAB */}
        {activeTab === "Members" && (
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-base font-semibold text-gray-700 mb-4">Members ({group.members.length})</h3>
            <div className="space-y-3">
              {group.members.map((m) => (
                <div key={m._id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">
                    {m.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {m.name} {m._id === user.id ? <span className="text-xs text-gray-400">(you)</span> : ""}
                    </p>
                    <p className="text-xs text-gray-400">{m.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTLEMENTS TAB */}
        {activeTab === "Settlements" && (
          <div className="bg-white rounded-xl shadow p-5">
            <h3 className="text-base font-semibold text-gray-700 mb-4">Settlement History</h3>
            {settlements.length === 0 ? (
              <p className="text-gray-400 text-sm">No settlements yet.</p>
            ) : (
              <div className="space-y-3">
                {settlements.map((s, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        <span className="text-blue-600">{s.paidBy.name}</span> paid{" "}
                        <span className="text-green-600">{s.paidTo.name}</span>
                      </p>
                      <p className="text-xs text-gray-400">{new Date(s.date).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold text-blue-600">₹{s.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <Modal title="Add Expense" onClose={() => setShowAddExpense(false)}>
          <form onSubmit={handleAddExpense} className="space-y-4">
            {expenseError && <p className="text-red-500 text-sm">{expenseError}</p>}
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <div className="flex gap-2">
              {["equal", "percentage", "exact"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleSplitTypeChange(type)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                    splitType === type
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-gray-600 border-gray-300 hover:border-green-400"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            {splitType !== "equal" && (
              <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">
                  {splitType === "percentage" ? "Must total 100%" : "Must total expense amount"}
                </p>
                {customSplits.map((s, i) => (
                  <div key={s.userId} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-20 truncate">{s.name}</span>
                    <input
                      type="number"
                      value={splitType === "percentage" ? s.percentage : s.amount}
                      onChange={(e) => handleCustomSplitChange(i, splitType === "percentage" ? "percentage" : "amount", e.target.value)}
                      min="0"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    <span className="text-sm text-gray-500 w-4">{splitType === "percentage" ? "%" : "₹"}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowAddExpense(false)} className="px-4 py-2 text-sm text-gray-600">
                Cancel
              </button>
              <button type="submit" className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition font-semibold text-sm">
                Add
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <Modal title="Add Member" onClose={() => { setShowAddMember(false); setMemberMsg({ text: "", type: "" }); }}>
          <form onSubmit={handleAddMember} className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {memberMsg.text && (
              <p className={`text-sm ${memberMsg.type === "error" ? "text-red-500" : "text-green-600"}`}>
                {memberMsg.text}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowAddMember(false)} className="px-4 py-2 text-sm text-gray-600">
                Cancel
              </button>
              <button type="submit" className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition font-semibold text-sm">
                Add
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
