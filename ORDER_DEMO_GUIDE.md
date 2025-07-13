# 🛍️ Order Demo Quick Start Guide

## 🚀 Quick Setup

1. **Start the servers:**
   ```bash
   npm run dev
   ```

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
2. Run seed script again: `cd server && node seed-full-demo.js`
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
