import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartContext } from './CartContext';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const name = localStorage.getItem("userName");
  const role = localStorage.getItem("userRole");
  const { cartCount } = useCartContext();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");

    // ✅ Optional: show a logout success message
    alert("Vous avez été déconnecté avec succès.");
    navigate("/login");
  };

  return (
    <nav className="bg-gray-800 p-4 text-white">
      <ul className="flex flex-wrap gap-4 items-center">
        <li><Link to="/">Accueil</Link></li>
        <li><Link to="/products">Produits</Link></li>
        <li>
          <Link to="/cart" className="relative flex items-center">
            <span>Panier</span>
            <svg className="w-6 h-6 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.35 2.7A2 2 0 008.48 19h7.04a2 2 0 001.83-1.3L17 13M7 13V6a4 4 0 018 0v7" /></svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-lg">
                {cartCount}
              </span>
            )}
          </Link>
        </li>
        <li><Link to="/order-tracking">Commande en cours</Link></li>
        <li><Link to="/account">Espace client</Link></li>
        <li><Link to="/about">À propos</Link></li>
        <li><Link to="/faq">FAQ</Link></li>
        <li><Link to="/shipping">Livraison</Link></li>
        <li><Link to="/reviews">Avis</Link></li>
        <li><Link to="/newsletter">Newsletter</Link></li>
        <li><Link to="/responsibility">Responsabilité</Link></li>
        <li><Link to="/complaint">Plainte</Link></li>

        {/* ✅ Show name and logout if logged in */}
        {token && (
          <>
            <li className="ml-auto text-green-300">Bonjour, {name}</li>
            <li>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                Déconnexion
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;

