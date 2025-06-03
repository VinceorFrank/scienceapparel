import React, { useEffect, useState } from "react";
import { fetchProducts } from "../api/products";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div>
      <h1>Produits</h1>
      <ul>
        {products.length === 0 && <li>Aucun produit</li>}
        {products.map((p) => (
          <li key={p._id || p.id}>{p.name || JSON.stringify(p)}</li>
        ))}
      </ul>
    </div>
  );
};

export default Products;
