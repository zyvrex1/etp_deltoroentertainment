const Concern = require('../models/concernModel');
const socket = require('../socket');
const { optimizeImageBuffer } = require("../utils/imageOptimizer");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../config/s3Client");
const { v4: uuidv4 } = require("uuid");

// @desc    Submit a new concern (Sponsor)
// @route   POST /api/concerns
const createConcern = async (req, res) => {
  const { subject, category, priority, description, event } = req.body;
  const user = req.user;

  try {
    const attachments = req.files ? await Promise.all(req.files.map(async file => {
  const ext = file.originalname.split('.').pop().toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

  let filePath, fileSize;

  if (isImage) {
    const { buffer, contentType, ext: outExt } = await optimizeImageBuffer(file.buffer, file.mimetype);
    const key = `concerns/${uuidv4()}${outExt}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    filePath = `${process.env.CDN_BASE_URL}/${key}`;
    fileSize = (buffer.length / 1024).toFixed(1) + ' KB';
  } else {
    const key = `concerns/${uuidv4()}-${file.originalname}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));
    filePath = `${process.env.CDN_BASE_URL}/${key}`;
    fileSize = (file.buffer.length / 1024).toFixed(1) + ' KB';
  }

  return { name: file.originalname, path: filePath, size: fileSize };
})) : [];

    const sponsorName = `${user.firstName} ${user.lastName}`;

    const concern = await Concern.create({
      sponsorId: user._id,
      sponsorName,
      userRole: user.role,
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
    const { page, limit, skip } = req.pagination || { page: 1, limit: 1000, skip: 0 };
    const search = (req.query.search || '').trim();
    const status = req.query.status || 'All';

    const filter = { sponsorId: user._id };
    if (status.toLowerCase() !== 'all') {
      filter.status = status.toLowerCase();
    }
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } }
      ];
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(search)) {
        filter.$or.push({ _id: search });
      }
    }

    const [concerns, total] = await Promise.all([
      Concern.find(filter)
        .select('-internalNotes')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit),
      Concern.countDocuments(filter)
    ]);

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

    res.status(200).json({
      data: maskedConcerns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Get all concerns (Admin)
// @route   GET /api/concerns/admin
const getAdminConcerns = async (req, res) => {
  try {
    const { page, limit, skip } = req.pagination || { page: 1, limit: 1000, skip: 0 };
    const search = (req.query.search || '').trim();
    const status = req.query.status || 'All';
    const roleFilter = req.query.role || 'All'; // e.g., if admin wants to filter by customer/sponsor

    const filter = {};
    if (status.toLowerCase() !== 'all') {
      filter.status = status.toLowerCase();
    }
    if (roleFilter.toLowerCase() !== 'all') {
      filter.userRole = roleFilter.toLowerCase();
    }
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { sponsorName: { $regex: search, $options: 'i' } }
      ];
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(search)) {
        filter.$or.push({ _id: search });
      }
    }

    const [concerns, total] = await Promise.all([
      Concern.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Concern.countDocuments(filter)
    ]);

    // Fallback for legacy "undefined" names
    const sanitizedConcerns = concerns.map(c => {
      const obj = c.toObject();
      if (!obj.sponsorName || (typeof obj.sponsorName === 'string' && obj.sponsorName.includes('undefined'))) {
        const fallbackId = obj.sponsorId ? obj.sponsorId.toString() : obj._id.toString();
        obj.sponsorName = `User #${fallbackId.slice(-4).toUpperCase()}`;
      }
      return obj;
    });

    res.status(200).json({
      data: sanitizedConcerns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
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
    if (!concernObj.sponsorName || (typeof concernObj.sponsorName === 'string' && concernObj.sponsorName.includes('undefined'))) {
      const fallbackId = concernObj.sponsorId ? concernObj.sponsorId.toString() : concernObj._id.toString();
      concernObj.sponsorName = `User #${fallbackId.slice(-4).toUpperCase()}`;
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
  const ext = file.originalname.split('.').pop().toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

  let filePath, fileSize;

  if (isImage) {
    const { buffer, contentType, ext: outExt } = await optimizeImageBuffer(file.buffer, file.mimetype);
    const key = `concerns/${uuidv4()}${outExt}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    filePath = `${process.env.CDN_BASE_URL}/${key}`;
    fileSize = (buffer.length / 1024).toFixed(1) + ' KB';
  } else {
    // Non-image files: still upload to R2 as-is
    const key = `concerns/${uuidv4()}-${file.originalname}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));
    filePath = `${process.env.CDN_BASE_URL}/${key}`;
    fileSize = (file.buffer.length / 1024).toFixed(1) + ' KB';
  }

  return {
    name: file.originalname,
    path: filePath,
    size: fileSize
  };
})) : [];

    const senderName = (user.role === 'admin' || user.role === 'superadmin') ? 'Admin' : `${user.firstName} ${user.lastName}`;

    const messageText = text || (attachments.length > 0 ? "Sent an attachment" : "");

    const newMessage = {
      sender: user._id,
      senderName: senderName,
      text: messageText,
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

    // Create Notification
    const notificationController = require('./notificationController');
    const recipientId = (user.role === 'admin' || user.role === 'superadmin') ? concern.sponsorId : (concern.assignedTo || null);
    const targetRole = (user.role === 'admin' || user.role === 'superadmin') ? null : (concern.assignedTo ? null : 'admin');
    
  let notifPath = '/admin/support';
if (user.role === 'admin' || user.role === 'superadmin') {
  if (concern.userRole === 'customer') {
    notifPath = '/customer/support';
  } else if (concern.userRole === 'promoter') {
    notifPath = '/promoter/support';
  } else {
    notifPath = '/sponsor/support';
  }
}

 const notification = await notificationController.createNotification({
  title: `New message for ticket: ${concern.subject}`,
  content: `New message: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`,
  type: 'concern',
  path: notifPath,   // <-- was: path
  unread: true,
  userId: recipientId,
  createdBy: user._id,
  targetRole
});
    socket.emitUpdate('newNotification', notification);

    // Emit socket event to notify other party
    socket.emitUpdate('newMessage', { concernId: id, message: concern.messages[concern.messages.length - 1] });

    res.status(200).json(concern);
  } catch (error) {
    console.error("Error in addMessage:", error);
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
