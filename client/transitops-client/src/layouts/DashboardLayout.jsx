import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <main className="p-6 bg-gray-100 flex-1">
          <h1 className="text-3xl font-bold">
            Welcome to TransitOps 🚛
          </h1>
        </main>
      </div>
    </div>
  );
}