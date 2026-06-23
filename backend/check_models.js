require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('./config/db');

async function checkModels() {
    await connectDB();
    const modelsPath = path.join(__dirname, 'models');
    const modelFiles = fs.readdirSync(modelsPath).filter(file => file.endsWith('.js'));
    
    console.log('Checking database collections for data...');
    
    for (const file of modelFiles) {
        const Model = require(path.join(modelsPath, file));
        if (Model && Model.modelName) {
            try {
                const count = await Model.countDocuments();
                console.log(`Model ${Model.modelName}: ${count} documents`);
            } catch (err) {
                console.error(`Error checking model ${Model.modelName || file}: ${err.message}`);
            }
        }
    }
    
    process.exit(0);
}

checkModels();
