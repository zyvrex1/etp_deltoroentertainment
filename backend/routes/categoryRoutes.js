const express = require("express");
const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

router.get("/", getCategories);
router.get("/:id", getCategory);

// Protected routes (modification requires admin/superadmin)
router.post("/", requireAuth, requireRole("admin", "superadmin"), createCategory);
router.put("/:id", requireAuth, requireRole("admin", "superadmin"), updateCategory);
router.delete("/:id", requireAuth, requireRole("admin", "superadmin"), deleteCategory);

module.exports = router;