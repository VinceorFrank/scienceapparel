import React, { useEffect, useState } from 'react';
import { fetchRevenue } from '../../../api/stats';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const RevenueChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchRevenue().then(res => setData(res.data));
  }, []);

  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(d => d.total),
        borderColor: '#60A5FA',
        backgroundColor: 'rgba(96,165,250,0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-8">
      <h2 className="text-lg font-semibold mb-2">Revenue Over Time</h2>
      <Line data={chartData} />
    </div>
  );
};

export default RevenueChart; 