// client/src/pages/Account.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Account = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("customerToken");

    if (!token) {
      navigate("/login"); // ✅ Redirect customer to login
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching profile", err);
        navigate("/login"); // ✅ Redirect on token failure
      }
    };

    fetchProfile();
  }, [navigate]);

  if (!user) return <div className="p-8 text-gray-700">Chargement du profil...</div>;

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-xl p-6 mt-10">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">Espace Client</h1>
      <p><strong>Nom:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Rôle:</strong> {user.isAdmin ? "Admin" : "Client"}</p>
    </div>
  );
};

export default Account;
