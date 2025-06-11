import { useEffect, useState } from "react";
import { fetchProductStats } from "../api/stats";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchProductStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    };
    loadStats();
  }, []);

  if (!stats) {
    return <div className="p-6 text-gray-700">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card label="Total Products" value={stats.totals.totalProducts} />
        <Card label="Avg. Rating" value={stats.totals.averageRating} />
        <Card label="Avg. Price" value={`$${stats.totals.averagePrice}`} />
        <Card label="5⭐ Products" value={stats.totals.fiveStarOnlyCount} />
        <Card label="Out of Stock" value={stats.totals.outOfStockCount} />
        <Card label="Low Stock" value={stats.totals.lowStockCount} />
      </div>
    </div>
  );
};

const Card = ({ label, value }) => (
  <div className="bg-white shadow-md rounded-xl p-4">
    <h2 className="text-lg font-semibold text-gray-800">{label}</h2>
    <p className="text-2xl font-bold text-blue-500">{value}</p>
  </div>
);

export default AdminDashboard;
