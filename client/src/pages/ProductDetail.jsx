import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById } from "../api/products";
import { addCartItem, mergeGuestCart, getCart } from "../api/cart";
import { toast } from 'react-toastify';
import { useLang } from "../utils/lang";

const ProductDetail = () => {
  const { t } = useLang();
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartQuantity, setCartQuantity] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await getProductById(id);
        setProduct(response);
      } catch (err) {
        console.error(err);
        setError(t("errorLoadingProductDetails"));
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    fetchCartQuantity();
    window.addEventListener('cartUpdated', fetchCartQuantity);
    return () => window.removeEventListener('cartUpdated', fetchCartQuantity);
  }, [id]);

  const fetchCartQuantity = async () => {
    const token = localStorage.getItem("token");
    if (!product) return;
    if (!token) {
      let guestCart = [];
      try {
        guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
      } catch { guestCart = []; }
      const existing = guestCart.find((item) => item._id === id);
      setCartQuantity(existing ? existing.quantity : 0);
    } else {
      try {
        const data = await getCart();
        const items = data.data?.cart?.items || data.cart?.items || [];
        const found = items.find(item => (item.product?._id || item.product || item._id) === id);
        setCartQuantity(found ? found.quantity : 0);
      } catch {
        setCartQuantity(0);
      }
    }
  };

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
    const remainingStock = product.stock - cartQuantity;
    if (remainingStock <= 0) {
      toast.error(t('stockExhaustedOrInCart'), { position: "top-center", autoClose: 2000 });
      return;
    }
    if (token) {
      try {
        await addCartItem(product._id, quantity);
        toast.success(`${product.name} ${t('addedToCart')}`, { position: "top-center", autoClose: 2000 });
        window.dispatchEvent(new Event('cartUpdated'));
        await fetchCartQuantity();
      } catch (err) {
        toast.error(t("errorAddingToCart"), { position: "top-center", autoClose: 2000 });
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
      toast.success(`${product.name} ${t('addedToCart')}`, { position: "top-center", autoClose: 2000 });
      window.dispatchEvent(new Event('cartUpdated'));
      await fetchCartQuantity();
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('error')}</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('backToProducts')}
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('productNotFound')}</h2>
          <p className="text-gray-600 mb-4">{t('productNotFoundDesc')}</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('backToProducts')}
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

  const remainingStock = product.stock - cartQuantity;

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
                {t('home')}
              </button>
            </li>
            <li>/</li>
            <li>
              <button
                onClick={() => navigate("/products")}
                className="hover:text-blue-600 transition-colors"
              >
                {t('products')}
              </button>
            </li>
            <li>/</li>
            <li>
              <button
                onClick={() => navigate(`/products?category=${product.category?._id}`)}
                className="hover:text-blue-600 transition-colors"
              >
                {product.category?.name || t('category')}
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
                                    <span className="text-yellow-600 font-semibold">{t('stock')}: {product.stock}</span>
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
                  {t('quantity')}
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
                    {remainingStock || 0} {t('available')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  🛒 {t('addToCart')}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  💳 {t('buyNow')}
                </button>
              </div>

              {/* Stock Status */}
              {remainingStock <= 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-500">⚠️</span>
                    <span className="text-red-700 font-medium">{t('outOfStock')}</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">
                    {t('productNotAvailable')}
                  </p>
                </div>
              )}

              {remainingStock > 0 && remainingStock <= 5 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-500">⚡</span>
                    <span className="text-yellow-700 font-medium">{t('limitedStock')}</span>
                  </div>
                  <p className="text-yellow-600 text-sm mt-1">
                    {t('onlyLeftInStock', { count: remainingStock })}
                  </p>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">{t('sku')}:</span>
                  <p className="font-medium">{product._id.slice(-6)}</p>
                </div>
                <div>
                  <span className="text-gray-600">{t('reference')}:</span>
                  <p className="font-medium">{product.name.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('customerReviews')}</h2>
            
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
                  <p className="text-gray-600">{t('basedOnReviews', { count: 128 })}</p>
                </div>
                
                <div className="md:col-span-2">
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600 w-8">{rating} {t('stars')}</span>
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
                        <span className="text-gray-500 text-sm">{t('daysAgo', { count: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700">
                  {t('review1')}
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
                        <span className="text-gray-500 text-sm">{t('weekAgo')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700">
                  {t('review2')}
                </p>
              </div>
            </div>

            {/* Write Review Button */}
            <div className="mt-8 text-center">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                ✍️ {t('writeReview')}
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('similarProducts')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Placeholder for related products */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <p className="text-gray-500">{t('similarProductsComingSoon')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
