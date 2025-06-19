require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // 1. Remove existing admin user (if any)
  const adminEmail = 'admin@example.com';
  await User.deleteOne({ email: adminEmail });

  // 2. Create admin user (plain password, let Mongoose hash it)
  const adminPassword = 'Admin123!';
  await User.create({
    name: 'Admin',
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
    isAdmin: true
  });
  console.log(`Admin user created: ${adminEmail} / ${adminPassword}`);

  // 3. Create a sample category
  let category = await Category.findOne({ name: 'Sample Category' });
  if (!category) {
    category = await Category.create({ name: 'Sample Category', description: 'A sample category.' });
    console.log('Sample category created.');
  } else {
    console.log('Sample category already exists.');
  }

  // 4. Create a sample product
  let product = await Product.findOne({ name: 'Sample Product' });
  if (!product) {
    await Product.create({
      name: 'Sample Product',
      description: 'A sample product.',
      price: 19.99,
      stock: 100,
      category: category._id,
      image: 'images/placeholder.PNG',
      featured: true
    });
    console.log('Sample product created.');
  } else {
    console.log('Sample product already exists.');
  }

  await mongoose.connection.close();
  console.log('Seeding complete.');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
}); 