import React, { useState } from 'react';
import { 
  exportProducts, 
  exportOrders, 
  exportUsers, 
  exportCategories,
  exportSubscribers,
  exportCampaigns 
} from '../../utils/exportUtils';
import ImportModal from '../../components/ImportModal';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/config';
import { useLang } from '../../utils/lang';

const DataManagement = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedDataType, setSelectedDataType] = useState('products');

  const { t } = useLang();

  // Fetch data for export
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data.products || [];
    }
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data.orders || [];
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.users || [];
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.categories || [];
    }
  });

  const { data: subscribers = [] } = useQuery({
    queryKey: ['newsletter-subscribers'],
    queryFn: async () => {
      const res = await api.get('/newsletter/subscribers');
      return res.data || [];
    }
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['newsletter-campaigns'],
    queryFn: async () => {
      const res = await api.get('/newsletter/campaigns');
      return res.data.campaigns || [];
    }
  });

  // Handle export
  const handleExport = (dataType) => {
    switch (dataType) {
      case 'products':
        exportProducts(products);
        break;
      case 'orders':
        exportOrders(orders);
        break;
      case 'users':
        exportUsers(users);
        break;
      case 'categories':
        exportCategories(categories);
        break;
      case 'subscribers':
        exportSubscribers(subscribers);
        break;
      case 'campaigns':
        exportCampaigns(campaigns);
        break;
      default:
        break;
    }
  };

  // Handle import
  const handleImport = async (csvData) => {
    try {
      const response = await fetch(`/api/admin/csv-import/${selectedDataType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ csvData })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Import failed');
      }

      // Show new users with passwords if any were created
      if (selectedDataType === 'users' && result.newUsersWithPasswords && result.newUsersWithPasswords.length > 0) {
        const passwordInfo = result.newUsersWithPasswords
          .map(user => `${user.name} (${user.email}): ${user.password}`)
          .join('\n');
        alert(`New users created with passwords:\n${passwordInfo}`);
      }

      // Refresh the page to show updated data
      window.location.reload();
      
      return result;
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  };

  const getTemplateHeaders = (dataType) => {
    switch (dataType) {
      case 'products':
        return ['Name', 'Description', 'Price', 'Stock', 'SKU', 'Brand', 'Category', 'Status'];
      case 'categories':
        return ['Name', 'Description', 'Slug', 'Parent Category', 'Status'];
      case 'users':
        return ['Name', 'Email', 'Role', 'Status'];
      default:
        return [];
    }
  };

  const dataTypes = [
    {
      id: 'products',
      name: 'Products',
      description: 'Product catalog with details, pricing, and inventory',
      exportCount: products.length,
      canImport: true
    },
    {
      id: 'orders',
      name: 'Orders',
      description: 'Order history with customer and payment information',
      exportCount: orders.length,
      canImport: false
    },
    {
      id: 'users',
      name: 'Users',
      description: 'Customer and admin user accounts',
      exportCount: users.length,
      canImport: true
    },
    {
      id: 'categories',
      name: 'Categories',
      description: 'Product category structure and hierarchy',
      exportCount: categories.length,
      canImport: true
    },
    {
      id: 'subscribers',
      name: 'Newsletter Subscribers',
      description: 'Email newsletter subscription list',
      exportCount: subscribers.length,
      canImport: false
    },
    {
      id: 'campaigns',
      name: 'Newsletter Campaigns',
      description: 'Newsletter campaign history and statistics',
      exportCount: campaigns.length,
      canImport: false
    }
  ];

  // Map for explicit translation keys for export/import buttons
  const exportKeys = {
    products: 'exportProducts',
    orders: 'exportOrders',
    users: 'exportUsers',
    categories: 'exportCategories',
    subscribers: 'exportSubscribers',
    campaigns: 'exportCampaigns',
  };
  const importKeys = {
    products: 'importProducts',
    users: 'importUsers',
    categories: 'importCategories',
  };

  return (
    <div className="min-h-screen bg-[#FCFAF6] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
          📊 {t('dataManagement')}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dataTypes.map((dataType) => (
            <div key={dataType.id} className="bg-white rounded-3xl shadow-lg p-8 min-h-[260px] flex flex-col justify-between border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold" style={{ color: '#6DD5ED' }}>
                  {t(dataType.id)}
                </h3>
                <span className="text-gray-400 text-sm">
                  {dataType.exportCount} {t('records')}
                </span>
              </div>
              
              <p className="mb-4 text-gray-600">{t(dataType.id + 'Desc')}</p>

              <hr className="my-4 border-blue-100" />
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => handleExport(dataType.id)}
                  className="min-w-[160px] px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>📊</span>
                  <span>{t(exportKeys[dataType.id])}</span>
                </button>
                {dataType.canImport && (
                  <button
                    onClick={() => {
                      setSelectedDataType(dataType.id);
                      setIsImportModalOpen(true);
                    }}
                    className="min-w-[160px] px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>📥</span>
                    <span>{t(importKeys[dataType.id])}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Import Modal */}
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImport}
          title={`Import ${selectedDataType.charAt(0).toUpperCase() + selectedDataType.slice(1)}`}
          dataType={selectedDataType}
          sampleHeaders={getTemplateHeaders(selectedDataType)}
        />
      </div>
    </div>
  );
};

export default DataManagement; 