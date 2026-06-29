import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

const AdminDashboard = () => {
  const { logout, token } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOwners: 0,
    totalCustomers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, ownersRes, customersRes] = await Promise.all([
          fetch("http://localhost:3000/api/v1/roles/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3000/api/v1/roles/admin/turf-owners", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3000/api/v1/roles/admin/customers", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const usersData = await usersRes.json();
        const ownersData = await ownersRes.json();
        const customersData = await customersRes.json();

        if (usersRes.ok && ownersRes.ok && customersRes.ok) {
          setStats({
            totalUsers: usersData?.data?.pagination?.total || 0,
            totalOwners: ownersData?.data?.pagination?.total || 0,
            totalCustomers: customersData?.data?.pagination?.total || 0,
          });
        } else {
          setError("Unable to load admin stats");
        }
      } catch (err) {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStats();
    } else {
      setLoading(false);
      setError("Please log in as admin");
    }
  }, [token]);

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
        >
          Logout
        </button>
      </header>

      {loading && <p className="text-gray-600">Loading stats...</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Total Turf Owners</h3>
          <p className="text-3xl font-bold text-blue-600">
            {stats.totalOwners}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Total Customers</h3>
          <p className="text-3xl font-bold text-blue-600">
            {stats.totalCustomers}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
