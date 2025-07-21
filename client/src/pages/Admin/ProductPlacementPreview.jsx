import React, { useEffect, useState } from 'react';
import api from "../../api/config";
import { useLang } from "../../utils/lang";

// Define pages and slot layout
const PAGE_SLOT_LAYOUT = {
  home: ['hero', 'featured', 'mini'],
  accessories: ['featured', 'sidebar'],
  'clothing-accessories': ['featured', 'sidebar'],
  legacy: ['homepageSlot'],
};

const pastelColors = ['bg-pink-100', 'bg-blue-100', 'bg-yellow-100', 'bg-green-100', 'bg-purple-100'];

const ProductPlacementPreview = () => {
  const [products, setProducts] = useState([]);
  const { t } = useLang();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/products/admin", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setProducts(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch products for preview:", err);
      }
    };
    fetch();
  }, []);

  // Group products by placement
  const placementMap = {};
  const unassigned = [];

  for (const product of products) {
    const placements = product.placement?.length
      ? product.placement
      : product.homepageSlot
      ? [{ page: 'legacy', slot: product.homepageSlot }]
      : [];

    if (placements.length === 0) {
      unassigned.push(product);
      continue;
    }

    for (const loc of placements) {
      const { page, slot } = loc;
      if (!page || !slot) {
        unassigned.push(product);
        continue;
      }
      if (!placementMap[page]) placementMap[page] = {};
      if (!placementMap[page][slot]) placementMap[page][slot] = [];
      placementMap[page][slot].push(product);
    }
  }

  const getImage = (img) =>
    img && img.startsWith("http") ? img : img ? `http://localhost:5000${img}` : "/placeholder.png";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">
        {t("productPlacementPreview") || "Product Placement Preview"}
      </h1>

      {Object.entries(PAGE_SLOT_LAYOUT).map(([page, slots], pageIdx) => (
        <section key={page} className="mb-10">
          <h2 className="text-xl font-semibold mb-4 capitalize">{page.replace("-", " ")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slots.map((slot, slotIdx) => {
              const assigned = placementMap[page]?.[slot] || [];
              const color = pastelColors[(pageIdx + slotIdx) % pastelColors.length];
              return (
                <div key={slot} className={`p-4 rounded shadow ${color}`}>
                  <h3 className="text-sm font-bold mb-3 uppercase tracking-wide">Slot: {slot}</h3>
                  {assigned.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {assigned.map((p) => (
                        <div
                          key={p._id}
                          className="bg-white rounded shadow p-2 text-center"
                        >
                          <img
                            src={getImage(p.image)}
                            alt={p.name}
                            className="h-16 w-16 object-cover mx-auto mb-1 rounded"
                          />
                          <p className="text-xs font-semibold">{p.name}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">No products in this slot</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {unassigned.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-3 text-red-500">Unassigned Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {unassigned.map((p) => (
              <div key={p._id} className="bg-white rounded shadow p-3 text-center">
                <img
                  src={getImage(p.image)}
                  alt={p.name}
                  className="h-16 w-16 object-cover mx-auto mb-1 rounded"
                />
                <p className="text-sm">{p.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductPlacementPreview; 