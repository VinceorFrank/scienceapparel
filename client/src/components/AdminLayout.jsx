import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { logout } from "../utils/logout";
import { useLang } from "../utils/lang";

const AdminLayout = () => {
  const { lang, setLang, t } = useLang();

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-green-50 via-yellow-50 to-white relative">
      {/* Memphis shapes as SVG background */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{zIndex:0}}>
        <circle cx="80" cy="80" r="40" fill="#FFB6C1" opacity="0.2"/>
        <rect x="300" y="100" width="80" height="80" fill="#C3B1E1" opacity="0.2"/>
        <polygon points="600,50 650,100 550,100" fill="#FFFACD" opacity="0.2"/>
        {/* Add more shapes for fun */}
      </svg>
      
      {/* Sidebar */}
      <aside className="w-full max-w-xs sm:max-w-sm md:w-64 bg-gradient-to-br from-green-100 via-yellow-100 to-white p-6 z-10 shadow-2xl flex flex-col border-r-2 border-green-200">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
            Admin
          </h1>
          <button
            className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold border-2 border-pink-300 hover:from-pink-500 hover:to-pink-600 shadow-lg transition-all duration-300"
            onClick={() => setLang(lang === "en" ? "fr" : "en")}
            aria-label="Toggle language"
          >
            {lang === "en" ? "FR" : "EN"}
          </button>
        </div>
        
        <nav className="flex flex-col gap-3">
          <NavLink 
            to="/admin/dashboard" 
            className={({ isActive }) =>
              `text-lg font-semibold px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg transform scale-105' 
                  : 'text-blue-700 hover:bg-gradient-to-r hover:from-pink-200 hover:to-pink-300 hover:text-pink-700 hover:shadow-md'
              }`
            }
          >
            {t("dashboard")}
          </NavLink>
          
          <NavLink 
            to="/admin/products" 
            className={({ isActive }) =>
              `text-lg font-semibold px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg transform scale-105' 
                  : 'text-blue-700 hover:bg-gradient-to-r hover:from-pink-200 hover:to-pink-300 hover:text-pink-700 hover:shadow-md'
              }`
            }
          >
            {t("products")}
          </NavLink>
          
          <NavLink 
            to="/admin/orders" 
            className={({ isActive }) =>
              `text-lg font-semibold px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg transform scale-105' 
                  : 'text-blue-700 hover:bg-gradient-to-r hover:from-pink-200 hover:to-pink-300 hover:text-pink-700 hover:shadow-md'
              }`
            }
          >
            {t("orders")}
          </NavLink>
          
          <NavLink 
            to="/admin/users" 
            className={({ isActive }) =>
              `text-lg font-semibold px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg transform scale-105' 
                  : 'text-blue-700 hover:bg-gradient-to-r hover:from-pink-200 hover:to-pink-300 hover:text-pink-700 hover:shadow-md'
              }`
            }
          >
            {t("users")}
          </NavLink>
          
          <NavLink 
            to="/admin/categories" 
            className={({ isActive }) =>
              `text-lg font-semibold px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg transform scale-105' 
                  : 'text-blue-700 hover:bg-gradient-to-r hover:from-pink-200 hover:to-pink-300 hover:text-pink-700 hover:shadow-md'
              }`
            }
          >
            {t("categories")}
          </NavLink>
          
          <NavLink 
            to="/admin/pages" 
            className={({ isActive }) =>
              `text-lg font-semibold px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg transform scale-105' 
                  : 'text-blue-700 hover:bg-gradient-to-r hover:from-pink-200 hover:to-pink-300 hover:text-pink-700 hover:shadow-md'
              }`
            }
          >
            🖼️ Pages
          </NavLink>
          
          <NavLink 
            to="/admin/support" 
            className={({ isActive }) =>
              `text-lg font-semibold px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg transform scale-105' 
                  : 'text-blue-700 hover:bg-gradient-to-r hover:from-pink-200 hover:to-pink-300 hover:text-pink-700 hover:shadow-md'
              }`
            }
          >
            {t("support") || "Support"}
          </NavLink>
          
          <NavLink 
            to="/admin/shipping" 
            className={({ isActive }) =>
              `text-lg font-semibold px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg transform scale-105' 
                  : 'text-blue-700 hover:bg-gradient-to-r hover:from-pink-200 hover:to-pink-300 hover:text-pink-700 hover:shadow-md'
              }`
            }
          >
            🚚 Shipping
          </NavLink>
          
          <NavLink 
            to="/admin/newsletter" 
            className={({ isActive }) =>
              `text-lg font-semibold px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg transform scale-105' 
                  : 'text-blue-700 hover:bg-gradient-to-r hover:from-pink-200 hover:to-pink-300 hover:text-pink-700 hover:shadow-md'
              }`
            }
          >
            {t("newsletter") || "Newsletter"}
          </NavLink>
          
          <NavLink 
            to="/admin/data-management" 
            className={({ isActive }) =>
              `text-lg font-semibold px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg transform scale-105' 
                  : 'text-blue-700 hover:bg-gradient-to-r hover:from-pink-200 hover:to-pink-300 hover:text-pink-700 hover:shadow-md'
              }`
            }
          >
            📊 Data Management
          </NavLink>
          
          <NavLink 
            to="/admin/activity-log" 
            className={({ isActive }) =>
              `text-lg font-semibold px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg transform scale-105' 
                  : 'text-blue-700 hover:bg-gradient-to-r hover:from-pink-200 hover:to-pink-300 hover:text-pink-700 hover:shadow-md'
              }`
            }
          >
            {t("activityLog")}
          </NavLink>
          
          <NavLink 
            to="/admin/customer-insights" 
            className={({ isActive }) =>
              `text-lg font-semibold px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg transform scale-105' 
                  : 'text-blue-700 hover:bg-gradient-to-r hover:from-pink-200 hover:to-pink-300 hover:text-pink-700 hover:shadow-md'
              }`
            }
          >
            👥 Customer Insights
          </NavLink>
          
          <NavLink 
            to="/admin/troubleshoot" 
            className={({ isActive }) =>
              `text-lg font-semibold px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-400 to-pink-500 text-white shadow-lg transform scale-105' 
                  : 'text-blue-700 hover:bg-gradient-to-r hover:from-pink-200 hover:to-pink-300 hover:text-pink-700 hover:shadow-md'
              }`
            }
          >
            🛠️ Troubleshooting
          </NavLink>
        </nav>
        
        <button
          onClick={logout}
          className="block w-full text-left px-4 py-3 rounded-2xl bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold mt-8 shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          {t('logout')}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-10 z-10">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
