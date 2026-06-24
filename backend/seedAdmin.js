require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/userModel");

const createAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Create Joey Del Toro (Admin)
    const joeyExists = await User.findOne({ email: "joey@deltoroentertainment.com" });
    if (!joeyExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Admin123!", salt);

      await User.create({
        firstName: "Joey",
        lastName: "Del Toro",
        email: "joey@deltoroentertainment.com",
        password: hashedPassword,
        role: "admin",
      });

      console.log("Admin Joey created successfully");
    } else {
      console.log("Admin Joey already exists");
    }

    // Create first admin (Ehdsell)
    const admin1Exists = await User.findOne({ email: "ehdsell@deltoroentertainment.com" });
    if (!admin1Exists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Admin123!", salt);

      await User.create({
        firstName: "Ehdsell",
        lastName: "Apan",
        email: "ehdsell@deltoroentertainment.com",
        password: hashedPassword,
        role: "admin",
      });

      console.log("Admin Ehdsell created successfully");
    } else {
      console.log("Admin Ehdsell already exists");
    }

    // Create second admin (Zyvrex Perez)
    const admin2Exists = await User.findOne({ email: "zyvrex@deltoroentertainment.com" });
    if (!admin2Exists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Admin123!", salt);

      await User.create({
        firstName: "Zyvrex",
        lastName: "Perez",
        email: "zyvrex@deltoroentertainment.com",
        password: hashedPassword,
        role: "admin",
      });

      console.log("Admin Zyvrex created successfully");
    } else {
      console.log("Admin Zyvrex already exists");
    }

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createAdmins();
