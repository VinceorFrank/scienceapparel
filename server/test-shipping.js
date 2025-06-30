const axios = require('axios');

const testShippingRates = async () => {
  try {
    const testData = {
      orderItems: [
        {
          name: "Test Product",
          qty: 2,
          price: 15.99
        }
      ],
      origin: {
        address: "123 Commerce Street",
        city: "Toronto",
        postalCode: "M5V 3A8",
        country: "Canada"
      },
      destination: {
        address: "456 Main Street",
        city: "Vancouver",
        postalCode: "V6B 1A1",
        country: "Canada"
      }
    };

    console.log('Testing shipping rates API...');
    console.log('Request data:', JSON.stringify(testData, null, 2));

    const response = await axios.post('http://localhost:5000/api/shipping/rates', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

testShippingRates(); 