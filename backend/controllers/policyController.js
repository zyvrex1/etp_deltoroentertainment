const mongoose = require("mongoose");
const Policy = require("../models/policyModel");
const notificationController = require('./notificationController');
const socket = require('../socket');
const { serializePolicy } = require("../serializers/policySerializer");

// GET all policies
const getPolicies = async (req, res) => {
  try {
    const policies = await Policy.find();
    res.status(200).json(policies.map(serializePolicy));
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
    const { policyKey, title, content, publishDate } = req.body;

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
      date: publishDate ? new Date(publishDate) : new Date(),
      lastUpdated: new Date(),
    });

    // Create Notification and Emit
    const creatorName = `${req.user.firstName} ${req.user.lastName}`;
    
    // 1. Notification for Admins
    const adminNotification = await notificationController.createNotification({
      title: `Platform Update: New Policy - ${title}`,
      content: `A new platform policy has been added.`,
      type: 'policy',
      path: '/admin/content',
      unread: true,
      createdBy: req.user._id,
      targetRole: 'admin'
    });
    socket.emitUpdate('newNotification', adminNotification);

    // 2. Notification for Promoters
    const promoterNotification = await notificationController.createNotification({
      title: `Platform Update: New policy added`,
      content: `A new policy "${title}" has been published.`,
      type: 'policy',
      path: '/promoter/promoter-announcement',
      unread: true,
      createdBy: req.user._id,
      targetRole: 'promoter'
    });
    socket.emitUpdate('newNotification', promoterNotification);

    // 3. Notification for Sponsors
    const sponsorNotification = await notificationController.createNotification({
      title: `New Policy: ${title}`,
      content: `A new platform policy has been added. Please review it.`,
      type: 'policy',
      path: '/sponsor',
      unread: true,
      createdBy: req.user._id,
      targetRole: 'sponsor'
    });
    socket.emitUpdate('newNotification', sponsorNotification);

    // 4. Notification for Customers
    const customerNotification = await notificationController.createNotification({
      title: `New Policy: ${title}`,
      content: `A new platform policy has been added. Please review it.`,
      type: 'policy',
      path: '/customer',
      unread: true,
      createdBy: req.user._id,
      targetRole: 'customer'
    });
    socket.emitUpdate('newNotification', customerNotification);

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
    const { title, content, publishDate } = req.body;

    const updateData = {
      title,
      content,
      lastUpdated: new Date(),
    };
    if (publishDate) {
      updateData.date = new Date(publishDate);
    }

    const updatedPolicy = await Policy.findOneAndUpdate(
      { policyKey },
      updateData,
      { new: true }
    );

    if (!updatedPolicy) {
      return res.status(404).json({ error: "Policy not found" });
    }

    // Create Notification and Emit
    const creatorName = `${req.user.firstName} ${req.user.lastName}`;
    
    // 1. Notification for Admins
    const adminNotification = await notificationController.createNotification({
      title: `Platform Update: Policy Modified - ${title}`,
      content: `The policy "${title}" has been modified.`,
      type: 'policy',
      path: '/admin/content',
      unread: true,
      createdBy: req.user._id,
      targetRole: 'admin'
    });
    socket.emitUpdate('newNotification', adminNotification);

    // 2. Notification for Promoters
    const promoterNotification = await notificationController.createNotification({
      title: `Platform Update: Policy modified`,
      content: `The policy "${title}" has been updated.`,
      type: 'policy',
      path: '/promoter/promoter-announcement',
      unread: true,
      createdBy: req.user._id,
      targetRole: 'promoter'
    });
    socket.emitUpdate('newNotification', promoterNotification);

    // 3. Notification for Sponsors
    const sponsorNotification = await notificationController.createNotification({
      title: `Policy Updated: ${title}`,
      content: `The platform policy "${title}" has been updated.`,
      type: 'policy',
      path: '/sponsor',
      unread: true,
      createdBy: req.user._id,
      targetRole: 'sponsor'
    });
    socket.emitUpdate('newNotification', sponsorNotification);

    // 4. Notification for Customers
    const customerNotification = await notificationController.createNotification({
      title: `Policy Updated: ${title}`,
      content: `The platform policy "${title}" has been updated.`,
      type: 'policy',
      path: '/customer',
      unread: true,
      createdBy: req.user._id,
      targetRole: 'customer'
    });
    socket.emitUpdate('newNotification', customerNotification);

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