import mongoose from "mongoose";

export const connectDb = async () => {
  try {
    await mongoose.connect("mongodb+srv://kanhaiya49536_db_user:6JlEVON26hqQvjU3@cluster0.sdqganv.mongodb.net/MediCare");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
};
