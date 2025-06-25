import React from "react";

const PastelCard = ({ icon, label, value, color = "pastel-yellow", iconColor = "text-pastel-purple", children }) => (
  <div className={`bg-${color} rounded-2xl shadow-lg p-8 flex flex-col items-center transition-transform duration-300 ease-in-out hover:scale-105`}>
    <span className={`text-5xl mb-2 ${iconColor}`}>{icon}</span>
    <h2 className="font-bold text-xl mb-1">{label}</h2>
    <p className="text-3xl font-bold">{value}</p>
    {children}
  </div>
);

export default PastelCard; 