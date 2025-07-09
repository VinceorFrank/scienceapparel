import React from "react";

const PastelCard = ({
  icon,
  label,
  value,
  color = "pastel-yellow",
  iconColor = "text-pastel-purple",
  image,
  name,
  price,
  onAddToCart,
  children,
}) => (
  <div className={`bg-gradient-to-br from-pink-100 via-blue-100 to-white rounded-2xl shadow-lg p-6 flex flex-col items-center transition-transform duration-300 ease-in-out hover:scale-105 border border-pink-100`}>
    {image && (
      <img
        src={image}
        alt={name || label}
        className="w-28 h-28 object-cover rounded-xl shadow mb-3 border-4 border-white"
        onError={e => { e.target.src = '/placeholder.png'; }}
      />
    )}
    {icon && <span className={`text-5xl mb-2 ${iconColor}`}>{icon}</span>}
    <h2 className="font-bold text-lg mb-1 text-center" style={{ fontFamily: 'Fredoka One, cursive', color: '#F472B6' }}>{name || label}</h2>
    {price !== undefined && (
      <p className="text-pink-500 font-bold text-xl mb-2">${price.toFixed(2)}</p>
    )}
    {value && <p className="text-3xl font-bold">{value}</p>}
    {children}
    {onAddToCart && (
      <button
        className="mt-3 px-4 py-2 bg-pink-400 text-white font-semibold rounded-full text-sm hover:bg-pink-500 transition-colors"
        onClick={onAddToCart}
      >
        Ajouter au panier
      </button>
    )}
  </div>
);

export default PastelCard; 