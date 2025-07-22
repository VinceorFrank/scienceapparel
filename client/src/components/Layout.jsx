import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { usePageAssets } from '../hooks/usePageAssets';

const Layout = ({ children }) => {
  // Fetch both layout and global assets
  const { data: layoutAssets = [] } = usePageAssets('layout');
  const { data: globalAssets = [] } = usePageAssets('global');
  // Merge assets, global takes priority
  const allAssets = [...(Array.isArray(globalAssets) ? globalAssets : []), ...(Array.isArray(layoutAssets) ? layoutAssets : [])];
  // Find global background first, then per-page background
  const globalBg = allAssets.find(a => a.slot === 'sitewide-background' && a.pageSlug === 'global');
  const bg = globalBg || allAssets.find(a => a.slot === 'background');

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundImage: bg?.imageUrl 
          ? `url(${bg.imageUrl})` 
          : 'linear-gradient(135deg, #FB9EBB, #F3F3AB, #A4D4DC, #F4CEB8)',
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        width: '100vw',
        minHeight: '100vh',
      }}
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
