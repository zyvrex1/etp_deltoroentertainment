const mongoose = require("mongoose");
const Event = require("./backend/models/eventModel");
require("dotenv").config({ path: "./backend/.env" });

const checkEvent = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
        
        const id = "69c727f25063b57696e0774e";
        const event = await Event.findById(id);
        
        if (event) {
            console.log("Event found:");
            console.log("Title:", event.title);
            console.log("Status:", event.status);
            console.log("End Date:", event.endDate);
            console.log("End Time:", event.endTime);
        } else {
            console.log("Event NOT found with ID:", id);
        }
        
        await mongoose.connection.close();
    } catch (error) {
        console.error("Error:", error);
    }
};

checkEvent();
