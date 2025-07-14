import { addCartItem } from '../api/cart';
import { getProductById } from '../api/products';
import { toast } from 'react-toastify';

export const reorderOrderItems = async (orderItems) => {
  const token = localStorage.getItem('token');
  for (const item of orderItems) {
    // Always fetch the latest product info
    let product;
    try {
      const res = await getProductById(item.product?._id || item._id);
      product = res.data || res.product || res;
    } catch {
      toast.error('A product in your order is no longer available.');
      continue;
    }
    if (!product || product.archived) {
      toast.error(`${item.name || 'Product'} is no longer available.`);
      continue;
    }
    if (product.stock === 0) {
      toast.error(`${product.name} is out of stock.`);
      continue;
    }
    const qtyToAdd = Math.min(item.qty || 1, product.stock);
    if (qtyToAdd < (item.qty || 1)) {
      toast.warn(`Only ${qtyToAdd} of ${product.name} could be added (stock limit).`);
    }
    if (token) {
      try {
        await addCartItem(product._id, qtyToAdd);
      } catch {
        toast.error(`Could not add ${product.name} to cart.`);
      }
    } else {
      // Guest: use localStorage
      let cart = [];
      try {
        cart = JSON.parse(localStorage.getItem('guestCart')) || [];
      } catch {
        cart = [];
      }
      const existing = cart.find((c) => c._id === product._id);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + qtyToAdd, product.stock);
      } else {
        cart.push({
          _id: product._id,
          name: product.name,
          price: product.price,
          description: product.description,
          image: product.image,
          quantity: qtyToAdd,
          stock: product.stock,
          category: product.category,
        });
      }
      localStorage.setItem('guestCart', JSON.stringify(cart));
    }
  }
}; 