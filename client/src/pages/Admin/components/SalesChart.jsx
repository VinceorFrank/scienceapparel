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
import { useLang } from '../../../utils/lang';

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
  const { t } = useLang();

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard/sales-chart');
        if (response.data && response.data.salesData) {
          const labels = response.data.salesData.map(d => d._id);
          const data = response.data.salesData.map(d => d.totalRevenue);

          setChartData({
            labels,
            datasets: [
              {
                label: t('dailySales'),
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
  }, [t]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: t('salesOverLast7Days'),
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