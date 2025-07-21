import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import api from '../api/config';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const AdminDashboard = () => {
  const [productCounts, setProductCounts] = useState({});

  useEffect(() => {
    const fetchProductCounts = async () => {
      try {
        const { data } = await api.get('/products/admin', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const products = data.data || [];
        const counts = {};
        for (const product of products) {
          const catName = product.category?.name || 'Uncategorized';
          counts[catName] = (counts[catName] || 0) + 1;
        }
        setProductCounts(counts);
      } catch (err) {
        console.error('Error fetching product counts:', err);
      }
    };
    fetchProductCounts();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Products per Category Bar Chart */}
      {Object.keys(productCounts).length > 0 ? (
        <div className="mt-10">
          <h2 className="text-lg font-bold mb-4">📊 Products per Category</h2>
          <Bar
            data={{
              labels: Object.keys(productCounts),
              datasets: [{
                label: 'Products',
                data: Object.values(productCounts),
                backgroundColor: [
                  '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#c084fc'
                ],
              }],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    font: { size: 14 }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { stepSize: 1 }
                }
              }
            }}
          />
        </div>
      ) : (
        <p className="text-gray-500 mt-10">No products found or categories missing.</p>
      )}
    </div>
  );
};

export default AdminDashboard; 