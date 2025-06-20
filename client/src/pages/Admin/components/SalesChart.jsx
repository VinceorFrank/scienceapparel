import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../../../api/config';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SalesChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/dashboard/sales');
        if (response.data && response.data.dailySales) {
          const labels = response.data.dailySales.map(d => new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          const data = response.data.dailySales.map(d => d.total);

          setChartData({
            labels,
            datasets: [
              {
                label: 'Daily Sales',
                data: data,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.1,
              },
            ],
          });
        }
      } catch (err) {
        setError('Failed to load sales data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sales Over the Last 7 Days',
      },
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
  };
  
  if (loading) {
    return <div className="p-4 text-center">Loading sales chart...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
        <Line options={options} data={chartData} />
    </div>
  );
};

export default SalesChart; 