const mongoose = require('mongoose');
require('dotenv').config();

const searchFullDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            const name = col.name;
            const count = await mongoose.connection.db.collection(name).countDocuments();
            console.log(`Checking collection ${name} (${count} docs)...`);

            const docs = await mongoose.connection.db.collection(name).find({}).toArray();
            docs.forEach(doc => {
                const str = JSON.stringify(doc);
                if (str.includes("Llhesde")) {
                    console.log(`FOUND IN ${name}:`);
                    console.log(JSON.stringify(doc, null, 2));
                }
            });
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

searchFullDB();
