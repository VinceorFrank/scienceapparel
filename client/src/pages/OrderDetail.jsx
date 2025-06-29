// client/src/pages/OrderDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getOrderById } from "../api/orders";

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await getOrderById(id);
        setOrder(response);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les détails de la commande.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate]);

  const getOrderStatus = (order) => {
    if (!order.isPaid) return { text: "En attente de paiement", color: "bg-yellow-100 text-yellow-800", icon: "⏳" };
    if (!order.isDelivered) return { text: "En cours de livraison", color: "bg-blue-100 text-blue-800", icon: "🚚" };
    return { text: "Livrée", color: "bg-green-100 text-green-800", icon: "✅" };
  };

  const getOrderTimeline = (order) => {
    const timeline = [
      {
        step: "Commande créée",
        date: order.createdAt,
        completed: true,
        icon: "📝"
      },
      {
        step: "Paiement reçu",
        date: order.isPaid ? order.paidAt : null,
        completed: order.isPaid,
        icon: "💳"
      },
      {
        step: "En préparation",
        date: order.isPaid ? order.paidAt : null,
        completed: order.isPaid,
        icon: "📦"
      },
      {
        step: "En livraison",
        date: order.isPaid && !order.isDelivered ? new Date() : null,
        completed: order.isPaid && !order.isDelivered,
        icon: "🚚"
      },
      {
        step: "Livrée",
        date: order.isDelivered ? order.deliveredAt : null,
        completed: order.isDelivered,
        icon: "✅"
      }
    ];
    return timeline;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">❌</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            to="/account"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à mon compte
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">📦</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Commande introuvable</h2>
          <p className="text-gray-600 mb-4">Cette commande n'existe pas ou vous n'y avez pas accès.</p>
          <Link
            to="/account"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à mon compte
          </Link>
        </div>
      </div>
    );
  }

  const status = getOrderStatus(order);
  const timeline = getOrderTimeline(order);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Commande #{order._id.slice(-6)}
              </h1>
              <p className="text-gray-600">
                Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <Link
              to="/account"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Retour à mon compte
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Statut de la commande</h2>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${status.color}`}>
                  {status.icon} {status.text}
                </span>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                {timeline.map((step, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step.completed ? '✓' : index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{step.icon}</span>
                          <span className={`font-medium ${
                            step.completed ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.step}
                          </span>
                        </div>
                        {step.date && (
                          <span className="text-sm text-gray-500">
                            {new Date(step.date).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Articles commandés</h2>
              <div className="space-y-4">
                {order.orderItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <img
                      src={item.image ? `http://localhost:5000/uploads/images/${item.image}` : '/placeholder.png'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.src = '/placeholder.png';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">Quantité: {item.qty}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">€{(item.price * item.qty).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">€{item.price.toFixed(2)} l'unité</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Adresse de livraison</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900">{order.shippingAddress.address}</p>
                <p className="text-gray-600">
                  {order.shippingAddress.postalCode} {order.shippingAddress.city}
                </p>
                <p className="text-gray-600">{order.shippingAddress.country}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Résumé de la commande</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total:</span>
                  <span className="font-medium">€{(order.totalPrice - order.taxPrice - order.shippingPrice).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TVA:</span>
                  <span className="font-medium">€{order.taxPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Livraison:</span>
                  <span className="font-medium">€{order.shippingPrice.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-gray-900">€{order.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations de paiement</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">Méthode:</span>
                  <p className="font-medium">{order.paymentMethod}</p>
                </div>
                <div>
                  <span className="text-gray-600">Statut:</span>
                  <p className={`font-medium ${order.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                    {order.isPaid ? '✅ Payé' : '⏳ En attente'}
                  </p>
                </div>
                {order.isPaid && order.paidAt && (
                  <div>
                    <span className="text-gray-600">Payé le:</span>
                    <p className="font-medium">
                      {new Date(order.paidAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                {!order.isPaid && (
                  <Link
                    to={`/payment/${order._id}`}
                    className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors text-center"
                  >
                    💳 Payer maintenant
                  </Link>
                )}
                <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  📧 Télécharger la facture
                </button>
                {order.isDelivered && !order.reviewToken && (
                  <Link
                    to={`/review/${order._id}`}
                    className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors text-center"
                  >
                    ⭐ Laisser un avis
                  </Link>
                )}
                <button className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                  📞 Contacter le support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
