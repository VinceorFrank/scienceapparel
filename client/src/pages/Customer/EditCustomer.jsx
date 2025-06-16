// client/src/pages/Customer/EditCustomer.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EditCustomer = () => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        setName(res.data.name);
      } catch (err) {
        navigate("/login");
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    const token = localStorage.getItem("customerToken");

    try {
      const res = await axios.put(
        "http://localhost:5000/api/users/profile",
        { name, currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("✅ Profil mis à jour !");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        "Erreur lors de la mise à jour"
      );
    }
  };

  if (!user) return <div className="p-8 text-gray-700">Chargement du profil...</div>;

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-xl p-6 mt-10">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">Modifier mon profil</h1>
      {message && <div className="text-green-600 mb-2">{message}</div>}
      {error && <div className="text-red-500 mb-2">{error}</div>}

      <form onSubmit={handleUpdate} className="space-y-4">
        <input
          type="text"
          className="w-full border p-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nouveau nom"
        />
        <input
          type="password"
          className="w-full border p-2"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Mot de passe actuel (obligatoire)"
        />
        <input
          type="password"
          className="w-full border p-2"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nouveau mot de passe (optionnel)"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Enregistrer les modifications
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate("/account")}
          className="text-blue-600 underline hover:text-blue-800"
        >
          Retour à l’espace client
        </button>
      </div>
    </div>
  );
};

export default EditCustomer;
