const Concern = require('../models/concernModel');
const socket = require('../socket');
const { optimizeImage } = require("../utils/imageOptimizer");
const path = require('path');
const fs = require('fs');

// @desc    Submit a new concern (Sponsor)
// @route   POST /api/concerns
const createConcern = async (req, res) => {
  const { subject, category, priority, description, event } = req.body;
  const user = req.user;

  try {
    const attachments = req.files ? await Promise.all(req.files.map(async file => {
      const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file.originalname).toLowerCase());
      if (isImage) {
        await optimizeImage(file.path, 70, 1200);
      }
      
      return {
        name: file.originalname,
        path: file.path.replace(/\\/g, '/'),
        size: (fs.statSync(file.path).size / 1024).toFixed(1) + ' KB'
      };
    })) : [];

    const sponsorName = `${user.firstName} ${user.lastName}`;

    const concern = await Concern.create({
      sponsorId: user._id,
      sponsorName,
      subject,
      category,
      priority: priority ? priority.toLowerCase() : 'medium',
      description,
      event,
      attachments,
      messages: [{
        sender: user._id,
        senderName: `${user.firstName} ${user.lastName}`,
        text: description,
        isSystem: false
      }],
      unreadCountAdmin: 1,
      unreadCountSponsor: 0
    });

    // Create Notification for admin
    const notificationController = require('./notificationController');
    const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    const notification = await notificationController.createNotification({
      title: `New ${roleLabel} support ticket: ${sponsorName}`,
      content: `"${subject}"`,
      type: 'concern',
      path: '/admin/support',
      unread: true,
      createdBy: user._id,
      targetRole: 'admin'
    });

    // Emit event to all admins
    socket.emitUpdate('newNotification', notification);
    socket.emitUpdate('newConcern', concern);

    res.status(201).json(concern);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Get all concerns for a sponsor
// @route   GET /api/concerns/sponsor
const getSponsorConcerns = async (req, res) => {
  const user = req.user;
  try {
    const concerns = await Concern.find({ sponsorId: user._id })
      .select('-internalNotes')
      .sort({ lastMessageAt: -1 });

    // Mask admin names for privacy
    const maskedConcerns = concerns.map(c => {
      const obj = c.toObject();
      obj.messages = obj.messages.map(m => {
        // Mask admin sender name
        if (m.sender.toString() !== user._id.toString() && !m.isSystem && m.senderName !== 'System') {
          m.senderName = 'Admin';
        }
        // Mask system message text leaks
        if (m.isSystem && m.text.toLowerCase().includes('assigned to')) {
          m.text = 'Concern has been assigned to a support agent';
        }
        return m;
      });
      // Mask assignment info
      obj.assignedTo = null;
      obj.assignedName = 'Staff';
      return obj;
    });

    res.status(200).json(maskedConcerns);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Get all concerns (Admin)
// @route   GET /api/concerns/admin
const getAdminConcerns = async (req, res) => {
  try {
    const concerns = await Concern.find({}).sort({ createdAt: -1 });

    // Fallback for legacy "undefined" names
    const sanitizedConcerns = concerns.map(c => {
      const obj = c.toObject();
      if (!obj.sponsorName || obj.sponsorName.includes('undefined')) {
        obj.sponsorName = `Sponsor #${obj.sponsorId.toString().slice(-4).toUpperCase()}`;
      }
      return obj;
    });

    res.status(200).json(sanitizedConcerns);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Get total unread count for admin
// @route   GET /api/concerns/admin/unread-count
const getAdminUnreadCount = async (req, res) => {
  try {
    const result = await Concern.aggregate([
      { $match: { status: { $ne: 'resolved' } } },
      { $group: { _id: null, total: { $sum: "$unreadCountAdmin" } } }
    ]);
    const total = result.length > 0 ? result[0].total : 0;
    res.status(200).json({ total });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Get a single concern by ID
// @route   GET /api/concerns/:id
const getConcernById = async (req, res) => {
  const { id } = req.params;
  try {
    const concern = await Concern.findById(id);
    if (!concern) {
      return res.status(404).json({ error: 'Concern not found' });
    }

    // Reset unread count for the person viewing
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      if (concern.unreadCountAdmin > 0) {
        concern.unreadCountAdmin = 0;
        await concern.save();
        socket.emitUpdate('unreadCountUpdate');
      }
    } else if (concern.sponsorId.toString() === req.user._id.toString()) {
      if (concern.unreadCountSponsor > 0) {
        concern.unreadCountSponsor = 0;
        await concern.save();
        // socket.emitUpdate('unreadCountUpdate'); // Can add for sponsor side later if needed
      }
    }

    const concernObj = concern.toObject();

    // Fallback for legacy "undefined" names
    if (!concernObj.sponsorName || concernObj.sponsorName.includes('undefined')) {
      concernObj.sponsorName = `Sponsor #${concernObj.sponsorId.toString().slice(-4).toUpperCase()}`;
    }

    // Mask admin names for privacy if the requester is not an admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      if (concern.sponsorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'You are not authorized to view this ticket' });
      }

      // Strip internal notes
      delete concernObj.internalNotes;

      // Mask admin names in messages
      concernObj.messages = concernObj.messages.map(m => {
        if (m.sender.toString() !== req.user._id.toString() && !m.isSystem && m.senderName !== 'System') {
          m.senderName = 'Admin';
        }
        // Mask system message text leaks
        if (m.isSystem && m.text.toLowerCase().includes('assigned to')) {
          m.text = 'Concern has been assigned to a support agent';
        }
        return m;
      });

      // Mask assignment info
      concernObj.assignedTo = null;
      concernObj.assignedName = 'Staff';
    }

    res.status(200).json(concernObj);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Add a message to a concern
// @route   POST /api/concerns/:id/messages
const addMessage = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const user = req.user;

  try {
    const concern = await Concern.findById(id);
    if (!concern) {
      return res.status(404).json({ error: 'Concern not found' });
    }

    const attachments = req.files ? await Promise.all(req.files.map(async file => {
      const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file.originalname).toLowerCase());
      if (isImage) {
        await optimizeImage(file.path, 70, 1200);
      }
      
      return {
        name: file.originalname,
        path: file.path.replace(/\\/g, '/'),
        size: (fs.statSync(file.path).size / 1024).toFixed(1) + ' KB'
      };
    })) : [];

    const senderName = `${user.firstName} ${user.lastName}`;

    const newMessage = {
      sender: user._id,
      senderName: `${user.firstName} ${user.lastName}`,
      text,
      attachments,
      isSystem: false
    };

    concern.messages.push(newMessage);
    concern.lastMessageAt = Date.now();

    // Increment unread count for the other party
    if (user.role === 'admin' || user.role === 'superadmin') {
      concern.unreadCountSponsor += 1;
    } else {
      concern.unreadCountAdmin += 1;
    }

    await concern.save();

    // Create Notification (Targeted if assigned, otherwise global for admins)
    const notificationController = require('./notificationController');
    const notification = await notificationController.createNotification({
      title: `New message for ticket: ${concern.subject}`,
      content: `${senderName}: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
      type: 'concern',
      path: `/admin/support`,
      unread: true,
      userId: concern.assignedTo || null, // TARGETED IF ASSIGNED
      createdBy: user._id,
      targetRole: concern.assignedTo ? null : 'admin'
    });
    socket.emitUpdate('newNotification', notification);

    // Emit socket event to notify other party
    socket.emitUpdate('newMessage', { concernId: id, message: concern.messages[concern.messages.length - 1] });

    res.status(200).json(concern);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Update concern status (Admin)
// @route   PATCH /api/concerns/:id/status
const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = req.user;

  try {
    const concern = await Concern.findById(id);
    if (!concern) {
      return res.status(404).json({ error: 'Concern not found' });
    }

    if (!concern.assignedTo) {
      return res.status(400).json({ error: 'Cannot update status of an unassigned ticket. Please assign it to an admin first.' });
    }

    const oldStatus = concern.status;
    concern.status = status;

    // Add a system message for status change
    const systemMessage = {
      sender: user._id,
      senderName: 'System',
      text: `Status changed from ${oldStatus} to ${status}`,
      isSystem: true
    };
    concern.messages.push(systemMessage);

    await concern.save();

    // Emit socket event
    socket.emitUpdate('statusUpdate', { 
      concernId: id, 
      status: concern.status, 
      priority: concern.priority,
      message: systemMessage 
    });

    res.status(200).json(concern);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Update concern priority (Admin)
// @route   PATCH /api/concerns/:id/priority
const updatePriority = async (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;
  const user = req.user;

  try {
    const concern = await Concern.findById(id);
    if (!concern) {
      return res.status(404).json({ error: 'Concern not found' });
    }

    const oldPriority = concern.priority || 'medium';
    concern.priority = priority.toLowerCase();

    // Add a system message for priority change
    const systemMessage = {
      sender: user._id,
      senderName: 'System',
      text: `Priority changed from ${oldPriority} to ${priority}`,
      isSystem: true
    };
    concern.messages.push(systemMessage);

    await concern.save();

    // Emit socket event
    socket.emitUpdate('statusUpdate', { 
      concernId: id, 
      status: concern.status, 
      priority: concern.priority,
      message: systemMessage 
    });

    res.status(200).json(concern);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// @desc    Assign concern to admin
// @route   PATCH /api/concerns/:id/assign
const assignConcern = async (req, res) => {
  const { id } = req.params;
  const { adminId, adminName } = req.body;

  try {
    const concern = await Concern.findById(id);
    if (!concern) {
      return res.status(404).json({ error: 'Concern not found' });
    }

    concern.assignedTo = adminId;
    concern.assignedName = adminName;

    const systemMessage = {
      sender: req.user._id,
      senderName: 'System',
      text: `Concern assigned to ${adminName}`,
      isSystem: true
    };
    concern.messages.push(systemMessage);

    await concern.save();

    // Create Targeted Notification for assigned admin
    const notificationController = require('./notificationController');
    const notification = await notificationController.createNotification({
      title: `You have been assigned a new concern`,
      content: `Ticket: ${concern.subject} (Assigned by ${req.user.firstName})`,
      type: 'concern',
      path: `/admin/support`,
      unread: true,
      userId: adminId, // TARGETED
      createdBy: req.user._id
    });
    
    const socket = require('../socket');
    socket.emitUpdate('newNotification', notification);
    socket.emitUpdate('concernAssigned', { concernId: id, assignedTo: adminId, assignedName: adminName, message: systemMessage });

    res.status(200).json(concern);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const addInternalNote = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const user = req.user;

  try {
    const concern = await Concern.findById(id);
    if (!concern) {
      return res.status(404).json({ error: 'Concern not found' });
    }

    concern.internalNotes.push({
      adminId: user._id,
      adminName: `${user.firstName} ${user.lastName}`,
      text
    });

    await concern.save();
    res.status(200).json(concern);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateInternalNote = async (req, res) => {
  const { id, noteId } = req.params;
  const { text } = req.body;

  try {
    const concern = await Concern.findById(id);
    if (!concern) {
      return res.status(404).json({ error: 'Concern not found' });
    }

    const note = concern.internalNotes.id(noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    note.text = text;
    note.updatedAt = Date.now();
    await concern.save();

    res.status(200).json(concern);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteInternalNote = async (req, res) => {
  const { id, noteId } = req.params;

  try {
    const concern = await Concern.findById(id);
    if (!concern) {
      return res.status(404).json({ error: 'Concern not found' });
    }

    concern.internalNotes.pull(noteId);
    await concern.save();

    res.status(200).json(concern);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createConcern,
  getSponsorConcerns,
  getAdminConcerns,
  getAdminUnreadCount,
  getConcernById,
  addMessage,
  updateStatus,
  updatePriority,
  assignConcern,
  addInternalNote,
  updateInternalNote,
  deleteInternalNote
};
