import { useEffect, useState } from "react";
import api from "../api/axios";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, login, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [name, setName] = useState(user?.name || "");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/auth/profile").then((res) => {
      setStats(res.data.stats);
      setName(res.data.name);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    try {
      const res = await api.put("/auth/profile", { name });
      login(res.data, token);
      setSuccess("Name updated successfully!");
    } catch {
      setError("Failed to update name");
    }
  };

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Layout>
      <div className="max-w-xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your account</p>
        </div>

        {/* Avatar + info */}
        <div className="bg-white rounded-xl shadow p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold">
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800">{user?.name}</p>
            <p className="text-sm text-gray-400">{user?.email}</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-base font-semibold text-gray-700 mb-4">Your Stats</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">{stats.groupsJoined}</p>
                <p className="text-xs text-gray-500 mt-1">Groups Joined</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600">{stats.totalExpenses}</p>
                <p className="text-xs text-gray-500 mt-1">Expenses Added</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-purple-600">₹{stats.totalSettled}</p>
                <p className="text-xs text-gray-500 mt-1">Total Settled</p>
              </div>
            </div>
          </div>
        )}

        {/* Edit name */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-base font-semibold text-gray-700 mb-4">Edit Profile</h3>
          {success && <p className="text-green-600 text-sm mb-3">{success}</p>}
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Email</label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
            <button
              type="submit"
              className="bg-green-500 text-white px-5 py-2 rounded-lg hover:bg-green-600 transition font-semibold text-sm"
            >
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
