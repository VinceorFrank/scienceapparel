import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import OrderTracking from "./pages/OrderTracking";
import OrderDetail from "./pages/OrderDetail";
import Payment from "./pages/Payment";
import Account from "./pages/Account";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Shipping from "./pages/Shipping";
import Reviews from "./pages/Reviews";
import Newsletter from "./pages/Newsletter";
import Responsibility from "./pages/Responsibility";
import Contact from "./pages/Contact";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import TailwindTest from "./pages/TailwindTest";
import OrderTest from "./pages/OrderTest";
import ClothingAccessories from "./pages/ClothingAccessories";
import Accessories from "./pages/Accessories";
import RequireAdmin from "./components/RequireAdmin";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminLayout from "./components/AdminLayout";
import ProductsAdmin from "./pages/Admin/ProductsAdmin";
import OrdersAdmin from "./pages/Admin/OrdersAdmin";
import UsersAdmin from "./pages/Admin/UsersAdmin";
import LoginCustomer from "./pages/Customer/LoginCustomer";
import EditCustomer from "./pages/Customer/EditCustomer";
import RequireCustomer from "./components/RequireCustomer";
import CategoriesAdmin from "./pages/Admin/CategoriesAdmin";
import ActivityLogAdmin from "./pages/Admin/ActivityLogAdmin";
import SupportAdmin from "./pages/Admin/SupportAdmin";
import NewsletterAdmin from "./pages/Admin/NewsletterAdmin";
import DataManagement from "./pages/Admin/DataManagement";
import CustomerInsights from "./pages/Admin/CustomerInsights";
import MarkdownPage from "./pages/Admin/MarkdownPage";
import ShippingAdmin from "./pages/Admin/ShippingAdmin";
import SignupCustomer from "./pages/Customer/SignupCustomer";
import Orders from "./pages/Orders";
import { CartProvider } from './components/CartContext';
import PagesAdmin from "./pages/Admin/PagesAdmin";
import TestComponent from "./pages/Admin/TestComponent";
import ProductPlacementPreview from "./pages/Admin/ProductPlacementPreview";


const App = () => {
  return (
    <CartProvider>
      <Router>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <Routes>
          {/* Public site layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/order-tracking" element={<OrderTracking />} />

            <Route element={<RequireCustomer />}>
              <Route path="/account" element={<Account />} />
              <Route path="/account/edit" element={<EditCustomer />} />
              <Route path="/order/:id" element={<OrderDetail />} />
              <Route path="/payment/:orderId" element={<Payment />} />
              <Route path="/orders" element={<Orders />} />
            </Route>

            <Route path="/login" element={<LoginCustomer />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="/responsibility" element={<Responsibility />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/clothing-accessories" element={<ClothingAccessories />} />
            <Route path="/accessories" element={<Accessories />} />
            <Route path="/tailwind-test" element={<TailwindTest />} />
            <Route path="/order-test" element={<OrderTest />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/signup" element={<SignupCustomer />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin login route (standalone, no sidebar) */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin dashboard layout */}
         <Route path="/admin" element={<RequireAdmin />}>
    <Route element={<AdminLayout />}>
      <Route index element={<AdminDashboard />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="products" element={<ProductsAdmin />} />
      <Route path="orders" element={<OrdersAdmin />} />
      <Route path="users" element={<UsersAdmin />} />
      <Route path="categories" element={<CategoriesAdmin />} />
      <Route path="support" element={<SupportAdmin />} />
      <Route path="newsletter" element={<NewsletterAdmin />} />
      <Route path="activity-log" element={<ActivityLogAdmin />} />
      <Route path="data-management" element={<DataManagement />} />
      <Route path="customer-insights" element={<CustomerInsights />} />
      <Route path="troubleshoot" element={<MarkdownPage fileName='troubleshoot-admin-panel.md' title='Admin Panel Troubleshooting' />} />
      <Route path="shipping" element={<ShippingAdmin />} />
      <Route path="pages" element={<PagesAdmin />} />
      <Route path="test" element={<TestComponent />} />
      <Route path="/admin/preview-product-placement" element={<ProductPlacementPreview />} />
    </Route>
  </Route>
        </Routes>
      </Router>
    </CartProvider>
  );
};

export default App;
