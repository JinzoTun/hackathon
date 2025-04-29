import mongoose from 'mongoose';
import { DB_URI, NODE_ENV } from '../config/env.js';

if (!DB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
}

const connectToDataBase = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log(`Connected to database in ${NODE_ENV} mode`);
    } catch (error) {
        console.error(`Error connecting to database : ${error.message}`);
        process.exit(1);
    }
}

export default connectToDataBase;