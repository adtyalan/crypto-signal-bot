import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME || 'trading_bot_db';

if (!uri) {
  console.error("❌ MONGO_URI atau MONGO_DB_NAME tidak ditemukan di .env");
  process.exit(1);
}

async function cleanup() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("✅ Terhubung ke MongoDB Atlas");
    
    const db = client.db(dbName);
    
    // Hapus koleksi states dan trades
    const resStates = await db.collection('states').deleteMany({});
    const resTrades = await db.collection('trades').deleteMany({});
    
    console.log(`🧹 Berhasil membersihkan:`);
    console.log(`   - States: ${resStates.deletedCount} dokumen dihapus`);
    console.log(`   - Trades: ${resTrades.deletedCount} dokumen dihapus`);
    
  } catch (error) {
    console.error("❌ Terjadi kesalahan:", error.message);
  } finally {
    await client.close();
    process.exit(0);
  }
}

cleanup();
