import React, { useState } from "react";
import ShippingCalculator from "../components/ShippingCalculator";

// Mock cart items and address for demonstration
const mockCartItems = [
  { name: "Science Mug", qty: 2, price: 12.99, image: "beaker-mug.jpg", product: "1" },
  { name: "Periodic Table Shirt", qty: 1, price: 19.99, image: "periodic-shirt.jpg", product: "2" }
];
const mockAddress = {
  address: "123 Main St",
  city: "Toronto",
  postalCode: "M5V 3A8",
  country: "Canada"
};

const Cart = () => {
  const [selectedShipping, setSelectedShipping] = useState(null);

  // Calculate subtotal
  const subtotal = mockCartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Panier</h1>
      {/* Cart Items */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Articles</h2>
        {mockCartItems.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between border-b py-2">
            <div className="flex items-center space-x-3">
              <img src={`/uploads/images/${item.image}`} alt={item.name} className="w-12 h-12 object-cover rounded border" onError={e => { e.target.src = '/placeholder.png'; }} />
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-500">Qty: {item.qty}</div>
              </div>
            </div>
            <div className="font-medium">${(item.price * item.qty).toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Shipping Calculator */}
      <div className="mb-6">
        <ShippingCalculator
          orderItems={mockCartItems}
          destination={mockAddress}
          selectedShipping={selectedShipping}
          onShippingSelect={setSelectedShipping}
        />
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Résumé de la commande</h2>
        <div className="flex justify-between mb-2">
          <span>Sous-total:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Livraison:</span>
          <span>{selectedShipping ? `$${selectedShipping.rate.toFixed(2)}` : '--'}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Estimation livraison:</span>
          <span>{selectedShipping ? `${selectedShipping.estimatedDays} jours` : '--'}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
          <span>Total:</span>
          <span>${(subtotal + (selectedShipping ? selectedShipping.rate : 0)).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default Cart;
