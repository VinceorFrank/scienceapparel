import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("customerToken");
  const name = localStorage.getItem("customerName");

  const handleLogout = () => {
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customerName");
    localStorage.removeItem("customerEmail");

    // ✅ Optional: show a logout success message
    alert("Vous avez été déconnecté avec succès.");
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

