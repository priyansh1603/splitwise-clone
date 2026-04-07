import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";
import Modal from "../components/Modal";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [showOwedToMe, setShowOwedToMe] = useState(false);
  const [showIOwe, setShowIOwe] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    const res = await api.get("/dashboard");
    setData(res.data);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    await api.post("/groups", { name: groupName, description: groupDesc });
    setGroupName("");
    setGroupDesc("");
    setShowCreateGroup(false);
    fetchDashboard();
  };

  if (!data) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
            <p className="text-gray-500 text-sm mt-1">Overview of all your balances</p>
          </div>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition font-semibold text-sm"
          >
            + New Group
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Owed to me */}
          <div
            onClick={() => setShowOwedToMe(true)}
            className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-md transition border-l-4 border-green-500"
          >
            <p className="text-sm text-gray-500 mb-1">You are owed</p>
            <p className="text-3xl font-bold text-green-600">₹{data.totalOwedToMe}</p>
            <p className="text-xs text-gray-400 mt-2">Click to see breakdown →</p>
          </div>

          {/* I owe */}
          <div
            onClick={() => setShowIOwe(true)}
            className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-md transition border-l-4 border-red-400"
          >
            <p className="text-sm text-gray-500 mb-1">You owe</p>
            <p className="text-3xl font-bold text-red-500">₹{data.totalIOwe}</p>
            <p className="text-xs text-gray-400 mt-2">Click to see breakdown →</p>
          </div>
        </div>

        {/* Groups */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Your Groups</h3>
          {data.groups.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <p className="text-gray-400 mb-4">No groups yet.</p>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition font-semibold text-sm"
              >
                Create your first group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {data.groups.map((group) => (
                <div
                  key={group._id}
                  onClick={() => navigate(`/groups/${group._id}`)}
                  className="bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-md transition border-l-4 border-green-500 flex justify-between items-center"
                >
                  <div>
                    <h4 className="text-base font-semibold text-gray-800">{group.name}</h4>
                    {group.description && (
                      <p className="text-sm text-gray-400">{group.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-gray-400 text-xl">→</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Owed to me modal */}
      {showOwedToMe && (
        <Modal title="People who owe you" onClose={() => setShowOwedToMe(false)}>
          {data.owedToMe.length === 0 ? (
            <p className="text-gray-400 text-sm">Nobody owes you anything!</p>
          ) : (
            <div className="space-y-3">
              {data.owedToMe.map((o, i) => (
                <div
                  key={i}
                  onClick={() => { setShowOwedToMe(false); navigate(`/groups/${o.groupId}`); }}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-green-50 transition"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{o.person}</p>
                    <p className="text-xs text-gray-400">{o.group}</p>
                  </div>
                  <span className="text-green-600 font-bold">₹{o.amount}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* I owe modal */}
      {showIOwe && (
        <Modal title="People you owe" onClose={() => setShowIOwe(false)}>
          {data.iOwe.length === 0 ? (
            <p className="text-gray-400 text-sm">You don't owe anyone!</p>
          ) : (
            <div className="space-y-3">
              {data.iOwe.map((o, i) => (
                <div
                  key={i}
                  onClick={() => { setShowIOwe(false); navigate(`/groups/${o.groupId}`); }}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-red-50 transition"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{o.person}</p>
                    <p className="text-xs text-gray-400">{o.group}</p>
                  </div>
                  <span className="text-red-500 font-bold">₹{o.amount}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Create group modal */}
      {showCreateGroup && (
        <Modal title="Create New Group" onClose={() => setShowCreateGroup(false)}>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowCreateGroup(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                Cancel
              </button>
              <button type="submit" className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition font-semibold text-sm">
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
