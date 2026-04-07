import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";

function groupByDate(activities) {
  const groups = {};
  activities.forEach((a) => {
    const date = new Date(a.date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let label;
    if (date.toDateString() === today.toDateString()) label = "Today";
    else if (date.toDateString() === yesterday.toDateString()) label = "Yesterday";
    else label = date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    if (!groups[label]) groups[label] = [];
    groups[label].push(a);
  });
  return groups;
}

export default function Activity() {
  const [activity, setActivity] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/activity").then((res) => setActivity(res.data));
  }, []);

  const grouped = groupByDate(activity);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Activity</h2>
          <p className="text-gray-500 text-sm mt-1">Recent actions across all your groups</p>
        </div>

        {activity.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <p className="text-gray-400">No activity yet.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                {dateLabel}
              </h3>
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(`/groups/${item.groupId}`)}
                    className="bg-white rounded-xl shadow p-4 cursor-pointer hover:shadow-md transition flex items-center gap-4"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                      item.type === "expense" ? "bg-green-100" : "bg-blue-100"
                    }`}>
                      {item.type === "expense" ? "💸" : "✅"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{item.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.group}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${item.type === "expense" ? "text-gray-700" : "text-blue-600"}`}>
                        ₹{item.amount}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(item.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
