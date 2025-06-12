import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import OrderTracking from "./pages/OrderTracking";
import Account from "./pages/Account";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Shipping from "./pages/Shipping";
import Reviews from "./pages/Reviews";
import Newsletter from "./pages/Newsletter";
import Responsibility from "./pages/Responsibility";
import Calendly from "./pages/Calendly";
import Complaint from "./pages/Complaint";
import Navbar from "./components/Navbar";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import TailwindTest from "./pages/TailwindTest";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminLayout from "./components/AdminLayout";
import ProductsAdmin from "./pages/Admin/ProductsAdmin";
import OrdersAdmin from "./pages/Admin/OrdersAdmin";
import UsersAdmin from "./pages/Admin/UsersAdmin";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public site layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order-tracking" element={<OrderTracking />} />
          <Route path="/account" element={<Account />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/newsletter" element={<Newsletter />} />
          <Route path="/responsibility" element={<Responsibility />} />
          <Route path="/calendly" element={<Calendly />} />
          <Route path="/complaint" element={<Complaint />} />
          <Route path="/tailwind-test" element={<TailwindTest />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin login route (standalone, no sidebar) */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin dashboard layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<ProductsAdmin />} />
          <Route path="orders" element={<OrdersAdmin />} />
          <Route path="users" element={<UsersAdmin />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
