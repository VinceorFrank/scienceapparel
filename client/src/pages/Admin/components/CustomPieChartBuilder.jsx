import React, { useState } from 'react';
import { fetchCustomPie } from '../../../api/stats';
import { Pie } from 'react-chartjs-2';

// All available fields for each collection (including nested fields)
const collectionFields = {
  users: [
    'name', 'email', 'role', 'isAdmin', 'createdAt', 'updatedAt'
  ],
  orders: [
    'status', 'paymentMethod', 'shippingAddress.country', 'shippingAddress.city', 'shippingAddress.postalCode',
    'isPaid', 'isDelivered', 'createdAt', 'updatedAt', 'user', 'totalPrice', 'taxPrice', 'shippingPrice', 'reviewToken'
  ],
  products: [
    'name', 'category', 'featured', 'archived', 'price', 'stock', 'discountPrice', 'tags', 'createdAt', 'updatedAt'
  ],
  categories: [
    'name', 'description', 'createdAt', 'updatedAt'
  ],
};

const CustomPieChartBuilder = () => {
  const [collection, setCollection] = useState('orders');
  const [groupBy, setGroupBy] = useState(collectionFields['orders'][0]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetchCustomPie({ collection, groupBy });
    setData(res.data);
    setLoading(false);
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-8">
      <h2 className="text-lg font-semibold mb-4">Custom Pie Chart Builder</h2>
      <div className="flex gap-4 mb-4">
        <div>
          <label>Collection:</label>
          <select
            value={collection}
            onChange={e => {
              setCollection(e.target.value);
              setGroupBy(collectionFields[e.target.value][0]);
            }}
            style={{ maxHeight: 200, overflowY: 'auto', minWidth: 160 }}
            size={Math.min(Object.keys(collectionFields).length, 8)}
          >
            {Object.keys(collectionFields).map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Group By:</label>
          <select
            value={groupBy}
            onChange={e => setGroupBy(e.target.value)}
            style={{ maxHeight: 200, overflowY: 'auto', minWidth: 200 }}
            size={Math.min(collectionFields[collection].length, 12)}
          >
            {collectionFields[collection].map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </div>
        <button onClick={handleGenerate} className="bg-blue-500 text-white px-4 py-2 rounded">
          {loading ? 'Loading...' : 'Generate Chart'}
        </button>
      </div>
      {data.length > 0 && (
        <Pie data={{
          labels: data.map(d => d.label),
          datasets: [{
            data: data.map(d => d.value),
            backgroundColor: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#F472B6'],
          }]
        }} />
      )}
    </div>
  );
};

export default CustomPieChartBuilder; 