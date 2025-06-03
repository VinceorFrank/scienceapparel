import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4 text-white">
      <ul className="flex flex-wrap gap-4">
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
      </ul>
    </nav>
  );
};

export default Navbar; 