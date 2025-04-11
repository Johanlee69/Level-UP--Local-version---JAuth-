const mongoose = require('mongoose');


const connectDB = async () => {
  try {
    // Debug log to check if MONGO_URI is defined
    if (!process.env.MONGO_URI) {
      console.error('ERROR: MONGO_URI environment variable is not defined in your .env file');
      console.error('Please check your .env file in the server root directory');
      process.exit(1);
    }
    
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    
    const db = mongoose.connection.db;
    

  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB; 