import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById } from "../api/products";
import { addCartItem, mergeGuestCart } from "../api/cart";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await getProductById(id);
        setProduct(response);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les détails du produit.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Add this useEffect to merge guest cart after login
  useEffect(() => {
    const token = localStorage.getItem("token");
    const guestCart = localStorage.getItem("guestCart");
    if (token && guestCart) {
      try {
        const guestCartItems = JSON.parse(guestCart).map(item => ({
          productId: item._id,
          quantity: item.quantity
        }));
        if (guestCartItems.length > 0) {
          mergeGuestCart(guestCartItems).then(() => {
            localStorage.removeItem("guestCart");
          });
        }
      } catch {}
    }
  }, []);

  const handleAddToCart = async () => {
    if (!product) return;
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await addCartItem(product._id, quantity);
        alert(`${product.name} ajouté au panier !`);
      } catch (err) {
        alert("Erreur lors de l'ajout au panier.");
      }
    } else {
      // Guest: use localStorage
      let guestCart = [];
      try {
        guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
      } catch { guestCart = []; }
      const existing = guestCart.find((item) => item._id === product._id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        guestCart.push({ ...product, quantity });
      }
      localStorage.setItem("guestCart", JSON.stringify(guestCart));
      alert(`${product.name} ajouté au panier (invité) !`);
    }
  };

  const handleBuyNow = () => {
    // TODO: Implement buy now functionality
    console.log('Buying now:', { product, quantity });
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder.png';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000/uploads/images/${imagePath}`;
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
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
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour aux produits
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl mb-4 block">🔍</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Produit introuvable</h2>
          <p className="text-gray-600 mb-4">Ce produit n'existe pas ou a été supprimé.</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour aux produits
          </button>
        </div>
      </div>
    );
  }

  // Create image array with main image and additional images
  const images = [
    product.image,
    ...(product.additionalImages || [])
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <button
                onClick={() => navigate("/")}
                className="hover:text-blue-600 transition-colors"
              >
                Accueil
              </button>
            </li>
            <li>/</li>
            <li>
              <button
                onClick={() => navigate("/products")}
                className="hover:text-blue-600 transition-colors"
              >
                Produits
              </button>
            </li>
            <li>/</li>
            <li>
              <button
                onClick={() => navigate(`/products?category=${product.category?._id}`)}
                className="hover:text-blue-600 transition-colors"
              >
                {product.category?.name || "Catégorie"}
              </button>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <img
                src={images[selectedImage] ? getImageUrl(images[selectedImage]) : '/placeholder.png'}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/placeholder.png';
                }}
              />
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-white rounded-lg border-2 overflow-hidden transition-colors ${
                      selectedImage === index
                        ? 'border-blue-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image ? getImageUrl(image) : '/placeholder.png'}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder.png';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            {/* Basic Info */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-green-600">€{product.price.toFixed(2)}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-lg text-gray-500 line-through">
                      €{product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Category and Rating */}
              <div className="flex items-center space-x-4 mb-6">
                {product.category && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {product.category.name}
                  </span>
                )}
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-gray-600">4.5 (128 avis)</span>
                </div>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">{product.stock} en stock</span>
              </div>

              {/* Description */}
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            </div>

            {/* Product Features */}
            {product.features && product.features.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Caractéristiques</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity and Actions */}
            <div className="space-y-6">
              {/* Quantity Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-16 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.countInStock || product.stock, quantity + 1))}
                    className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    disabled={quantity >= (product.countInStock || product.stock)}
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-500">
                    {(product.countInStock || product.stock) || 0} disponibles
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  🛒 Ajouter au panier
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  💳 Acheter maintenant
                </button>
              </div>

              {/* Stock Status */}
              {product.stock === 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-500">⚠️</span>
                    <span className="text-red-700 font-medium">Rupture de stock</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">
                    Ce produit n'est actuellement pas disponible.
                  </p>
                </div>
              )}

              {product.stock > 0 && product.stock <= 5 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-500">⚡</span>
                    <span className="text-yellow-700 font-medium">Stock limité</span>
                  </div>
                  <p className="text-yellow-600 text-sm mt-1">
                    Plus que {product.stock} exemplaire(s) en stock !
                  </p>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">SKU:</span>
                  <p className="font-medium">{product._id.slice(-6)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Référence:</span>
                  <p className="font-medium">{product.name.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Avis clients</h2>
            
            {/* Reviews Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">4.5</div>
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-yellow-400">⭐</span>
                    ))}
                  </div>
                  <p className="text-gray-600">Basé sur 128 avis</p>
                </div>
                
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600 w-8">{rating} étoiles</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${(rating === 5 ? 60 : rating === 4 ? 25 : rating === 3 ? 10 : rating === 2 ? 3 : 2)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-12">
                          {rating === 5 ? 60 : rating === 4 ? 25 : rating === 3 ? 10 : rating === 2 ? 3 : 2}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Reviews */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">JD</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Jean Dupont</p>
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                        <span className="text-gray-500 text-sm">Il y a 2 jours</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700">
                  Excellent produit ! La qualité est au rendez-vous et la livraison a été rapide. 
                  Je recommande vivement ce produit à tous ceux qui cherchent quelque chose de fiable.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-medium">ML</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Marie Laurent</p>
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">⭐⭐⭐⭐</span>
                        <span className="text-gray-500 text-sm">Il y a 1 semaine</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700">
                  Très satisfaite de mon achat. Le produit correspond parfaitement à la description. 
                  Seul petit bémol : la livraison a pris un peu plus de temps que prévu.
                </p>
              </div>
            </div>

            {/* Write Review Button */}
            <div className="mt-8 text-center">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                ✍️ Écrire un avis
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Produits similaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Placeholder for related products */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <p className="text-gray-500">Produits similaires à venir...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
