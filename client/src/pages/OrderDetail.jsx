// client/src/pages/OrderDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const OrderDetail = () => {
  const { id } = useParams(); // 👈 from /order/:id
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get(`http://localhost:5000/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrder(res.data))
      .catch((err) => {
        console.error(err);
        setError("Impossible de charger les détails de la commande.");
      });
  }, [id, navigate]);

  if (error) {
    return <div className="text-red-600 p-8">{error}</div>;
  }

  if (!order) {
    return <div className="p-8 text-gray-700">Chargement des détails...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 mt-10 shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">Détails de la commande</h1>

      <p><strong>Commande ID:</strong> {order._id}</p>
      <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>

      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">Adresse de livraison</h2>
        <p>{order.shippingAddress.address}</p>
        <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">Articles commandés</h2>
        <ul className="space-y-2">
          {order.orderItems.map((item) => (
            <li key={item.product} className="border p-2 rounded bg-gray-50">
              {item.name} — {item.qty} × ${item.price.toFixed(2)}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <p><strong>Méthode de paiement:</strong> {order.paymentMethod}</p>
        <p><strong>Statut:</strong> {order.isPaid ? "✅ Payée" : "❌ Non payée"}</p>
      </div>

      <div className="mt-4 font-semibold">
        <p>Total: ${order.totalPrice.toFixed(2)}</p>
      </div>

      <div className="mt-6">
        <button
          onClick={() => navigate("/account")}
          className="text-blue-600 underline hover:text-blue-800"
        >
          ← Retour à l'espace client
        </button>
      </div>
    </div>
  );
};

export default OrderDetail;
