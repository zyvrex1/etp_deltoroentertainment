const express = require("express");
const router = express.Router();
const {
  getPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
} = require("../controllers/policyController");
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

// Single policy
router.get("/:policyKey", getPolicy);

// All policies
router.get("/", getPolicies);

// Protected routes
router.use(requireAuth);
router.use(requireRole('admin', 'superadmin'));

// Create
router.post("/", createPolicy);
// Update
router.put("/:policyKey", updatePolicy);
// Delete
router.delete("/:policyKey", deletePolicy);

module.exports = router;