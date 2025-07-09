import React from "react";
import PastelCard from "../components/PastelCard";
import Header from "../components/Header";
import { addCartItem } from "../api/cart";

const sampleProducts = [
  {
    id: 1,
    name: "T-shirt à poche",
    price: 29.99,
    category: "clothing",
    image: "/placeholder.png",
    description: "Un t-shirt original avec une poche amusante.",
  },
  {
    id: 2,
    name: "Crewneck pastel",
    price: 49.99,
    category: "clothing",
    image: "/placeholder.png",
    description: "Crewneck doux et confortable, parfait pour toutes les saisons.",
  },
  {
    id: 3,
    name: "Tote bag accessoire",
    price: 19.99,
    category: "accessories",
    image: "/placeholder.png",
    description: "Un tote bag pratique pour tous les jours.",
  },
  {
    id: 4,
    name: "Casquette pastel",
    price: 15.99,
    category: "accessories",
    image: "/placeholder.png",
    description: "Casquette stylée pour compléter votre look.",
  },
];

const ClothingAccessories = () => {
  const clothingProducts = sampleProducts.filter((p) => p.category === "clothing");
  const [cartMessage, setCartMessage] = React.useState("");

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        await addCartItem(product._id, 1);
        setCartMessage(`${product.name} ajouté au panier !`);
      } catch (err) {
        setCartMessage("Erreur lors de l'ajout au panier.");
      }
    } else {
      let guestCart = [];
      try {
        guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
      } catch { guestCart = []; }
      const existing = guestCart.find((item) => item._id === product._id);
      if (existing) {
        existing.quantity += 1;
      } else {
        guestCart.push({ ...product, quantity: 1 });
      }
      localStorage.setItem("guestCart", JSON.stringify(guestCart));
      setCartMessage(`${product.name} ajouté au panier (invité) !`);
    }
    setTimeout(() => setCartMessage(""), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-white py-12 px-4">
      <Header />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-6 text-center" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
          Clothing & Accessories
        </h1>
        {cartMessage && (
          <div className="text-center mb-4 text-green-600 font-semibold">{cartMessage}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {clothingProducts.map((product) => (
            <PastelCard
              key={product.id}
              image={product.image}
              name={product.name}
              price={product.price}
              onAddToCart={() => handleAddToCart(product)}
            >
              <p className="text-slate-500 text-sm mb-2">{product.description}</p>
            </PastelCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClothingAccessories; 