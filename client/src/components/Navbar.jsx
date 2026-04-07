import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-green-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <Link to="/dashboard" className="text-xl font-bold tracking-wide">
        Splitwise Clone
      </Link>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm">Hi, {user.name}</span>
          <button
            onClick={handleLogout}
            className="bg-white text-green-600 px-4 py-1 rounded-lg text-sm font-semibold hover:bg-gray-100 transition"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
