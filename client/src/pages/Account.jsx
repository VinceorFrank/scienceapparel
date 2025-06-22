// client/src/pages/Account.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getUserProfile } from "../api/users";
import { getMyOrders } from "../api/orders";
import { getOrderById } from "../api/orders";

const Account = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
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
        setLoading(true);
        const [profileRes, ordersRes] = await Promise.all([
          getUserProfile(),
          getMyOrders(),
        ]);
        setUser(profileRes);
        setOrders(ordersRes);
        // TODO: Add wishlist API call when implemented
        setWishlist([]);
      } catch (err) {
        console.error("Error fetching profile or orders", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const getOrderStatus = (order) => {
    if (!order.isPaid) return { text: "En attente de paiement", color: "bg-yellow-100 text-yellow-800" };
    if (!order.isDelivered) return { text: "En cours de livraison", color: "bg-blue-100 text-blue-800" };
    return { text: "Livrée", color: "bg-green-100 text-green-800" };
  };

  const getOrderIcon = (order) => {
    if (!order.isPaid) return "⏳";
    if (!order.isDelivered) return "🚚";
    return "✅";
  };

  const tabs = [
    { id: 'overview', name: 'Aperçu', icon: '📊' },
    { id: 'orders', name: 'Mes Commandes', icon: '📦' },
    { id: 'wishlist', name: 'Liste de Souhaits', icon: '❤️' },
    { id: 'profile', name: 'Profil', icon: '👤' },
    { id: 'reviews', name: 'Mes Avis', icon: '⭐' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return <div className="p-8 text-gray-700">Chargement du profil...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Compte</h1>
          <p className="text-gray-600">Bienvenue, {user.name} !</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Commandes</p>
                      <p className="text-2xl font-bold text-blue-900">{orders.length}</p>
                    </div>
                    <span className="text-3xl">📦</span>
                  </div>
                </div>
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Commandes Livrées</p>
                      <p className="text-2xl font-bold text-green-900">
                        {orders.filter(o => o.isDelivered).length}
                      </p>
                    </div>
                    <span className="text-3xl">✅</span>
                  </div>
                </div>
                <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Liste de Souhaits</p>
                      <p className="text-2xl font-bold text-purple-900">{wishlist.length}</p>
                    </div>
                    <span className="text-3xl">❤️</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Commandes Récentes</h3>
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((order) => (
                      <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getOrderIcon(order)}</span>
                          <div>
                            <p className="font-medium text-gray-900">#{order._id.slice(-6)}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">€{order.totalPrice}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getOrderStatus(order).color}`}>
                            {getOrderStatus(order).text}
                          </span>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <p className="text-gray-500 text-center py-8">Aucune commande pour le moment</p>
                    )}
                  </div>
                </div>

                {/* Profile Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Personnelles</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nom:</span>
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Membre depuis:</span>
                        <span className="font-medium">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Link
                      to="/customer/edit"
                      className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Modifier le profil
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Toutes Mes Commandes</h3>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl mb-4 block">📦</span>
                  <p className="text-gray-500 text-lg mb-4">Aucune commande pour le moment</p>
                  <Link
                    to="/products"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Découvrir nos produits
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getOrderIcon(order)}</span>
                          <div>
                            <h4 className="font-semibold text-gray-900">Commande #{order._id.slice(-6)}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">€{order.totalPrice}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getOrderStatus(order).color}`}>
                            {getOrderStatus(order).text}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-600">Méthode de paiement:</span>
                          <p className="font-medium">{order.paymentMethod}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Articles:</span>
                          <p className="font-medium">{order.orderItems.length} produit(s)</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Livraison:</span>
                          <p className="font-medium">{order.shippingAddress.city}, {order.shippingAddress.country}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <Link
                          to={`/order/${order._id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          Voir les détails →
                        </Link>
                        {order.isDelivered && !order.reviewToken && (
                          <Link
                            to={`/review/${order._id}`}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Laisser un avis
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ma Liste de Souhaits</h3>
              {wishlist.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl mb-4 block">❤️</span>
                  <p className="text-gray-500 text-lg mb-4">Votre liste de souhaits est vide</p>
                  <Link
                    to="/products"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Découvrir nos produits
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Wishlist items will be displayed here */}
                  <p className="text-gray-500">Fonctionnalité en cours de développement...</p>
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du Profil</h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
                    <p className="text-gray-900 font-medium">{user.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <p className="text-gray-900 font-medium">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Membre depuis</label>
                    <p className="text-gray-900 font-medium">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dernière connexion</label>
                    <p className="text-gray-900 font-medium">
                      {new Date(user.updatedAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex space-x-4">
                  <Link
                    to="/customer/edit"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Modifier le profil
                  </Link>
                  <button className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
                    Changer le mot de passe
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mes Avis</h3>
              <div className="text-center py-12">
                <span className="text-6xl mb-4 block">⭐</span>
                <p className="text-gray-500 text-lg mb-4">Fonctionnalité des avis en cours de développement</p>
                <p className="text-gray-400">Vous pourrez bientôt voir et gérer tous vos avis ici</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Account;

