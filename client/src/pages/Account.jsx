// client/src/pages/Account.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/config";

const Account = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token || role !== "customer") {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [profileRes, ordersRes] = await Promise.all([
          api.get("/users/profile"),
          api.get("/orders/myorders"),
        ]);
        setUser(profileRes.data);
        setOrders(ordersRes.data);
      } catch (err) {
        console.error("Error fetching profile or orders", err);
        navigate("/login");
      }
    };

    fetchData();
  }, [navigate]);

  if (!user) return <div className="p-8 text-gray-700">Chargement du profil...</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Mon Compte</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Informations Personnelles</h2>
        <p><strong>Nom:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <Link
          to="/customer/edit"
          className="inline-block mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Modifier mon profil
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Mes Commandes</h2>
        {orders.length === 0 ? (
          <p>Aucune commande pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="border p-4 rounded">
                <p><strong>Commande ID:</strong> {order._id}</p>
                <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Total:</strong> {order.totalPrice}€</p>
                <p><strong>Statut:</strong> {order.isPaid ? "Payée" : "En attente"}</p>
                <Link
                  to={`/order/${order._id}`}
                  className="text-blue-500 hover:underline"
                >
                  Voir les détails
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Account;

