const { MaintenanceLog, Vehicle } = require('../models');
const { sequelize } = require('../models');

exports.list = async (req, res) => {
  try {
    const logs = await MaintenanceLog.findAll({
      include: [{ model: Vehicle, as: 'vehicle' }],
      order: [['id', 'DESC']],
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch maintenance logs', error: err.message });
  }
};

// Creating an active maintenance record automatically switches vehicle to In Shop
exports.create = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { vehicleId, description, cost, date, status } = req.body;
    if (!vehicleId || !description || !date) {
      await t.rollback();
      return res.status(400).json({ message: 'vehicleId, description and date are required' });
    }
    const vehicle = await Vehicle.findByPk(vehicleId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!vehicle) { await t.rollback(); return res.status(404).json({ message: 'Vehicle not found' }); }
    if (vehicle.status === 'On Trip') {
      await t.rollback();
      return res.status(400).json({ message: 'Cannot log maintenance while vehicle is On Trip' });
    }

    const finalStatus = status === 'Closed' ? 'Closed' : 'Active';
    const log = await MaintenanceLog.create({
      vehicleId, description, cost: cost || 0, date, status: finalStatus,
    }, { transaction: t });

    if (finalStatus === 'Active' && vehicle.status !== 'Retired') {
      await vehicle.update({ status: 'In Shop' }, { transaction: t });
    }

    await t.commit();
    res.status(201).json(log);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Failed to create maintenance log', error: err.message });
  }
};

// Closing maintenance restores vehicle to Available (unless retired)
exports.close = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const log = await MaintenanceLog.findByPk(req.params.id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!log) { await t.rollback(); return res.status(404).json({ message: 'Maintenance log not found' }); }
    if (log.status === 'Closed') {
      await t.rollback();
      return res.status(400).json({ message: 'Maintenance log is already closed' });
    }
    await log.update({ status: 'Closed' }, { transaction: t });

    const vehicle = await Vehicle.findByPk(log.vehicleId, { transaction: t, lock: t.LOCK.UPDATE });
    if (vehicle && vehicle.status !== 'Retired') {
      const otherActive = await MaintenanceLog.count({
        where: { vehicleId: vehicle.id, status: 'Active' }, transaction: t,
      });
      if (otherActive === 0) {
        await vehicle.update({ status: 'Available' }, { transaction: t });
      }
    }

    await t.commit();
    res.json(log);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Failed to close maintenance log', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const log = await MaintenanceLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ message: 'Maintenance log not found' });
    await log.destroy();
    res.json({ message: 'Maintenance log deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete maintenance log', error: err.message });
  }
};
