import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { logout } from "../utils/logout";
import { useLang } from "../utils/lang";

const AdminLayout = () => {
  const { lang, setLang, t } = useLang();

  return (
    <div className="min-h-screen flex font-fun bg-pastel-mint relative">
      {/* Memphis shapes as SVG background */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{zIndex:0}}>
        <circle cx="80" cy="80" r="40" fill="#FFB6C1" opacity="0.3"/>
        <rect x="300" y="100" width="80" height="80" fill="#C3B1E1" opacity="0.3"/>
        <polygon points="600,50 650,100 550,100" fill="#FFFACD" opacity="0.3"/>
        {/* Add more shapes for fun */}
      </svg>
      {/* Sidebar */}
      <aside className="w-64 bg-pastel-pink p-6 z-10 shadow-lg flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-pastel-purple">Admin</h1>
          <button
            className="ml-2 px-2 py-1 rounded bg-pastel-yellow text-pastel-purple font-bold"
            onClick={() => setLang(lang === "en" ? "fr" : "en")}
            aria-label="Toggle language"
          >
            {lang === "en" ? "FR" : "EN"}
          </button>
        </div>
        <nav className="flex flex-col gap-4">
          <NavLink to="/admin/dashboard" className="text-lg font-bold text-pastel-blue hover:text-pastel-yellow">{t("dashboard")}</NavLink>
          <NavLink to="/admin/products" className="text-lg font-bold text-pastel-blue hover:text-pastel-yellow">{t("products")}</NavLink>
          <NavLink to="/admin/orders" className="text-lg font-bold text-pastel-blue hover:text-pastel-yellow">{t("orders")}</NavLink>
          <NavLink to="/admin/users" className="text-lg font-bold text-pastel-blue hover:text-pastel-yellow">{t("users")}</NavLink>
          <NavLink to="/admin/categories" className="text-lg font-bold text-pastel-blue hover:text-pastel-yellow">{t("categories")}</NavLink>
          <NavLink to="/admin/support" className="text-lg font-bold text-pastel-blue hover:text-pastel-yellow">{t("support") || "Support"}</NavLink>
          <NavLink to="/admin/activity-log" className="text-lg font-bold text-pastel-blue hover:text-pastel-yellow">{t("activityLog")}</NavLink>
        </nav>
        <button
          onClick={logout}
          className="block w-full text-left px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white mt-8"
        >
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-10 z-10">
        <Outlet />
      </main>
    </div>
  );
};

const NavItem = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `block px-3 py-2 rounded hover:bg-gray-700 transition ${
        isActive ? "bg-gray-700" : ""
      }`
    }
  >
    {label}
  </NavLink>
);

export default AdminLayout;
