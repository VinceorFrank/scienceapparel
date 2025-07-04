require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const faker = require('faker');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Category = require('./models/Category');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/scienceapparel';
const NUM_USERS = parseInt(process.env.SEED_USERS || process.argv[2] || 10, 10);
const NUM_PRODUCTS = parseInt(process.env.SEED_PRODUCTS || process.argv[3] || 20, 10);
const NUM_CATEGORIES = parseInt(process.env.SEED_CATEGORIES || process.argv[4] || 4, 10);

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

const hashPassword = async (plain) => await bcrypt.hash(plain, 10);

const randomCategory = (categories) => categories[Math.floor(Math.random() * categories.length)]._id;

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
    // Add more random categories if needed
    for (let i = 4; i < NUM_CATEGORIES; i++) {
      categoriesToSeed.push({
        name: faker.commerce.department() + ' ' + faker.random.word(),
        description: faker.lorem.sentence(),
      });
    }
    const createdCategories = await Category.insertMany(categoriesToSeed);
    console.log('✅ Categories seeded.');

    // --- Create Users ---
    console.log('--- Seeding Users ---');
    const usersToSeed = [
      { name: 'Admin User', email: 'admin@example.com', password: await hashPassword('password123'), isAdmin: true, role: 'admin' },
      { name: 'John Doe', email: 'john@example.com', password: await hashPassword('password123'), role: 'customer' },
      { name: 'Jane Smith', email: 'jane@example.com', password: await hashPassword('password123'), role: 'customer' },
    ];
    for (let i = 3; i < NUM_USERS; i++) {
      usersToSeed.push({
        name: faker.name.findName(),
        email: faker.internet.email(),
        password: await hashPassword('password123'),
        role: 'customer',
      });
    }
    const createdUsers = await User.create(usersToSeed);
    const adminUser = createdUsers[0];
    const customerUser1 = createdUsers[1];
    const customerUser2 = createdUsers[2];
    console.log('✅ Users seeded.');

    // --- Create Products ---
    console.log('--- Seeding Products ---');
    const productImages = [
      'beaker-mug.jpg',
      'serotonin-necklace.jpg',
      'cosmos-book.jpg',
      'periodic-shirt.jpg',
      'galaxy-poster.jpg',
      'microscope.jpg',
    ];
    const productsToSeed = [
      { name: 'Beaker Mug', description: 'A mug shaped like a laboratory beaker.', price: 15.99, stock: 100, category: createdCategories[1]._id, image: 'beaker-mug.jpg' },
      { name: 'Serotonin Molecule Necklace', description: 'A stylish necklace featuring the serotonin molecule.', price: 25.50, stock: 50, category: createdCategories[0]._id, image: 'serotonin-necklace.jpg' },
      { name: 'The Cosmos by Carl Sagan', description: 'A classic book on space and the universe.', price: 19.99, stock: 80, category: createdCategories[2]._id, image: 'cosmos-book.jpg' },
      { name: 'Periodic Table T-Shirt', description: 'A comfortable t-shirt with the periodic table printed on it.', price: 22.00, stock: 120, category: createdCategories[0]._id, image: 'periodic-shirt.jpg' },
      { name: 'Galaxy Wall Poster', description: 'A high-quality print of a stunning galaxy.', price: 12.00, stock: 200, category: createdCategories[3]._id, image: 'galaxy-poster.jpg' },
      { name: 'Microscope Set', description: 'A beginner microscope set for all ages.', price: 75.00, stock: 30, category: createdCategories[1]._id, image: 'microscope.jpg' },
    ];
    for (let i = 6; i < NUM_PRODUCTS; i++) {
      productsToSeed.push({
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price()),
        stock: faker.datatype.number({ min: 10, max: 200 }),
        category: randomCategory(createdCategories),
        image: faker.random.arrayElement(productImages),
      });
    }
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

    // --- Summary Output ---
    console.log(`\nDatabase seeding completed successfully!`);
    console.log(`Seeded: ${createdUsers.length} users, ${createdProducts.length} products, ${createdCategories.length} categories.`);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

seedDatabase(); 