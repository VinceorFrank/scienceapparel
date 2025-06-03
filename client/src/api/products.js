export async function fetchProducts() {
  const res = await fetch(import.meta.env.VITE_API_URL + "/products");
  if (!res.ok) throw new Error("Erreur lors du chargement des produits");
  return res.json();
} 