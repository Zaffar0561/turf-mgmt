import mongoose, { connect } from "mongoose";

const Connectdb = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI;
    const dbName = process.env.MONGO_DB_NAME;
    if (!mongoUrl) {
      throw new Error("MONGO_URL or MONGO_URI must be defined in environment variables");
    }
    await mongoose.connect(mongoUrl, dbName ? { dbName } : undefined);
    console.log(`✅ MongoDb connected successfully${dbName ? ` to ${dbName}` : ""}`);
  } catch (error) {
    console.error("❌ MongoDb failed to connect", error);
    process.exit(1);
  }
};

export default Connectdb;
