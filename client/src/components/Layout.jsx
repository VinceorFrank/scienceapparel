import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
// Temporarily disabled to fix infinite loop
// import { usePageAssets } from '../hooks/usePageAssets';
// import { useBlockToggle } from '../hooks/useBlockToggle';
// import { BACKGROUND_PRIORITY, getBackgroundPriority } from '../config/blockConfig';

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Determine current page slug
  const pageSlug = location.pathname === '/' ? 'home' : location.pathname.replace(/^\//, '');
  
  // Temporarily disabled to fix infinite loop
  // const { data: pageAssets = [] } = usePageAssets(pageSlug);
  // const { data: globalAssets = [] } = usePageAssets('global');
  // const { useGlobalBackground } = useBlockToggle(pageSlug);
  // const { background, source } = getBackgroundPriority(pageAssets, globalAssets, useGlobalBackground);
  
  // Simple fallback background
  const background = null;
  
  // Disable debug logging temporarily
  // console.log('[DEBUG] Layout background system:', { pageSlug });

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden">
      {/* Fixed background layer - simplified */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#f8fafc', // Simple light background
        }}
      />
      <div className="flex flex-col min-h-screen">
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
