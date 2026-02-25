require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/userModel");

const createAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Check if Super Admin exists
    const superAdminExists = await User.findOne({ role: "superadmin" });
    if (!superAdminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("SuperAdmin123!", salt);

      await User.create({
        firstName: "Joey",
        lastName: "Del Toro",
        email: "superadmin@gmail.com",
        password: hashedPassword,
        role: "superadmin",
      });

      console.log("Super Admin created successfully");
    } else {
      console.log("Super Admin already exists");
    }

    // Create first admin (Ehdsell)
    const admin1Exists = await User.findOne({ email: "admin@gmail.com" });
    if (!admin1Exists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Admin123!", salt);

      await User.create({
        firstName: "Ehdsell",
        lastName: "Apan",
        email: "admin@gmail.com",
        password: hashedPassword,
        role: "admin",
      });

      console.log("Admin Ehdsell created successfully");
    } else {
      console.log("Admin Ehdsell already exists");
    }

    // Create second admin (Zyvrex Perez)
    const admin2Exists = await User.findOne({ email: "admin2@gmail.com" });
    if (!admin2Exists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("Admin123!", salt);

      await User.create({
        firstName: "Zyvrex",
        lastName: "Perez",
        email: "admin2@gmail.com",
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
