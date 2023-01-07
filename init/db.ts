import mongoose from "mongoose";

mongoose.set('runValidators', true).set('strictQuery', true);

export async function connectToDB(url: string) {    
    await mongoose.connect(url);
}