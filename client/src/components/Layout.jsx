import React from "react";
import { Outlet } from "react-router-dom";
import Footer from "./Footer";

const Layout = () => (
  <div className="flex flex-col min-h-screen">
    {/* <Navbar /> Removed to prevent duplicate header on Home and public pages */}
    <main className="flex-1 container mx-auto p-4">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default Layout;
