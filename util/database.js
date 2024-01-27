const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://rdg6design:@cluster0.opkyxl8.mongodb.net/';

const connectMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

const getMongoDBConnection = () => mongoose.connection;

module.exports = {
  connectMongoDB,
  getMongoDBConnection,
};
