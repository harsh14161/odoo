import {
  FaTachometerAlt,
  FaTruck,
  FaUserTie,
  FaRoute,
  FaTools,
  FaGasPump,
  FaMoneyBillWave,
  FaChartBar,
  FaCog,
} from "react-icons/fa";

const menuItems = [
  { name: "Dashboard", icon: <FaTachometerAlt /> },
  { name: "Vehicles", icon: <FaTruck /> },
  { name: "Drivers", icon: <FaUserTie /> },
  { name: "Trips", icon: <FaRoute /> },
  { name: "Maintenance", icon: <FaTools /> },
  { name: "Fuel", icon: <FaGasPump /> },
  { name: "Expenses", icon: <FaMoneyBillWave /> },
  { name: "Analytics", icon: <FaChartBar /> },
  { name: "Settings", icon: <FaCog /> },
];

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-slate-900 text-white">
      <div className="p-6 text-2xl font-bold border-b border-slate-700">
        TransitOps
      </div>

      <nav className="mt-4">
        {menuItems.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-3 px-6 py-3 hover:bg-slate-700 cursor-pointer transition"
          >
            {item.icon}
            <span>{item.name}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}