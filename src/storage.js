import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI || "mongodb+srv://alanaditya:<db_password>@cluster0.es1sjrx.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db = null;

async function getDb() {
  if (db) return db;
  try {
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    db = client.db('trading_bot_db');
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// State management (previously state.json)
export async function loadState() {
  try {
    const database = await getDb();
    const results = await database.collection('states').find({}).toArray();
    const state = {};
    results.forEach(item => {
      state[item.symbol] = item.signal;
    });
    return state;
  } catch (error) {
    console.error("Error loading state from MongoDB:", error);
    return {};
  }
}

export async function saveState(state) {
  try {
    const database = await getDb();
    const operations = Object.entries(state).map(([symbol, signal]) => ({
      updateOne: {
        filter: { symbol },
        update: { $set: { signal, updatedAt: new Date() } },
        upsert: true
      }
    }));
    
    if (operations.length > 0) {
      await database.collection('states').bulkWrite(operations);
    }
  } catch (error) {
    console.error("Error saving state to MongoDB:", error);
  }
}

// Trade management (previously trades.json)
export async function loadTrades() {
  try {
    const database = await getDb();
    const trades = await database.collection('trades').find({}).toArray();
    // We remove the MongoDB _id to keep the object clean for the rest of the app
    return trades.map(({ _id, ...trade }) => trade);
  } catch (error) {
    console.error("Error loading trades from MongoDB:", error);
    return [];
  }
}

export async function saveTrades(trades) {
  try {
    const database = await getDb();
    const operations = trades.map(trade => ({
      updateOne: {
        filter: { id: trade.id },
        update: { $set: { ...trade, updatedAt: new Date() } },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await database.collection('trades').bulkWrite(operations);
    }
  } catch (error) {
    console.error("Error saving trades to MongoDB:", error);
  }
}

// Extra methods based on user reference
export const storage = {
  saveState: async (symbol, signal) => {
    const database = await getDb();
    await database.collection('states').updateOne(
      { symbol },
      { $set: { signal, updatedAt: new Date() } },
      { upsert: true }
    );
  },

  getState: async (symbol) => {
    const database = await getDb();
    const result = await database.collection('states').findOne({ symbol });
    return result ? result.signal : 'HOLD';
  },

  addTrade: async (trade) => {
    const database = await getDb();
    return await database.collection('trades').insertOne({
      ...trade,
      createdAt: new Date()
    });
  }
};
