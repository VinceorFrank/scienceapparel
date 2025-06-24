const http = require('http');

const testAdminLogin = async () => {
  return new Promise((resolve, reject) => {
    console.log('🧪 Testing admin login...');
    
    const postData = JSON.stringify({
      email: 'admin@example.com',
      password: 'password123'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ Login successful!');
            console.log('📧 User:', response.user.email);
            console.log('👤 Name:', response.user.name);
            console.log('🔑 Is Admin:', response.user.isAdmin);
            console.log('🎫 Token received:', response.token ? 'Yes' : 'No');
            resolve(response);
          } else {
            console.error('❌ Login failed!');
            console.error('Status:', res.statusCode);
            console.error('Message:', response.message);
            reject(new Error(response.message));
          }
        } catch (error) {
          console.error('❌ Failed to parse response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

// Run the test
testAdminLogin()
  .then(() => {
    console.log('🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.log('💥 Test failed:', error.message);
    process.exit(1);
  }); 