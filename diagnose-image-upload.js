// 🩺 Image Upload System Diagnostic Script
// Run this in your browser console while on the admin products page

console.log('🔍 Starting Image Upload System Diagnostic...');

// 1. Check API Configuration
console.log('\n📡 API Configuration Check:');
try {
  const apiBaseUrl = 'http://localhost:5000/api';
  console.log('✅ API Base URL:', apiBaseUrl);
  
  // Test API connectivity
  fetch(`${apiBaseUrl}/health`)
    .then(response => response.json())
    .then(data => {
      console.log('✅ Backend Health Check:', data);
    })
    .catch(error => {
      console.error('❌ Backend Health Check Failed:', error);
    });
} catch (error) {
  console.error('❌ API Configuration Error:', error);
}

// 2. Check Upload Directory
console.log('\n📁 Upload Directory Check:');
try {
  fetch('http://localhost:5000/uploads/images/')
    .then(response => {
      if (response.status === 200) {
        console.log('✅ Upload directory accessible');
      } else {
        console.log('⚠️ Upload directory status:', response.status);
      }
    })
    .catch(error => {
      console.error('❌ Upload directory not accessible:', error);
    });
} catch (error) {
  console.error('❌ Upload Directory Check Error:', error);
}

// 3. Check CORS Configuration
console.log('\n🌐 CORS Configuration Check:');
try {
  const testImageUrl = 'http://localhost:5000/uploads/images/placeholder.PNG';
  fetch(testImageUrl, { mode: 'cors' })
    .then(response => {
      if (response.status === 200) {
        console.log('✅ CORS configured correctly for images');
      } else {
        console.log('⚠️ CORS test status:', response.status);
      }
    })
    .catch(error => {
      console.error('❌ CORS test failed:', error);
    });
} catch (error) {
  console.error('❌ CORS Check Error:', error);
}

// 4. Check Local Storage
console.log('\n💾 Local Storage Check:');
try {
  const token = localStorage.getItem('token');
  if (token) {
    console.log('✅ Admin token found');
    console.log('Token length:', token.length);
  } else {
    console.error('❌ No admin token found - please login');
  }
} catch (error) {
  console.error('❌ Local Storage Check Error:', error);
}

// 5. Check Product Data Structure
console.log('\n📦 Product Data Structure Check:');
try {
  // This will run when you're on the products page
  if (typeof window.products !== 'undefined') {
    console.log('✅ Products data available');
    console.log('Sample product structure:', window.products[0]);
  } else {
    console.log('ℹ️ Products data not available in global scope');
  }
} catch (error) {
  console.error('❌ Product Data Check Error:', error);
}

// 6. Check File API Support
console.log('\n📄 File API Support Check:');
try {
  if (typeof File !== 'undefined') {
    console.log('✅ File API supported');
  } else {
    console.error('❌ File API not supported');
  }
  
  if (typeof FormData !== 'undefined') {
    console.log('✅ FormData API supported');
  } else {
    console.error('❌ FormData API not supported');
  }
  
  if (typeof URL.createObjectURL !== 'undefined') {
    console.log('✅ URL.createObjectURL supported');
  } else {
    console.error('❌ URL.createObjectURL not supported');
  }
} catch (error) {
  console.error('❌ File API Check Error:', error);
}

// 7. Check Network Connectivity
console.log('\n🌍 Network Connectivity Check:');
try {
  Promise.all([
    fetch('http://localhost:5000/api/health'),
    fetch('http://localhost:5173')
  ]).then(responses => {
    console.log('✅ Backend connectivity:', responses[0].status);
    console.log('✅ Frontend connectivity:', responses[1].status);
  }).catch(error => {
    console.error('❌ Network connectivity issue:', error);
  });
} catch (error) {
  console.error('❌ Network Check Error:', error);
}

console.log('\n🏁 Diagnostic Complete! Check the results above.');
console.log('💡 If you see any ❌ errors, those are the issues to fix first.');

// 8. Quick Test Functions
window.testImageUpload = async (file) => {
  console.log('🧪 Testing image upload with file:', file);
  
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    const data = await response.json();
    console.log('Upload test result:', data);
    return data;
  } catch (error) {
    console.error('Upload test failed:', error);
    return null;
  }
};

console.log('\n🧪 Test Functions Available:');
console.log('- window.testImageUpload(file) - Test upload with a file object'); 