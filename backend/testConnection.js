const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://zyvrexperez:zyvrexperez11032003%40@eticketspro.dhn8ypa.mongodb.net/eticketspro?retryWrites=true&w=majority")
  .then(() => {
    console.log("Connected successfully to MongoDB!");
    process.exit(0); // exit after testing
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });