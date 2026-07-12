const { Vehicle, Trip, MaintenanceLog, FuelLog, Expense } = require('../models');
const { Parser } = require('json2csv');

async function buildVehicleReport() {
  const vehicles = await Vehicle.findAll({ order: [['id', 'ASC']] });
  const report = [];

  for (const vehicle of vehicles) {
    const trips = await Trip.findAll({ where: { vehicleId: vehicle.id, status: 'Completed' } });
    const fuelLogs = await FuelLog.findAll({ where: { vehicleId: vehicle.id } });
    const maintenanceLogs = await MaintenanceLog.findAll({ where: { vehicleId: vehicle.id } });
    const expenses = await Expense.findAll({ where: { vehicleId: vehicle.id } });

    const totalDistance = trips.reduce((sum, t) => sum + (t.actualDistance || 0), 0);
    const totalRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
    const totalFuelLiters = fuelLogs.reduce((sum, f) => sum + (f.liters || 0), 0);
    const totalFuelCost = fuelLogs.reduce((sum, f) => sum + (f.cost || 0), 0);
    const totalMaintenanceCost = maintenanceLogs.reduce((sum, m) => sum + (m.cost || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const fuelEfficiency = totalFuelLiters > 0 ? Number((totalDistance / totalFuelLiters).toFixed(2)) : 0;
    const operationalCost = Number((totalFuelCost + totalMaintenanceCost + totalExpenses).toFixed(2));
    const roi = vehicle.acquisitionCost > 0
      ? Number(((totalRevenue - (totalMaintenanceCost + totalFuelCost)) / vehicle.acquisitionCost).toFixed(4))
      : 0;

    report.push({
      vehicleId: vehicle.id,
      registrationNumber: vehicle.registrationNumber,
      name: vehicle.name,
      type: vehicle.type,
      status: vehicle.status,
      totalDistance,
      totalFuelLiters,
      fuelEfficiency,
      totalFuelCost,
      totalMaintenanceCost,
      totalExpenses,
      operationalCost,
      totalRevenue,
      acquisitionCost: vehicle.acquisitionCost,
      roi,
    });
  }
  return report;
}

exports.vehicleReport = async (req, res) => {
  try {
    const report = await buildVehicleReport();
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to build report', error: err.message });
  }
};

exports.exportCsv = async (req, res) => {
  try {
    const report = await buildVehicleReport();
    const parser = new Parser();
    const csv = parser.parse(report);
    res.header('Content-Type', 'text/csv');
    res.attachment('transitops_vehicle_report.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: 'Failed to export CSV', error: err.message });
  }
};
