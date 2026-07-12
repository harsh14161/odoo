import { FaBell, FaUserCircle } from "react-icons/fa";

export default function Navbar() {
  return (
    <header className="h-16 bg-white shadow flex items-center justify-between px-6">
      <input
        type="text"
        placeholder="Search..."
        className="border rounded-lg px-4 py-2 w-72"
      />

      <div className="flex items-center gap-6">
        <FaBell size={20} className="cursor-pointer" />

        <div className="flex items-center gap-2">
          <FaUserCircle size={28} />
          <span className="font-medium">Vinay</span>
        </div>
      </div>
    </header>
  );
}