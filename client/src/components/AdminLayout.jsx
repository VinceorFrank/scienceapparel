import { NavLink, Outlet } from "react-router-dom";

const AdminLayout = () => {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <nav className="space-y-2">
          <NavItem to="/admin/dashboard" label="Dashboard" />
          <NavItem to="/admin/products" label="Products" />
          <NavItem to="/admin/orders" label="Orders" />
          <NavItem to="/admin/users" label="Users" />
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 bg-gray-100">
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
