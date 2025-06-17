import React, { useEffect, useState } from "react";
import { getActivityLogs } from "../../api/activityLogs";

const ActivityLogAdmin = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getActivityLogs();
      setLogs(data);
    } catch (err) {
      setError("Failed to load activity logs.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6">📝 Activity Log</h1>
      {loading && <div className="text-blue-600 mb-4">Loading...</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <table className="w-full border mt-2">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">User</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-left">Action</th>
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-left">Time</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr><td colSpan={5} className="p-4 text-center text-gray-500">No activity found.</td></tr>
          ) : (
            logs.map((log) => (
              <tr key={log._id} className="border-b">
                <td className="p-2">{log.user?.name || log.user?.email || "-"}</td>
                <td className="p-2">{log.user?.role || "-"}</td>
                <td className="p-2">{log.action}</td>
                <td className="p-2">{log.description}</td>
                <td className="p-2">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ActivityLogAdmin; 