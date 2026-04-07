import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";
import Modal from "../components/Modal";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const navigate = useNavigate();

  const fetchGroups = async () => {
    const res = await api.get("/groups");
    setGroups(res.data);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post("/groups", { name: groupName, description: groupDesc });
    setGroupName("");
    setGroupDesc("");
    setShowCreate(false);
    fetchGroups();
  };

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Groups</h2>
            <p className="text-gray-500 text-sm mt-1">All your expense groups</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition font-semibold text-sm"
          >
            + New Group
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
        />

        {/* Groups list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-400">No groups found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((group) => (
              <div
                key={group._id}
                onClick={() => navigate(`/groups/${group._id}`)}
                className="bg-white rounded-xl shadow p-5 cursor-pointer hover:shadow-md transition flex justify-between items-center border-l-4 border-green-500"
              >
                <div>
                  <h4 className="text-base font-semibold text-gray-800">{group.name}</h4>
                  {group.description && (
                    <p className="text-sm text-gray-400">{group.description}</p>
                  )}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {group.members.map((m) => (
                      <span key={m._id} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-gray-400 text-xl">→</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create group modal */}
      {showCreate && (
        <Modal title="Create New Group" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
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
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
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
