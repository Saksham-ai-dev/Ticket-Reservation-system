require('dotenv').config();

const { MongoClient } = require('mongodb');

let clientPromise;

function getMongoUri() {
  return process.env.MONGODB_URI || process.env.MONGO_URL;
}

async function getMongoClient() {
  if (clientPromise) {
    try {
      return await clientPromise;
    } catch (error) {
      clientPromise = undefined;
      throw error;
    }
  }

  const uri = getMongoUri();

  if (!uri) {
    throw new Error('Missing MongoDB connection string. Set MONGODB_URI in your environment.');
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 10000
  });

  clientPromise = client.connect();

  try {
    return await clientPromise;
  } catch (error) {
    clientPromise = undefined;
    throw error;
  }
}

async function getDatabase() {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB || process.env.MONGO_DB || 'ticketbooking';
  return client.db(dbName);
}

module.exports = {
  getDatabase,
  getMongoClient
};
