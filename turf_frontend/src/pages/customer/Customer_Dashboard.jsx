import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

const CustomerDashboard = () => {
  const { logout, token } = useContext(AuthContext);
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/v1/turfs/search/all",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (response.ok && data?.data?.turfs) {
          setTurfs(data.data.turfs);
        } else {
          setError(data?.message || "Unable to load turfs");
        }
      } catch (err) {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchTurfs();
    } else {
      setLoading(false);
      setError("Please log in to view turfs");
    }
  }, [token]);

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Available Turfs</h1>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
        >
          Logout
        </button>
      </header>

      {loading && <p className="text-gray-600">Loading turfs...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && turfs.length === 0 && (
        <p className="text-gray-600">No turfs found.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {turfs.map((turf) => (
          <div
            key={turf._id}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">{turf.name}</h3>
            <p className="text-gray-600 mb-4">
              {turf.city} • {turf.size}
            </p>
            <p className="text-gray-500 text-sm mb-4">{turf.location}</p>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-blue-600">
                ₹{turf.pricePerHour}/hr
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerDashboard;
