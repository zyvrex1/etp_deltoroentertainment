const mongoose = require("mongoose");
const Announcement = require("../models/announcementModel");

// GET all announcements
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ date: -1 });
    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE announcement
const createAnnouncement = async (req, res) => {
  try {
    const { title, date, content, contentcategory } = req.body;

    if (!title || !date || !content) {
      return res.status(400).json({ error: "Please fill in all required fields." });
    }

    const announcement = await Announcement.create({
      title,
      date,
      content,
      contentcategory,
    });

    // Create Notification and Emit
    const notificationController = require('./notificationController');
    const socket = require('../socket');
    const creatorName = `${req.user.firstName} ${req.user.lastName}`;
    
    const notification = await notificationController.createNotification({
      title: `${creatorName} shared an update: ${title}`,
      content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      type: 'update',
      path: '/admin/content',
      unread: true,
      createdBy: req.user._id
    });
    socket.emitUpdate('newNotification', notification);

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE announcement
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedAnnouncement) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    res.status(200).json(updatedAnnouncement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE announcement
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    const deletedAnnouncement = await Announcement.findByIdAndDelete(id);

    if (!deletedAnnouncement) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    res.status(200).json({ message: "Announcement deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};