import Papa from 'papaparse';
import { saveAs } from 'file-saver';

// Export products to CSV
export const exportProducts = (products) => {
  const csvData = products.map(product => ({
    'Product ID': product._id,
    'Name': product.name,
    'Description': product.description,
    'Price': product.price,
    'Category': product.category?.name || '',
    'Stock': product.stock,
    'SKU': product.sku || '',
    'Brand': product.brand || '',
    'Status': product.status || 'active',
    'Created At': new Date(product.createdAt).toLocaleDateString(),
    'Updated At': new Date(product.updatedAt).toLocaleDateString()
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `products_${new Date().toISOString().split('T')[0]}.csv`);
};

// Export orders to CSV
export const exportOrders = (orders) => {
  const csvData = orders.map(order => ({
    'Order ID': order._id,
    'Customer Name': order.user?.name || '',
    'Customer Email': order.user?.email || '',
    'Order Date': new Date(order.createdAt).toLocaleDateString(),
    'Status': order.status,
    'Total Amount': order.totalAmount,
    'Payment Status': order.paymentStatus,
    'Shipping Address': order.shippingAddress?.address || '',
    'City': order.shippingAddress?.city || '',
    'State': order.shippingAddress?.state || '',
    'Zip Code': order.shippingAddress?.zipCode || '',
    'Country': order.shippingAddress?.country || '',
    'Items Count': order.items?.length || 0
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `orders_${new Date().toISOString().split('T')[0]}.csv`);
};

// Export users to CSV (with privacy considerations)
export const exportUsers = (users) => {
  const csvData = users.map(user => ({
    'User ID': user._id,
    'Name': user.name,
    'Email': user.email,
    'Role': user.role || 'customer',
    'Status': user.isActive ? 'Active' : 'Inactive',
    'Joined Date': new Date(user.createdAt).toLocaleDateString(),
    'Last Login': user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
    'Orders Count': user.ordersCount || 0,
    'Total Spent': user.totalSpent || 0
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `users_${new Date().toISOString().split('T')[0]}.csv`);
};

// Export categories to CSV
export const exportCategories = (categories) => {
  const csvData = categories.map(category => ({
    'Category ID': category._id,
    'Name': category.name,
    'Description': category.description || '',
    'Slug': category.slug,
    'Parent Category': category.parent?.name || '',
    'Products Count': category.productsCount || 0,
    'Status': category.isActive ? 'Active' : 'Inactive',
    'Created At': new Date(category.createdAt).toLocaleDateString()
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `categories_${new Date().toISOString().split('T')[0]}.csv`);
};

// Export newsletter subscribers to CSV
export const exportSubscribers = (subscribers) => {
  const csvData = subscribers.map(subscriber => ({
    'Email': subscriber.email,
    'Status': subscriber.status,
    'Subscribed Date': new Date(subscriber.subscribedAt).toLocaleDateString(),
    'Unsubscribed Date': subscriber.unsubscribedAt ? new Date(subscriber.unsubscribedAt).toLocaleDateString() : ''
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
};

// Export campaign history to CSV
export const exportCampaigns = (campaigns) => {
  const csvData = campaigns.map(campaign => ({
    'Campaign ID': campaign._id,
    'Subject': campaign.subject,
    'Status': campaign.status,
    'Recipients': campaign.recipientCount,
    'Sent By': campaign.sentBy?.name || campaign.sentBy?.email || '',
    'Sent Date': campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : '',
    'Scheduled Date': campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleDateString() : '',
    'Created At': new Date(campaign.createdAt).toLocaleDateString()
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `newsletter_campaigns_${new Date().toISOString().split('T')[0]}.csv`);
};

// Generic export function
export const exportToCSV = (data, filename, headers = null) => {
  let csvData = data;
  
  if (headers) {
    csvData = data.map(item => {
      const newItem = {};
      Object.keys(headers).forEach(key => {
        newItem[headers[key]] = item[key] || '';
      });
      return newItem;
    });
  }

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
}; 