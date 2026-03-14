const express = require("express");
const router = express.Router();
const {
  getPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
} = require("../controllers/policyController");

// All policies
router.get("/", getPolicies);
// Single policy
router.get("/:policyKey", getPolicy);
// Create
router.post("/", createPolicy);
// Update
router.put("/:policyKey", updatePolicy);
// Delete
router.delete("/:policyKey", deletePolicy);

module.exports = router;