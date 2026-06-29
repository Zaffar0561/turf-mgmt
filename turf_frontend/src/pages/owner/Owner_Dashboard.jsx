import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

const OwnerDashboard = () => {
  const { logout, token } = useContext(AuthContext);
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyTurfs = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/v1/roles/turf-owner/my-turfs",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await response.json();

        if (response.ok && data?.data?.turfs) {
          setTurfs(data.data.turfs);
        } else {
          setError(data?.message || "Unable to load your turfs");
        }
      } catch (err) {
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchMyTurfs();
    } else {
      setLoading(false);
      setError("Please log in as a turf owner");
    }
  }, [token]);

  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Turf Owner Dashboard
        </h1>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
        >
          Logout
        </button>
      </header>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold mb-4">My Turfs</h2>

        {loading && <p className="text-gray-600">Loading your turfs...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && turfs.length === 0 && (
          <div className="text-gray-500 text-center py-8">
            No turfs listed yet.
          </div>
        )}

        {!loading && !error && turfs.length > 0 && (
          <div className="space-y-3">
            {turfs.map((turf) => (
              <div key={turf._id} className="border rounded-lg p-4">
                <h3 className="font-semibold">{turf.name}</h3>
                <p className="text-sm text-gray-600">
                  {turf.city} • {turf.location}
                </p>
                <p className="text-sm text-blue-600">₹{turf.pricePerHour}/hr</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
