import React from 'react';
import InsightsNavPanel from './InsightsNavPanel';

const InsightsDemo = () => {
  return (
    <div className="flex gap-6 min-h-screen">
      {/* Navigation Panel */}
      <InsightsNavPanel />
      
      {/* Main Content */}
      <main className="flex-1 space-y-8 p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Analytics Dashboard Demo</h1>
        
        {/* Dashboard Section */}
        <section id="dashboard" className="scroll-mt-20">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Dashboard Overview</h2>
            <p className="text-gray-600">
              This is the main dashboard section. The navigation panel on the left will highlight this section when you scroll to it.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">$12,345</div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">156</div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">89</div>
                <div className="text-sm text-gray-600">New Customers</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">$79.13</div>
                <div className="text-sm text-gray-600">Average Order Value</div>
              </div>
            </div>
          </div>
        </section>

        {/* Sales Analytics Section */}
        <section id="sales" className="scroll-mt-20">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📈 Sales Analytics</h2>
            <p className="text-gray-600">
              Track your sales performance, revenue trends, and order statistics. This section contains detailed sales metrics and charts.
            </p>
            <div className="mt-6 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Sales Charts would go here</p>
            </div>
          </div>
        </section>

        {/* Customer Analytics Section */}
        <section id="customers" className="scroll-mt-20">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">👥 Customer Analytics</h2>
            <p className="text-gray-600">
              Understand your customer base, lifetime value, and geographic distribution. Analyze customer behavior and loyalty.
            </p>
            <div className="mt-6 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Customer Charts would go here</p>
            </div>
          </div>
        </section>

        {/* Product Analytics Section */}
        <section id="products" className="scroll-mt-20">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📦 Product Analytics</h2>
            <p className="text-gray-600">
              Track your best-selling products, inventory levels, and product revenue. Monitor product performance and stock alerts.
            </p>
            <div className="mt-6 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Product Charts would go here</p>
            </div>
          </div>
        </section>

        {/* Engagement Analytics Section */}
        <section id="engagement" className="scroll-mt-20">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📬 Engagement Analytics</h2>
            <p className="text-gray-600">
              Track conversion rates, abandoned carts, newsletter performance, and admin activity. Monitor user engagement metrics.
            </p>
            <div className="mt-6 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Engagement Charts would go here</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default InsightsDemo; 