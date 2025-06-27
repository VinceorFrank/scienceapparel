import { useQuery } from '@tanstack/react-query';
import { fetchCLVDistribution, fetchGeoDistribution } from '../../api/customers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import CustomPieChartBuilder from './components/CustomPieChartBuilder';

const COLORS = ["#6DD5ED", "#A7F0BA", "#FECFEF", "#FFD580", "#B39DDB", "#FFB74D", "#90CAF9"];

const CustomerInsights = () => {
  const { data: clvData, isLoading: clvLoading } = useQuery({
    queryKey: ['clvDistribution'],
    queryFn: fetchCLVDistribution
  });
  const { data: geoData, isLoading: geoLoading } = useQuery({
    queryKey: ['geoDistribution'],
    queryFn: fetchGeoDistribution
  });

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "center", margin: "2rem 0" }}>
      {/* CLV Distribution Bar Chart */}
      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #eee", padding: 24, minWidth: 400 }}>
        <h3 style={{ color: "#6DD5ED" }}>CLV Distribution</h3>
        {clvLoading ? <div>Loading...</div> : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={clvData?.map((v, i) => ({ name: `User ${i+1}`, clv: v }))}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="clv" fill="#B39DDB" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      {/* Geographic Pie Chart */}
      <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #eee", padding: 24, minWidth: 300 }}>
        <h3 style={{ color: "#6DD5ED" }}>Customer by Country</h3>
        {geoLoading ? <div>Loading...</div> : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={geoData} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label>
                {geoData?.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      {/* Custom Pie Chart Builder */}
      <div style={{ flexBasis: '100%', marginTop: 32 }}>
        <CustomPieChartBuilder />
      </div>
    </div>
  );
};

export default CustomerInsights; 