const axios = require('axios');

const testShippingRates = async () => {
  try {
    const testData = {
      orderItems: [
        {
          name: "Science Mug",
          qty: 2,
          price: 12.99,
          image: "beaker-mug.jpg",
          product: "1"
        },
        {
          name: "Periodic Table Shirt",
          qty: 1,
          price: 19.99,
          image: "periodic-shirt.jpg",
          product: "2"
        }
      ],
      origin: {
        address: "123 Commerce Street",
        city: "Toronto",
        postalCode: "M5V 3A8",
        country: "Canada"
      },
      destination: {
        address: "123 Main St",
        city: "Toronto",
        postalCode: "M5V 3A8",
        country: "Canada"
      }
    };

    console.log('Testing shipping rates API...');
    console.log('Request data:', JSON.stringify(testData, null, 2));

    const response = await axios.post('http://localhost:5000/api/shipping/test', testData, {
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