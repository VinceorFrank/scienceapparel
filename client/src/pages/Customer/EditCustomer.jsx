// client/src/pages/Customer/EditCustomer.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/config";

const EditCustomer = () => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token || role !== "customer") {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/profile");
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

    try {
      await api.put(
        "/users/profile",
        { name, currentPassword, newPassword }
      );

      // Update stored name if it was changed
      if (name !== localStorage.getItem("userName")) {
        localStorage.setItem("userName", name);
      }

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
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Modifier mon profil</h1>

      <div className="bg-white shadow rounded-lg p-6">
        {message && <div className="text-green-600 mb-4">{message}</div>}
        {error && <div className="text-red-600 mb-4">{error}</div>}

        <form onSubmit={handleUpdate}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Nom
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Mettre à jour
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditCustomer;
