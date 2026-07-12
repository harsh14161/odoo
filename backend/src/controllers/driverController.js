const { Driver, Trip, User } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

exports.list = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    const drivers = await Driver.findAll({ where, order: [['id', 'ASC']] });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch drivers', error: err.message });
  }
};

exports.availableForDispatch = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const drivers = await Driver.findAll({
      where: { status: 'Available', licenseExpiry: { [Op.gte]: today } },
      order: [['id', 'ASC']],
    });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch drivers', error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id, { include: [{ model: Trip, as: 'trips' }] });
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch driver', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, password, licenseNumber, licenseCategory, licenseExpiry, contactNumber, safetyScore, status } = req.body;
    if (!name || !email || !licenseNumber || !licenseCategory || !licenseExpiry) {
      return res.status(400).json({ message: 'name, email, licenseNumber, licenseCategory and licenseExpiry are required' });
    }
    const existingDriver = await Driver.findOne({ where: { licenseNumber } });
    if (existingDriver) return res.status(409).json({ message: 'License number must be unique' });

    const existingEmailDriver = await Driver.findOne({ where: { email } });
    if (existingEmailDriver) return res.status(409).json({ message: 'Email is already registered for another driver' });

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(409).json({ message: 'Email is already taken by another user' });

    const driver = await Driver.create({
      name, email, licenseNumber, licenseCategory, licenseExpiry,
      contactNumber, safetyScore: safetyScore ?? 100, status: status || 'Available',
    });

    const passwordHash = await bcrypt.hash(password || 'Password123!', 10);
    await User.create({
      name,
      email,
      passwordHash,
      role: 'driver',
    });

    res.status(201).json(driver);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create driver', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    if (req.body.licenseNumber && req.body.licenseNumber !== driver.licenseNumber) {
      const existing = await Driver.findOne({ where: { licenseNumber: req.body.licenseNumber } });
      if (existing) return res.status(409).json({ message: 'License number must be unique' });
    }
    await driver.update(req.body);
    res.json(driver);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update driver', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const driver = await Driver.findByPk(req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    const activeTrips = await Trip.count({ where: { driverId: driver.id, status: { [Op.in]: ['Draft', 'Dispatched'] } } });
    if (activeTrips > 0) {
      return res.status(400).json({ message: 'Cannot delete driver with active or draft trips' });
    }
    // Delete the driver user account
    await User.destroy({ where: { email: driver.email } });
    await driver.destroy();
    res.json({ message: 'Driver deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete driver', error: err.message });
  }
};
