import React, { useState } from "react";
import Header from "../components/Header";

const Reviews = () => {
  const [activeTab, setActiveTab] = useState('all');

  // Sample reviews data
  const reviews = [
    {
      id: 1,
      name: "Marie-Claude Tremblay",
      rating: 5,
      date: "2024-01-15",
      product: "T-shirt à poche",
      comment: "Excellent produit ! La qualité est au rendez-vous et la livraison était rapide. Je recommande vivement !",
      verified: true,
      category: "clothing"
    },
    {
      id: 2,
      name: "Jean-François Bouchard",
      rating: 4,
      date: "2024-01-10",
      product: "Crewneck pastel",
      comment: "Très satisfait de mon achat. Le crewneck est confortable et le design est original. Livraison dans les délais.",
      verified: true,
      category: "clothing"
    },
    {
      id: 3,
      name: "Sophie Lavoie",
      rating: 5,
      date: "2024-01-08",
      product: "Tote bag accessoire",
      comment: "Parfait pour mes courses ! Solide et élégant. Je l'utilise tous les jours. Service client impeccable.",
      verified: true,
      category: "accessories"
    },
    {
      id: 4,
      name: "Pierre Dubois",
      rating: 4,
      date: "2024-01-05",
      product: "Casquette pastel",
      comment: "Belle casquette, bonne qualité. Un peu petite pour ma tête mais très jolie. Recommandé !",
      verified: true,
      category: "accessories"
    },
    {
      id: 5,
      name: "Annie Gagnon",
      rating: 5,
      date: "2024-01-03",
      product: "T-shirt à poche",
      comment: "J'adore ce t-shirt ! Original et confortable. La poche est pratique et le design est unique. Merci !",
      verified: true,
      category: "clothing"
    },
    {
      id: 6,
      name: "Marc-André Roy",
      rating: 5,
      date: "2023-12-28",
      product: "Crewneck pastel",
      comment: "Excellent service et produit de qualité. Livraison rapide et emballage écologique. Je reviendrai !",
      verified: true,
      category: "clothing"
    }
  ];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} className={index < rating ? "text-yellow-400" : "text-gray-300"}>
        ★
      </span>
    ));
  };

  const filteredReviews = activeTab === 'all' 
    ? reviews 
    : reviews.filter(review => review.category === activeTab);

  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-white py-12 px-4">
      <Header />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8 text-center" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
          Avis Clients
        </h1>

        {/* Overall Rating Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-pink-100 mb-8">
          <div className="text-center">
            <div className="text-6xl font-bold text-blue-600 mb-2">{averageRating.toFixed(1)}</div>
            <div className="text-2xl mb-2">{renderStars(Math.round(averageRating))}</div>
            <p className="text-gray-600 mb-4">Basé sur {reviews.length} avis vérifiés</p>
            <div className="flex justify-center gap-8 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">98%</div>
                <div className="text-gray-500">Clients satisfaits</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">24h</div>
                <div className="text-gray-500">Livraison moyenne</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">4.8/5</div>
                <div className="text-gray-500">Note globale</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full p-2 shadow-lg border border-pink-100">
            {[
              { key: 'all', label: 'Tous les avis' },
              { key: 'clothing', label: 'Vêtements' },
              { key: 'accessories', label: 'Accessoires' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredReviews.map(review => (
            <div key={review.id} className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">{review.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-sm text-gray-500">{review.date}</span>
                    {review.verified && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        ✓ Vérifié
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-blue-600 font-medium">{review.product}</div>
                  <div className="text-xs text-gray-500 capitalize">{review.category}</div>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>

        {/* Write Review Section */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-lg border border-pink-100">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Partagez Votre Expérience
          </h2>
          <div className="max-w-2xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Produit acheté
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom du produit"
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    className="text-3xl text-gray-300 hover:text-yellow-400 transition-colors duration-200"
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre avis
              </label>
              <textarea
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Partagez votre expérience avec ce produit..."
              ></textarea>
            </div>
            <div className="text-center">
              <button className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-8 py-3 rounded-full font-semibold hover:from-blue-500 hover:to-purple-600 transition-all duration-200 shadow-lg">
                Publier mon avis
              </button>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold mb-6 text-gray-700">
            Pourquoi nos clients nous font confiance
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-pink-100">
              <div className="text-3xl mb-4">🔒</div>
              <h4 className="font-semibold mb-2">Avis Vérifiés</h4>
              <p className="text-sm text-gray-600">
                Tous nos avis proviennent d'achats réels vérifiés
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-pink-100">
              <div className="text-3xl mb-4">⚡</div>
              <h4 className="font-semibold mb-2">Livraison Rapide</h4>
              <p className="text-sm text-gray-600">
                Livraison en 24h dans tout le Québec
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-pink-100">
              <div className="text-3xl mb-4">💯</div>
              <h4 className="font-semibold mb-2">Satisfaction Garantie</h4>
              <p className="text-sm text-gray-600">
                Retours gratuits sous 30 jours
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
