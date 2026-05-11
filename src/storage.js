import { MongoClient, ServerApiVersion } from 'mongodb';

let client = null;
let db = null;

async function getDb(env) {
  if (db) return db;
  
  const uri = env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  if (!client) {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
  }

  try {
    await client.connect();
    // Optional: ping to ensure connection
    // await client.db("admin").command({ ping: 1 });
    db = client.db(env.MONGO_DB_NAME || 'trading_bot_db');
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export async function loadState(env) {
  try {
    const database = await getDb(env);
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

export async function saveState(state, env) {
  try {
    const database = await getDb(env);
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

export async function loadTrades(env) {
  try {
    const database = await getDb(env);
    const trades = await database.collection('trades').find({}).toArray();
    return trades.map(({ _id, ...trade }) => trade);
  } catch (error) {
    console.error("Error loading trades from MongoDB:", error);
    return [];
  }
}

export async function saveTrades(trades, env) {
  try {
    const database = await getDb(env);
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

export const storage = {
  saveState: async (symbol, signal, env) => {
    const database = await getDb(env);
    await database.collection('states').updateOne(
      { symbol },
      { $set: { signal, updatedAt: new Date() } },
      { upsert: true }
    );
  },

  getState: async (symbol, env) => {
    const database = await getDb(env);
    const result = await database.collection('states').findOne({ symbol });
    return result ? result.signal : 'HOLD';
  },

  addTrade: async (trade, env) => {
    const database = await getDb(env);
    return await database.collection('trades').insertOne({
      ...trade,
      createdAt: new Date()
    });
  }
};
