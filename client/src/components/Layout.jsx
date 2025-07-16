import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { usePageAssets } from '../hooks/usePageAssets';

const Layout = ({ children }) => {
  const { data: bgAssets } = usePageAssets('layout');
  const bg = bgAssets?.find(a => a.slot === 'background');

  return (
    <div
      className="min-h-screen"
      style={bg ? { backgroundImage: `url(${bg.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      <div className="flex flex-col min-h-screen" style={{ backgroundColor: bg ? `rgba(255,255,255,${bg.overlay ?? 0.2})` : undefined }}>
        <Header />
        <main className="flex-1 container mx-auto p-4">
          {children}
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
