import React, { useEffect, useState } from "react";
import { getBoxTiers, getCarriers } from "../api/shipping";

const Shipping = () => {
  const [tiers, setTiers] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const tiersRes = await getBoxTiers();
        const carriersRes = await getCarriers();
        setTiers(tiersRes.tiers || []);
        setCarriers(carriersRes.carriers || []);
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Shipping Information</h1>
      <p className="mb-6 text-gray-700">Learn about our shipping box sizes, available carriers, and frequently asked questions.</p>

      {/* Box Tiers */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Box Sizes</h2>
        {loading ? (
          <div>Loading box sizes...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tiers.map((tier) => (
              <div key={tier.name} className="border rounded-lg p-4 bg-white shadow">
                <div className="font-bold text-lg mb-1">{tier.name}</div>
                <div className="text-gray-600 mb-1">Max Items: {tier.maxItems}</div>
                <div className="text-gray-600 mb-1">Dimensions: {tier.dimensions.length} × {tier.dimensions.width} × {tier.dimensions.height} cm</div>
                <div className="text-gray-600 mb-1">Weight: {tier.weightEstimate} kg</div>
                <div className="text-gray-500 text-sm">{tier.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Carriers */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Available Carriers</h2>
        {loading ? (
          <div>Loading carriers...</div>
        ) : (
          <ul className="list-disc pl-6">
            {carriers.map((carrier) => (
              <li key={carrier.name} className="mb-1 font-medium text-gray-700">{carrier.name} <span className="text-gray-500 text-sm">({carrier.description})</span></li>
            ))}
          </ul>
        )}
      </div>

      {/* FAQ */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Frequently Asked Questions</h2>
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div>
            <div className="font-medium">How is my shipping cost calculated?</div>
            <div className="text-gray-600 text-sm">Shipping cost is based on your order size, weight, and destination. We offer live rates from multiple carriers and always show you the best options at checkout.</div>
          </div>
          <div>
            <div className="font-medium">Can I choose my shipping carrier?</div>
            <div className="text-gray-600 text-sm">Yes! You can select from available carriers and services during checkout.</div>
          </div>
          <div>
            <div className="font-medium">How are box sizes assigned?</div>
            <div className="text-gray-600 text-sm">Our system automatically selects the best box size for your order based on the number of items.</div>
          </div>
          <div>
            <div className="font-medium">How do I track my shipment?</div>
            <div className="text-gray-600 text-sm">If your shipping option includes tracking, you'll receive a tracking number by email after your order is shipped.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shipping;
