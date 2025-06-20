import React from "react";
import DashboardMetrics from "../../components/DashboardMetrics";
import SalesChart from "./components/SalesChart";

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        
        {/* Dashboard Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Overview</h2>
          <DashboardMetrics />
        </div>

        {/* Additional sections can be added here */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <SalesChart />
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Orders</h2>
            <p className="text-gray-500">Recent orders list will be added here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 