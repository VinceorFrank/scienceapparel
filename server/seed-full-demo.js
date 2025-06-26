const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const ActivityLog = require('./models/ActivityLog');
const Category = require('./models/Category');
const Support = require('./models/Support');
const NewsletterSubscriber = require('./models/NewsletterSubscriber');
const NewsletterCampaign = require('./models/NewsletterCampaign');
const config = require('./config/env');

// Helper for random selection
function getRandom(arr, n) {
  const shuffled = arr.slice(0);
  let i = arr.length;
  let min = i - n;
  let temp, index;
  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(min);
}

async function seed() {
  await mongoose.connect(config.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  // Clear collections
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    ActivityLog.deleteMany({}),
    Category.deleteMany({}),
    Support.deleteMany({}),
    NewsletterSubscriber.deleteMany({}),
    NewsletterCampaign.deleteMany({}),
  ]);
  console.log('Cleared all collections');

  // --- CATEGORIES ---
  const categoryNames = ['Apparel', 'Accessories', 'Poster', 'Lab Equipment', 'Billing', 'Shipping', 'Technical', 'General'];
  const categories = await Category.insertMany(categoryNames.map(name => ({ name })));

  // --- USERS ---
  // Admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    isAdmin: true,
    role: 'admin',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  });
  // 10 customers
  const customerData = Array.from({ length: 10 }).map((_, i) => ({
    name: `User${i + 1}`,
    email: `user${i + 1}@example.com`,
    password: 'password123',
    role: 'customer',
    createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
    updatedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
    address: {
      address: `${100 + i} Main St`,
      city: 'Anytown',
      postalCode: `1234${i}`,
      country: 'USA',
    },
  }));
  const customers = await User.insertMany(customerData);

  // --- PRODUCTS ---
  // Tags example: ['science', 'gift'], ['popular', 'new'], ['lab', 'equipment']
  const productData = [
    {
      name: 'Periodic Table Shirt',
      description: 'A stylish shirt featuring the periodic table of elements.',
      image: '/uploads/images/periodic-shirt.jpg',
      price: 25.99,
      stock: 2,
      category: categories[0]._id,
      featured: true,
      tags: ['science', 'apparel'],
    },
    {
      name: 'Galaxy Poster',
      description: 'A beautiful poster of the galaxy, perfect for science lovers.',
      image: '/uploads/images/galaxy-poster.jpg',
      price: 15.99,
      stock: 50,
      category: categories[2]._id,
      tags: ['poster', 'space', 'popular'],
    },
    {
      name: 'Beaker Mug',
      description: 'A mug shaped like a laboratory beaker.',
      image: '/uploads/images/beaker-mug.jpg',
      price: 12.99,
      stock: 1,
      category: categories[1]._id,
      archived: true,
      tags: ['lab', 'equipment', 'gift'],
    },
    {
      name: 'Microscope',
      description: 'A high-quality microscope for students and professionals.',
      image: '/uploads/images/microscope.jpg',
      price: 120.00,
      stock: 10,
      category: categories[3]._id,
      discountPrice: 99.99,
      tags: ['lab', 'equipment'],
    },
    {
      name: 'Serotonin Necklace',
      description: 'A necklace featuring the serotonin molecule, for science fans.',
      image: '/uploads/images/serotonin-necklace.jpg',
      price: 18.00,
      stock: 0,
      category: categories[1]._id,
      tags: ['accessories', 'molecule'],
    },
    // Add 10 more products with similar structure, varying stock, price, tags, and categories
  ];
  // Add more products to reach 15
  for (let i = 5; i < 15; i++) {
    productData.push({
      name: `Product ${i + 1}`,
      description: `Description for product ${i + 1}.`,
      image: `/uploads/images/product${i + 1}.jpg`,
      price: 10 + i,
      stock: i % 3 === 0 ? 0 : (i % 5 === 0 ? 5 : 20),
      category: categories[i % categories.length]._id,
      tags: i % 2 === 0 ? ['science', 'gift'] : ['popular', 'new'],
    });
  }
  const products = await Product.insertMany(productData);

  // --- REVIEWS ---
  // Each product gets 3 reviews from 3 random users
  for (const product of products) {
    const reviewers = getRandom(customers, 3);
    product.reviews = [
      { user: reviewers[0]._id, name: reviewers[0].name, rating: 5, comment: 'Amazing product!' },
      { user: reviewers[1]._id, name: reviewers[1].name, rating: 4, comment: 'Very good, would recommend.' },
      { user: reviewers[2]._id, name: reviewers[2].name, rating: 1, comment: 'Not what I expected.' },
    ];
    product.numReviews = 3;
    product.rating = 3.3;
    await product.save();
  }

  // --- ORDERS ---
  // Helper for order dates
  const today = new Date();
  function daysAgo(n) {
    const d = new Date(today);
    d.setDate(today.getDate() - n);
    return d;
  }
  const orderData = [
    // Paid order, multiple products
    {
      user: customers[0]._id,
      orderItems: [
        { product: products[0]._id, name: products[0].name, qty: 2, price: products[0].price, image: products[0].image },
        { product: products[1]._id, name: products[1].name, qty: 1, price: products[1].price, image: products[1].image },
      ],
      shippingAddress: { address: '123 Main St', city: 'Anytown', postalCode: '12345', country: 'USA' },
      paymentMethod: 'PayPal',
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: 2 * products[0].price + products[1].price,
      isPaid: true,
      paidAt: daysAgo(0),
      isDelivered: false,
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    },
    // Unpaid order, single product
    {
      user: customers[1]._id,
      orderItems: [
        { product: products[2]._id, name: products[2].name, qty: 1, price: products[2].price, image: products[2].image },
      ],
      shippingAddress: { address: '456 Oak St', city: 'Anytown', postalCode: '12346', country: 'USA' },
      paymentMethod: 'Credit Card',
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: products[2].price,
      isPaid: false,
      isDelivered: false,
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    // Pending order, multiple products
    {
      user: customers[2]._id,
      orderItems: [
        { product: products[3]._id, name: products[3].name, qty: 1, price: products[3].price, image: products[3].image },
        { product: products[4]._id, name: products[4].name, qty: 2, price: products[4].price, image: products[4].image },
      ],
      shippingAddress: { address: '789 Pine St', city: 'Anytown', postalCode: '12347', country: 'USA' },
      paymentMethod: 'PayPal',
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: products[3].price + 2 * products[4].price,
      isPaid: false,
      isDelivered: false,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
    // Returned order (paid & delivered)
    {
      user: customers[3]._id,
      orderItems: [
        { product: products[5]._id, name: products[5].name, qty: 1, price: products[5].price, image: products[5].image },
      ],
      shippingAddress: { address: '101 Maple St', city: 'Anytown', postalCode: '12348', country: 'USA' },
      paymentMethod: 'Credit Card',
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: products[5].price,
      isPaid: true,
      paidAt: daysAgo(3),
      isDelivered: true,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
    // Returned order (paid & delivered)
    {
      user: customers[4]._id,
      orderItems: [
        { product: products[6]._id, name: products[6].name, qty: 2, price: products[6].price, image: products[6].image },
      ],
      shippingAddress: { address: '202 Birch St', city: 'Anytown', postalCode: '12349', country: 'USA' },
      paymentMethod: 'PayPal',
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: 2 * products[6].price,
      isPaid: true,
      paidAt: daysAgo(4),
      isDelivered: true,
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
    },
    // Add more orders to reach 10+ as needed, varying users, products, and dates
  ];
  // Add more orders for demo
  for (let i = 5; i < 12; i++) {
    orderData.push({
      user: customers[i % customers.length]._id,
      orderItems: [
        { product: products[i % products.length]._id, name: products[i % products.length].name, qty: 1 + (i % 3), price: products[i % products.length].price, image: products[i % products.length].image },
      ],
      shippingAddress: { address: `${300 + i} Elm St`, city: 'Anytown', postalCode: `1235${i}`, country: 'USA' },
      paymentMethod: i % 2 === 0 ? 'PayPal' : 'Credit Card',
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: (1 + (i % 3)) * products[i % products.length].price,
      isPaid: true,
      paidAt: daysAgo(i % 7),
      isDelivered: i % 2 === 0,
      createdAt: daysAgo(i % 7),
      updatedAt: daysAgo(i % 7),
    });
  }
  const orders = await Order.insertMany(orderData);

  // --- SUPPORT TICKETS ---
  const supportTickets = [
    {
      customerName: customers[0].name,
      customerEmail: customers[0].email,
      subject: 'Order not received',
      message: 'I placed an order last week but have not received it yet.',
      category: 'shipping',
      priority: 'high',
      status: 'open',
      orderId: orders[0]._id,
      assignedTo: admin._id,
      responses: [
        {
          adminId: admin._id,
          adminName: admin.name,
          message: 'We are looking into your order and will update you soon.',
          isInternal: false,
        }
      ],
      tags: ['urgent', 'order'],
    },
    {
      customerName: customers[1].name,
      customerEmail: customers[1].email,
      subject: 'Refund request',
      message: 'I would like a refund for my last order.',
      category: 'refund',
      priority: 'medium',
      status: 'resolved',
      orderId: orders[1]._id,
      assignedTo: admin._id,
      responses: [
        {
          adminId: admin._id,
          adminName: admin.name,
          message: 'Refund processed. You should see the amount in your account soon.',
          isInternal: false,
        }
      ],
      satisfaction: 5,
      tags: ['refund'],
    },
    {
      customerName: customers[2].name,
      customerEmail: customers[2].email,
      subject: 'Technical issue with login',
      message: 'I cannot log in to my account.',
      category: 'technical',
      priority: 'urgent',
      status: 'in_progress',
      assignedTo: admin._id,
      tags: ['login', 'technical'],
    },
    {
      customerName: customers[3].name,
      customerEmail: customers[3].email,
      subject: 'Product question',
      message: 'Is the beaker mug dishwasher safe?',
      category: 'product',
      priority: 'low',
      status: 'waiting_customer',
      productId: products[2]._id,
      assignedTo: admin._id,
      tags: ['product'],
    },
    {
      customerName: customers[4].name,
      customerEmail: customers[4].email,
      subject: 'Billing error',
      message: 'I was charged twice for my order.',
      category: 'billing',
      priority: 'high',
      status: 'open',
      orderId: orders[4]._id,
      assignedTo: admin._id,
      tags: ['billing', 'error'],
    },
  ];
  await Support.insertMany(supportTickets);

  // --- NEWSLETTER SUBSCRIBERS ---
  const newsletterSubscribers = [
    { email: 'subscriber1@example.com', status: 'subscribed' },
    { email: 'subscriber2@example.com', status: 'subscribed' },
    { email: 'subscriber3@example.com', status: 'unsubscribed', unsubscribedAt: new Date() },
    { email: customers[0].email, status: 'subscribed' },
    { email: customers[1].email, status: 'subscribed' },
  ];
  await NewsletterSubscriber.insertMany(newsletterSubscribers);

  // --- NEWSLETTER CAMPAIGNS ---
  const newsletterCampaigns = [
    {
      subject: 'Welcome to Science Apparel!',
      message: 'Thank you for subscribing to our newsletter.',
      html: '<h1>Welcome!</h1><p>Thank you for subscribing to our newsletter.</p>',
      recipientCount: 4,
      sentBy: admin._id,
      status: 'sent',
      sentAt: daysAgo(2),
      isScheduled: false,
    },
    {
      subject: 'Upcoming Sale!',
      message: 'Don\'t miss our upcoming sale on lab equipment.',
      html: '<h1>Upcoming Sale!</h1><p>Don\'t miss our upcoming sale on lab equipment.</p>',
      recipientCount: 5,
      sentBy: admin._id,
      status: 'scheduled',
      scheduledAt: daysAgo(-2),
      isScheduled: true,
    },
    {
      subject: 'New Products Released',
      message: 'Check out our new science-themed products.',
      html: '<h1>New Products!</h1><p>Check out our new science-themed products.</p>',
      recipientCount: 5,
      sentBy: admin._id,
      status: 'sent',
      sentAt: daysAgo(0),
      isScheduled: false,
    },
  ];
  await NewsletterCampaign.insertMany(newsletterCampaigns);

  // --- ACTIVITY LOGS ---
  const adminActions = [
    'login', 'add_product', 'update_stock', 'delete_product', 'refund_order', 'update_category', 'view_orders', 'view_users', 'view_dashboard', 'view_activity_log',
    'send_newsletter', 'schedule_newsletter', 'import_subscribers', 'resolve_support_ticket', 'assign_support_ticket', 'reply_support_ticket'
  ];
  const activityLogs = adminActions.map((action, i) => ({
    user: admin._id,
    action,
    description: `Admin performed ${action.replace('_', ' ')}`,
    createdAt: daysAgo(i),
  }));
  await ActivityLog.insertMany(activityLogs);

  console.log('Seed data created!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
}); 