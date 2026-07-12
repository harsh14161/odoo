require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Vehicle, Driver } = require('./models');

async function seed() {
  await sequelize.sync({ force: true });

  const users = [
    { name: 'Admin', email: 'admin@transitops.com', role: 'admin' },
    { name: 'Fleet Manager', email: 'fleet@transitops.com', role: 'fleet_manager' },
    { name: 'Alex Johnson', email: 'driver@transitops.com', role: 'driver' },
    { name: 'Priya Singh', email: 'driver2@transitops.com', role: 'driver' },
    { name: 'Safety Officer', email: 'safety@transitops.com', role: 'safety_officer' },
    { name: 'Financial Analyst', email: 'finance@transitops.com', role: 'financial_analyst' },
  ];

  for (const u of users) {
    const existing = await User.findOne({ where: { email: u.email } });
    if (!existing) {
      const passwordHash = await bcrypt.hash('Password123!', 10);
      await User.create({ ...u, passwordHash });
      console.log(`Created user: ${u.email} / Password123!`);
    }
  }

  const vehicleCount = await Vehicle.count();
  if (vehicleCount === 0) {
    await Vehicle.bulkCreate([
      { registrationNumber: 'VAN-05', name: 'Ford Transit', type: 'Van', maxLoadCapacity: 500, odometer: 12000, acquisitionCost: 25000, region: 'North', status: 'Available' },
      { registrationNumber: 'TRK-11', name: 'Isuzu NPR', type: 'Truck', maxLoadCapacity: 3000, odometer: 45000, acquisitionCost: 60000, region: 'South', status: 'Available' },
    ]);
    console.log('Seeded sample vehicles.');
  }

  const driverCount = await Driver.count();
  if (driverCount === 0) {
    await Driver.bulkCreate([
      { name: 'Alex Johnson', email: 'driver@transitops.com', licenseNumber: 'LIC-1001', licenseCategory: 'B', licenseExpiry: '2027-12-31', contactNumber: '555-0101', safetyScore: 95, status: 'Available' },
      { name: 'Priya Singh', email: 'driver2@transitops.com', licenseNumber: 'LIC-1002', licenseCategory: 'C', licenseExpiry: '2026-06-30', contactNumber: '555-0102', safetyScore: 88, status: 'Available' },
    ]);
    console.log('Seeded sample drivers.');
  }

  console.log('Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
