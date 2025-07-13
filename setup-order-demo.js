#!/usr/bin/env node

/**
 * Setup Script for Order Demo
 * This script will help you see actual orders in your e-commerce site
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🛍️  Setting up Order Demo for E-commerce Site...\n');

// Step 1: Check if we're in the right directory
if (!fs.existsSync('server') || !fs.existsSync('client')) {
  console.error('❌ Error: Please run this script from the root of your e-commerce project');
  process.exit(1);
}

// Step 2: Install dependencies if needed
console.log('📦 Checking dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  execSync('cd server && npm install', { stdio: 'inherit' });
  execSync('cd client && npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed\n');
} catch (error) {
  console.log('⚠️  Some dependencies may not be installed, continuing...\n');
}

// Step 3: Seed the database with sample data
console.log('🌱 Seeding database with sample orders...');
try {
  execSync('cd server && node seed-full-demo.js', { stdio: 'inherit' });
  console.log('✅ Database seeded successfully\n');
} catch (error) {
  console.error('❌ Error seeding database:', error.message);
  console.log('💡 Make sure MongoDB is running and your connection string is correct\n');
}

// Step 4: Create a simple test script
const testScript = `
// Test script to view orders
// Run this in your browser console or create a simple test page

// Test credentials created by seed script:
// Customer: john@example.com / password123
// Admin: admin@example.com / password123

console.log('🔑 Test Credentials:');
console.log('Customer: john@example.com / password123');
console.log('Admin: admin@example.com / password123');
console.log('');
console.log('📋 To view orders:');
console.log('1. Start your server: npm run dev');
console.log('2. Go to http://localhost:5173');
console.log('3. Login with john@example.com / password123');
console.log('4. Go to Account page to see orders');
console.log('5. Click on any order to see details');
`;

fs.writeFileSync('order-demo-instructions.js', testScript);

// Step 5: Create a quick start guide
const quickStartGuide = `# 🛍️ Order Demo Quick Start Guide

## 🚀 Quick Setup

1. **Start the servers:**
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Access the site:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## 👤 Test Users (Created by Seed Script)

### Customer Account
- **Email:** john@example.com
- **Password:** password123
- **Orders:** 2 sample orders created

### Admin Account  
- **Email:** admin@example.com
- **Password:** password123
- **Access:** Full admin panel

## 📋 How to View Orders

### As a Customer:
1. Go to http://localhost:5173
2. Click "Login" in the header
3. Login with john@example.com / password123
4. Go to "Account" page
5. You'll see your order history
6. Click on any order to see detailed view

### As an Admin:
1. Go to http://localhost:5173/admin/login
2. Login with admin@example.com / password123
3. Go to "Orders" in admin panel
4. View all orders in the system

## 📦 Sample Orders Created

The seed script created these sample orders:

1. **Paid Order** - John Doe (john@example.com)
   - 2x Periodic Table Shirt
   - 1x Galaxy Poster
   - Status: Paid, not delivered

2. **Unpaid Order** - Jane Smith (jane@example.com)
   - 1x Beaker Mug
   - Status: Pending payment

3. **Delivered Order** - Various customers
   - Multiple products
   - Status: Paid and delivered

## 🔧 Troubleshooting

### If orders don't appear:
1. Check MongoDB connection
2. Run seed script again: \`cd server && node seed-full-demo.js\`
3. Clear browser cache and try again

### If login doesn't work:
1. Check if server is running
2. Verify database connection
3. Try creating a new user account

## 📱 Order Features to Test

- ✅ Order timeline with status updates
- ✅ Order items with images and prices
- ✅ Shipping address display
- ✅ Payment status tracking
- ✅ Order summary with totals
- ✅ Download invoice (placeholder)
- ✅ Leave reviews for delivered orders
- ✅ Contact support from order page

## 🎯 Next Steps

1. **Test the complete order flow:**
   - Add items to cart
   - Go through checkout
   - Complete payment
   - View order confirmation

2. **Test admin features:**
   - View all orders
   - Update order status
   - Process refunds
   - Generate reports

3. **Customize the order experience:**
   - Add real product images
   - Implement real payment processing
   - Add email notifications
   - Enhance order tracking

Happy testing! 🎉
`;

fs.writeFileSync('ORDER_DEMO_GUIDE.md', quickStartGuide);

console.log('✅ Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Start your servers: npm run dev');
console.log('2. Open http://localhost:5173');
console.log('3. Login with john@example.com / password123');
console.log('4. Go to Account page to see your orders');
console.log('\n📖 See ORDER_DEMO_GUIDE.md for detailed instructions');
console.log('\n🔑 Test credentials:');
console.log('   Customer: john@example.com / password123');
console.log('   Admin: admin@example.com / password123'); 