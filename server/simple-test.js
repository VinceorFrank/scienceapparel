const http = require('http');

console.log('🧪 Testing server connection...');

const req = http.get('http://localhost:5000/api/health', (res) => {
  console.log('✅ Server is responding!');
  console.log('Status:', res.statusCode);
  
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Health check response:', response);
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('❌ Server connection failed:', err.message);
});

req.setTimeout(5000, () => {
  console.error('❌ Request timeout');
  req.destroy();
}); 