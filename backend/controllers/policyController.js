const mongoose = require("mongoose");
const Policy = require("../models/policyModel");

// GET all policies
const getPolicies = async (req, res) => {
  try {
    const policies = await Policy.find();
    res.status(200).json(policies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET single policy
const getPolicy = async (req, res) => {
  try {
    const { policyKey } = req.params;

    const policy = await Policy.findOne({ policyKey });

    if (!policy) {
      return res.status(404).json({ error: "Policy not found" });
    }

    res.status(200).json(policy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE policy (optional but useful)
const createPolicy = async (req, res) => {
  try {
    const { policyKey, title, content } = req.body;

    if (!policyKey || !title || !content) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Check if the policyKey already exists
    const existing = await Policy.findOne({ policyKey });
    if (existing) {
      return res.status(400).json({ error: `Policy key "${policyKey}" already exists.` });
    }

    // Create policy
    const policy = await Policy.create({
      policyKey,
      title,
      content,
      lastUpdated: new Date(),
    });

    // Create Notification and Emit
    const notificationController = require('./notificationController');
    const socket = require('../socket');
    const creatorName = `${req.user.firstName} ${req.user.lastName}`;
    
    const notification = await notificationController.createNotification({
      title: `${creatorName} created a new policy: ${title}`,
      content: `A new platform policy has been added.`,
      type: 'update',
      path: '/admin/content',
      unread: true,
      createdBy: req.user._id
    });
    socket.emitUpdate('newNotification', notification);

    res.status(201).json(policy);
  } catch (error) {
    // Handle validation errors separately
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    console.error("Create Policy Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// UPDATE policy
const updatePolicy = async (req, res) => {
  try {
    const { policyKey } = req.params;
    const { title, content } = req.body;

    const updatedPolicy = await Policy.findOneAndUpdate(
      { policyKey },
      {
        title,
        content,
        lastUpdated: new Date(),
      },
      { new: true }
    );

    if (!updatedPolicy) {
      return res.status(404).json({ error: "Policy not found" });
    }

    // Create Notification and Emit
    const notificationController = require('./notificationController');
    const socket = require('../socket');
    const creatorName = `${req.user.firstName} ${req.user.lastName}`;
    
    const notification = await notificationController.createNotification({
      title: `${creatorName} updated a policy: ${title}`,
      content: `The policy "${title}" has been modified.`,
      type: 'update',
      path: '/admin/content',
      unread: true,
      createdBy: req.user._id
    });
    socket.emitUpdate('newNotification', notification);

    res.status(200).json(updatedPolicy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE policy
const deletePolicy = async (req, res) => {
  try {
    const { policyKey } = req.params;

    const deletedPolicy = await Policy.findOneAndDelete({ policyKey });

    if (!deletedPolicy) {
      return res.status(404).json({ error: "Policy not found" });
    }

    res.status(200).json({ message: "Policy deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
};