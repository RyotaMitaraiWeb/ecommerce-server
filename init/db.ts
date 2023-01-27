import mongoose from "mongoose";

mongoose.set('runValidators', true).set('strictQuery', true);

/**
 * Connects the application to the database at the given URL.
 * 
 * To configure Mongoose options, check ``/init/db.ts``
 */
export async function connectToDB(url: string) {    
    await mongoose.connect(url);
}