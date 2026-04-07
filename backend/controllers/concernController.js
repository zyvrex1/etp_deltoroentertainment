const Concern = require('../models/concernModel');
const socket = require('../socket');

// @desc    Submit a new concern (Sponsor)
// @route   POST /api/concerns
const createConcern = async (req, res) => {
  const { subject, category, description, event } = req.body;
  const user = req.user;

  try {
    const attachments = req.files ? req.files.map(file => ({
      name: file.originalname,
      path: file.path.replace(/\\/g, '/'),
      size: (file.size / 1024).toFixed(1) + ' KB'
    })) : [];

    const sponsorName = `${user.firstName} ${user.lastName}`;

    const concern = await Concern.create({
      sponsorId: user._id,
      sponsorName,
      subject,
      category,
      description,
      event,
      attachments,
      messages: [{
        sender: user._id,
        senderName: `${user.firstName} ${user.lastName}`,
        text: description,
        isSystem: false
      }]
    });

    // Emit event to all admins
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

// @desc    Get a single concern by ID
// @route   GET /api/concerns/:id
const getConcernById = async (req, res) => {
  const { id } = req.params;
  try {
    const concern = await Concern.findById(id);
    if (!concern) {
      return res.status(404).json({ error: 'Concern not found' });
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

    const attachments = req.files ? req.files.map(file => ({
      name: file.originalname,
      path: file.path.replace(/\\/g, '/'),
      size: (file.size / 1024).toFixed(1) + ' KB'
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
    await concern.save();

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
    socket.emitUpdate('statusUpdate', { concernId: id, status, message: systemMessage });

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
  getConcernById,
  addMessage,
  updateStatus,
  assignConcern,
  addInternalNote,
  updateInternalNote,
  deleteInternalNote
};
