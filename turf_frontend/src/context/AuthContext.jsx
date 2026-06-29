import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("userRole");
    if (token && role) {
      setToken(token);
      setUser({ role });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data?.data?.tokens?.accessToken) return false;

      const accessToken = data.data.tokens.accessToken;
      const role = data.data.user?.role || "customer";

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("userRole", role);
      setToken(accessToken);
      setUser({ role });

      navigate(
        role === "admin"
          ? "/admin"
          : role === "turf_owner"
            ? "/owner"
            : "/customer",
      );
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    setToken(null);
    setUser(null);
    navigate("/");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
