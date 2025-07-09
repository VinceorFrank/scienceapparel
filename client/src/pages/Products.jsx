import React, { useState, useEffect } from "react";
import PastelCard from "../components/PastelCard";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { addCartItem } from "../api/cart";
import { fetchProducts } from "../api/products";

const categories = [
  { key: "all", label: "Tous" },
  { key: "clothing", label: "Clothing & Accessories" },
  { key: "accessories", label: "Accessories" },
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
const addToGuestCart = (product) => {
  const cart = getGuestCart();
  const existing = cart.find((item) => item._id === product._id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  setGuestCart(cart);
};

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartMessage, setCartMessage] = useState("");
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchProducts();
        // data.items or data.data depending on backend response
        setProducts(data.items || data.data || []);
      } catch (err) {
        setError("Erreur lors du chargement des produits");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

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
    const token = localStorage.getItem("token");
    if (token) {
      // Logged-in: call backend
      try {
        await addCartItem(product._id, 1);
        setCartMessage(`${product.name} ajouté au panier !`);
      } catch (err) {
        setError("Erreur lors de l'ajout au panier.");
      }
    } else {
      // Guest: use localStorage
      addToGuestCart(product);
      setCartMessage(`${product.name} ajouté au panier (invité) !`);
    }
    setTimeout(() => setCartMessage(""), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-white py-12 px-4">
      <Header />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-6 text-center" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
          Nos Produits
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
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex gap-4 mt-2">
            <Link to="/clothing-accessories" className="text-blue-500 underline hover:text-blue-700 font-medium">Clothing & Accessories</Link>
            <Link to="#" className="text-blue-500 underline hover:text-blue-700 font-medium">Accessories</Link>
          </div>
        </div>
        {/* Cart Message */}
        {cartMessage && (
          <div className="text-center mb-4 text-green-600 font-semibold">{cartMessage}</div>
        )}
        {error && (
          <div className="text-center mb-4 text-red-600 font-semibold">{error}</div>
        )}
        {loading ? (
          <div className="text-center text-lg text-blue-400">Chargement des produits...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">Aucun produit trouvé.</div>
            ) : (
              filteredProducts.map((product) => {
                const isOutOfStock = product.stock === 0;
                const isArchived = product.archived;
                return (
                  <PastelCard
                    key={product._id}
                    image={product.image || "/placeholder.png"}
                    name={product.name}
                    price={product.price}
                    onAddToCart={(!isOutOfStock && !isArchived) ? () => handleAddToCart(product) : undefined}
                  >
                    <p className="text-slate-500 text-sm mb-2">{product.description}</p>
                    {isOutOfStock && (
                      <div className="text-red-500 font-semibold mt-2">Rupture de stock</div>
                    )}
                    {isArchived && (
                      <div className="text-gray-400 font-semibold mt-2">Produit archivé</div>
                    )}
                    <Link to={`/product/${product._id}`} className="block mt-2 text-blue-500 underline hover:text-blue-700 font-medium">Voir le produit</Link>
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
