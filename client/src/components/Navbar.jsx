import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("customerToken");

  const handleLogout = () => {
    localStorage.removeItem("customerToken");
    navigate("/login");
  };

  return (
    <nav className="bg-gray-800 p-4 text-white">
      <ul className="flex flex-wrap gap-4 items-center">
        <li><Link to="/">Accueil</Link></li>
        <li><Link to="/products">Produits</Link></li>
        <li><Link to="/cart">Panier</Link></li>
        <li><Link to="/order-tracking">Commande en cours</Link></li>
        <li><Link to="/account">Espace client</Link></li>
        <li><Link to="/about">À propos</Link></li>
        <li><Link to="/faq">FAQ</Link></li>
        <li><Link to="/shipping">Livraison</Link></li>
        <li><Link to="/reviews">Avis</Link></li>
        <li><Link to="/newsletter">Newsletter</Link></li>
        <li><Link to="/responsibility">Responsabilité</Link></li>
        <li><Link to="/calendly">Calendly</Link></li>
        <li><Link to="/complaint">Plainte</Link></li>

        {isLoggedIn && (
          <li>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
            >
              Déconnexion
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
