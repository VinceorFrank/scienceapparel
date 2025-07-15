import React, { useState, useEffect } from "react";
import PastelCard from "../components/PastelCard";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { addCartItem, getCart } from "../api/cart";
import { fetchProducts } from "../api/products";
import { toast } from 'react-toastify';
import { useLang } from "../utils/lang";

const categories = [
  { key: "all", label: "all" },
  { key: "clothing", label: "clothingAndAccessories" },
  { key: "accessories", label: "accessories" },
];

// Helper functions for guest cart
const getGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem("guestCart")) || [];
  } catch {
    return [];
  }
};
const setGuestCart = (cart) => {
  localStorage.setItem("guestCart", JSON.stringify(cart));
};
const getCartQuantity = (productId) => {
  const token = localStorage.getItem("token");
  if (token) {
    // For simplicity, only check guest cart here; backend cart check would require API call
    // For a real app, fetch cart from backend and check quantity
    return 0;
  } else {
    const cart = getGuestCart();
    const item = cart.find((i) => i._id === productId);
    return item ? item.quantity : 0;
  }
};
const addToGuestCart = (product) => {
  const cart = getGuestCart();
  const existing = cart.find((item) => item._id === product._id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  setGuestCart(cart);
  window.dispatchEvent(new Event('cartUpdated'));
};

const Products = () => {
  const { t } = useLang();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartQuantities, setCartQuantities] = useState({});

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchProducts();
        setProducts(data.items || data.data || []);
      } catch (err) {
        setError(t('errorLoadingProducts'));
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
    updateCartQuantities();
    window.addEventListener('cartUpdated', updateCartQuantities);
    return () => window.removeEventListener('cartUpdated', updateCartQuantities);
  }, []);

  const updateCartQuantities = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      const cart = getGuestCart();
      const quantities = {};
      cart.forEach(item => {
        quantities[item._id] = item.quantity;
      });
      setCartQuantities(quantities);
    } else {
      // Fetch cart from backend for logged-in users
      try {
        const data = await getCart();
        const items = data.data?.cart?.items || data.cart?.items || [];
        const quantities = {};
        items.forEach(item => {
          // item.product can be an object or id
          const id = item.product?._id || item.product || item._id;
          quantities[id] = item.quantity;
        });
        setCartQuantities(quantities);
      } catch {
        setCartQuantities({});
      }
    }
  };

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => {
          if (!p.category || !p.category.name) return false;
          if (selectedCategory === "clothing") return p.category.name.toLowerCase().includes("apparel");
          if (selectedCategory === "accessories") return p.category.name.toLowerCase().includes("accessories");
          return false;
        });

  const handleAddToCart = async (product) => {
    setError("");
    const currentQty = cartQuantities[product._id] || 0;
    if (product.stock === 0) {
      toast.error(`${product.name} is out of stock!`, { position: "top-center", autoClose: 2000 });
      return;
    }
    if (product.stock <= currentQty) {
      toast.warn(`Only ${product.stock} in stock. You already have ${currentQty} in your cart.`, { position: "top-center", autoClose: 3000 });
      return;
    }
    const token = localStorage.getItem("token");
    if (token) {
      // Logged-in: call backend and refresh cart quantities
      try {
        await addCartItem(product._id, 1);
        toast.success(`${product.name} ${t('addedToCart')}`, { position: "top-center", autoClose: 2000 });
        window.dispatchEvent(new Event('cartUpdated'));
        await updateCartQuantities();
      } catch (err) {
        toast.error(t('errorAddingToCart'), { position: "top-center", autoClose: 2000 });
      }
    } else {
      // Guest: use localStorage
      addToGuestCart(product);
      toast.success(`${product.name} ${t('addedToCartGuest')}`, { position: "top-center", autoClose: 2000 });
      const newQty = (cartQuantities[product._id] || 0) + 1;
      setCartQuantities({ ...cartQuantities, [product._id]: newQty });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-white py-12 px-4">
      <Header />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-6 text-center" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
          {t('ourProducts')}
        </h1>
        {/* Category Filter Tabs */}
        <div className="flex flex-col items-center gap-2 mb-10">
          <div className="flex justify-center gap-4">
            {categories.map((cat) => (
              <button
                key={cat.key}
                className={`px-6 py-2 rounded-full font-bold text-lg transition-colors duration-200 ${selectedCategory === cat.key ? 'bg-blue-400 text-white shadow' : 'bg-white text-blue-400 border border-blue-200 hover:bg-blue-100'}`}
                onClick={() => setSelectedCategory(cat.key)}
              >
                {t(cat.label)}
              </button>
            ))}
          </div>
          <div className="flex gap-4 mt-2">
            <Link to="/clothing-accessories" className="text-blue-500 underline hover:text-blue-700 font-medium">{t('clothingAndAccessories')}</Link>
            <Link to="#" className="text-blue-500 underline hover:text-blue-700 font-medium">{t('accessories')}</Link>
          </div>
        </div>
        {error && (
          <div className="text-center mb-4 text-red-600 font-semibold">{error}</div>
        )}
        {loading ? (
          <div className="text-center text-lg text-blue-400">{t('loadingProducts')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">{t('noProductsFound')}</div>
            ) : (
              filteredProducts.map((product) => {
                const isOutOfStock = product.stock === 0;
                const isArchived = product.archived;
                const currentQty = cartQuantities[product._id] || 0;
                const remainingStock = Math.max(product.stock - currentQty, 0);
                const isLowStock = remainingStock <= 10;
                const isMaxed = product.stock > 0 && currentQty >= product.stock;
                return (
                  <PastelCard
                    key={product._id}
                    image={product.image || "/placeholder.png"}
                    name={product.name}
                    price={product.price}
                    onAddToCart={(!isOutOfStock && !isArchived && !isMaxed) ? () => handleAddToCart(product) : undefined}
                  >
                    <p className="text-slate-500 text-sm mb-2">{product.description}</p>
                    <div className="text-yellow-600 font-semibold mt-1">{t('stock')}: {product.stock}</div>
                    {product.stock === 0 && (
                      <div className="text-red-500 font-semibold mt-2">{t('outOfStock')}</div>
                    )}
                    <Link to={`/product/${product._id}`} className="block mt-2 text-blue-500 underline hover:text-blue-700 font-medium">{t('viewProduct')}</Link>
                  </PastelCard>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
