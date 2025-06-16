// client/src/pages/Account.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Account = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("customerToken");

    if (!token) {
      navigate("/login"); // ✅ Redirect customer to login
      return;
    }

    const fetchProfileAndOrders = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [profileRes, ordersRes] = await Promise.all([
          axios.get("http://localhost:5000/api/users/profile", { headers }),
          axios.get("http://localhost:5000/api/orders/myorders", { headers }),
        ]);

        setUser(profileRes.data);
        setOrders(ordersRes.data);
      } catch (err) {
        console.error("Error fetching profile or orders", err);
        navigate("/login");
      }
    };

    fetchProfileAndOrders();
  }, [navigate]);

  if (!user) return <div className="p-8 text-gray-700">Chargement du profil...</div>;

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-xl p-6 mt-10">
      <h1 className="text-2xl font-bold text-blue-600 mb-4">Espace Client</h1>
      <p><strong>Nom:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Rôle:</strong> {user.isAdmin ? "Admin" : "Client"}</p>

      <h2 className="text-xl font-semibold mt-6 text-blue-700">Historique des commandes</h2>
      {orders.length === 0 ? (
        <p className="text-gray-600 mt-2">Aucune commande trouvée.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {orders.map((order) => (
            <li key={order._id} className="border p-4 rounded-md shadow-sm bg-gray-50">
              <p><strong>Commande:</strong> {order._id}</p>
              <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Produits:</strong> {order.orderItems.map(item => item.name || "Produit").join(", ")}</p>
              <p><strong>Total:</strong> ${order.totalPrice.toFixed(2)}</p>
              <p><strong>Statut:</strong> {order.isPaid ? "Payée" : "Non payée"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Account;
