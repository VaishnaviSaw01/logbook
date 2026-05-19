const Party = require("../models/Party");
const Transaction = require("../models/Transaction");
const logActivity = require("../utils/logActivity");
const getOwnerId = (user) => {
  return user.role === "ADMIN" ? user._id : user.createdBy;
};

exports.createParty = async (req, res) => {
  try {
    const { name, phone, address, type } = req.body;

    const ownerId = getOwnerId(req.user);

    const existingParty = await Party.findOne({
      phone,
      user: ownerId
    });
    
    if (existingParty) {
      return res.status(400).json({
        message: "Customer already exists with this phone number"
      });
    }

    const party = await Party.create({
      name,
      phone,
      address,
      type,
      user: ownerId
    });
    await logActivity(req.user._id, "Created Customer");
    res.status(201).json(party);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getParties = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);

    const parties = await Party.find({
      user: ownerId,
      isDeleted: false
    });

    res.json(parties);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteParty = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);

    const party = await Party.findOne({
      _id: req.params.id,
      user: ownerId
    });

    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    party.isDeleted = true;
    party.deletedAt = new Date();
    await party.save();
    await logActivity(req.user._id, "Deleted Customer");
    res.json({ message: "Party moved to recycle bin" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDeletedParties = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);

    const parties = await Party.find({
      user: ownerId,
      isDeleted: true
    });

    res.json(parties);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.restoreParty = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);

    const party = await Party.findOne({
      _id: req.params.id,
      user: ownerId
    });

    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    party.isDeleted = false;
    party.deletedAt = null;
    await party.save();

    res.json({ message: "Party restored successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.permanentDeleteParty = async (req, res) => {
  try {
    const ownerId = getOwnerId(req.user);

    const party = await Party.findOne({
      _id: req.params.id,
      user: ownerId
    });

    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    await Transaction.deleteMany({ party: party._id });
    await Party.findByIdAndDelete(party._id);

    res.json({ message: "Party permanently deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};