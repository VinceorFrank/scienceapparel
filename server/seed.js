require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Category = require('./models/Category');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/scienceapparel';

// Function to ensure product images exist
const ensureProductImages = () => {
  const imagesDir = path.join(__dirname, 'uploads', 'images');
  const placeholderPath = path.join(imagesDir, 'placeholder.PNG');
  
  // List of required product images
  const requiredImages = [
    'beaker-mug.jpg',
    'serotonin-necklace.jpg', 
    'cosmos-book.jpg',
    'periodic-shirt.jpg',
    'galaxy-poster.jpg',
    'microscope.jpg'
  ];

  console.log('--- Ensuring Product Images Exist ---');
  
  requiredImages.forEach(imageName => {
    const imagePath = path.join(imagesDir, imageName);
    if (!fs.existsSync(imagePath)) {
      if (fs.existsSync(placeholderPath)) {
        fs.copyFileSync(placeholderPath, imagePath);
        console.log(`✅ Created ${imageName}`);
      } else {
        console.log(`⚠️ Warning: placeholder.PNG not found, cannot create ${imageName}`);
      }
    } else {
      console.log(`✅ ${imageName} already exists`);
    }
  });
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected for Seeding...');

    // Ensure all required product images exist
    ensureProductImages();

    // Clear existing data
    console.log('--- Clearing Existing Data ---');
    await Order.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});
    await Category.deleteMany({});
    console.log('✅ Existing data cleared.');

    // --- Create Categories ---
    console.log('--- Seeding Categories ---');
    const categoriesToSeed = [
      { name: 'Apparel', description: 'Clothing and wear.' },
      { name: 'Lab Equipment', description: 'Tools and equipment for labs.' },
      { name: 'Books', description: 'Science and educational books.' },
      { name: 'Posters & Art', description: 'Scientific posters and art prints.' },
    ];
    const createdCategories = await Category.insertMany(categoriesToSeed);
    console.log('✅ Categories seeded.');

    // --- Create Users ---
    console.log('--- Seeding Users ---');
    const usersToSeed = [
      { name: 'Admin User', email: 'admin@example.com', password: 'password123', isAdmin: true, role: 'admin' },
      { name: 'John Doe', email: 'john@example.com', password: 'password123', role: 'customer' },
      { name: 'Jane Smith', email: 'jane@example.com', password: 'password123', role: 'customer' },
    ];
    const createdUsers = await User.create(usersToSeed);
    const adminUser = createdUsers[0];
    const customerUser1 = createdUsers[1];
    const customerUser2 = createdUsers[2];
    console.log('✅ Users seeded.');

    // --- Create Products ---
    console.log('--- Seeding Products ---');
    const productsToSeed = [
      { name: 'Beaker Mug', description: 'A mug shaped like a laboratory beaker.', price: 15.99, stock: 100, category: createdCategories[1]._id, image: 'beaker-mug.jpg' },
      { name: 'Serotonin Molecule Necklace', description: 'A stylish necklace featuring the serotonin molecule.', price: 25.50, stock: 50, category: createdCategories[0]._id, image: 'serotonin-necklace.jpg' },
      { name: 'The Cosmos by Carl Sagan', description: 'A classic book on space and the universe.', price: 19.99, stock: 80, category: createdCategories[2]._id, image: 'cosmos-book.jpg' },
      { name: 'Periodic Table T-Shirt', description: 'A comfortable t-shirt with the periodic table printed on it.', price: 22.00, stock: 120, category: createdCategories[0]._id, image: 'periodic-shirt.jpg' },
      { name: 'Galaxy Wall Poster', description: 'A high-quality print of a stunning galaxy.', price: 12.00, stock: 200, category: createdCategories[3]._id, image: 'galaxy-poster.jpg' },
      { name: 'Microscope Set', description: 'A beginner microscope set for all ages.', price: 75.00, stock: 30, category: createdCategories[1]._id, image: 'microscope.jpg' },
    ];
    const createdProducts = await Product.insertMany(productsToSeed);
    console.log('✅ Products seeded.');

    // --- Add Reviews to Products ---
    console.log('--- Seeding Reviews ---');
    // Add review for The Cosmos
    createdProducts[2].reviews.push({ user: customerUser1._id, name: customerUser1.name, rating: 5, comment: 'An absolute masterpiece!' });
    // Add review for Periodic Table T-Shirt
    createdProducts[3].reviews.push({ user: customerUser2._id, name: customerUser2.name, rating: 4, comment: 'Great quality, but it runs a bit small.' });
    createdProducts[3].reviews.push({ user: customerUser1._id, name: customerUser1.name, rating: 5, comment: 'Love this shirt!' });
    // Update review counts
    createdProducts[2].numReviews = 1;
    createdProducts[2].rating = 5;
    createdProducts[3].numReviews = 2;
    createdProducts[3].rating = 4.5;
    await createdProducts[2].save();
    await createdProducts[3].save();
    console.log('✅ Reviews seeded.');

    // --- Create Orders ---
    console.log('--- Seeding Orders ---');
    const ordersToSeed = [
      { // Order 1, 1 day ago
        user: customerUser1._id,
        orderItems: [
          { name: createdProducts[0].name, qty: 1, image: createdProducts[0].image, price: createdProducts[0].price, product: createdProducts[0]._id },
          { name: createdProducts[2].name, qty: 1, image: createdProducts[2].image, price: createdProducts[2].price, product: createdProducts[2]._id },
        ],
        shippingAddress: { address: '123 Main St', city: 'Anytown', postalCode: '12345', country: 'USA' },
        paymentMethod: 'PayPal',
        totalPrice: 35.98,
        isPaid: true,
        paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      { // Order 2, 3 days ago
        user: customerUser2._id,
        orderItems: [{ name: createdProducts[3].name, qty: 2, image: createdProducts[3].image, price: createdProducts[3].price, product: createdProducts[3]._id }],
        shippingAddress: { address: '456 Oak Ave', city: 'Someville', postalCode: '54321', country: 'USA' },
        paymentMethod: 'Stripe',
        totalPrice: 44.00,
        isPaid: true,
        paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      { // Order 3, 5 days ago (unpaid)
        user: customerUser1._id,
        orderItems: [{ name: createdProducts[4].name, qty: 1, image: createdProducts[4].image, price: createdProducts[4].price, product: createdProducts[4]._id }],
        shippingAddress: { address: '123 Main St', city: 'Anytown', postalCode: '12345', country: 'USA' },
        paymentMethod: 'PayPal',
        totalPrice: 12.00,
        isPaid: false,
      }
    ];
    await Order.insertMany(ordersToSeed);
    console.log('✅ Orders seeded.');

    console.log('\nDatabase seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

seedDatabase(); 