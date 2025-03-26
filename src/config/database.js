import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/authService';
const client = new MongoClient(uri);

let db;
let usersCollection;

function handleConnectionError() {
  console.error('MongoDB connection error. Attempting to reconnect...');
  setTimeout(connectToDatabase, 5000);
}

async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db();
    usersCollection = db.collection('users');
    console.log('Connected to MongoDB');
    
    client.on('error', handleConnectionError);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    handleConnectionError();
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database not connected');
  }
  return db;
}

function getUsersCollection() {
  if (!usersCollection) {
    throw new Error('Database not connected');
  }
  return usersCollection;
}

export {
  connectToDatabase,
  getDb,
  getUsersCollection
};