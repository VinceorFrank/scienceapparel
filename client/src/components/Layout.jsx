import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { usePageAssets } from '../hooks/usePageAssets';
import { useBlockToggle } from '../hooks/useBlockToggle';
import { BACKGROUND_PRIORITY, getBackgroundPriority } from '../config/blockConfig';

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Determine current page slug
  const pageSlug = location.pathname === '/' ? 'home' : location.pathname.replace(/^\//, '');
  
  // Fetch page-specific and global assets
  const { data: pageAssets = [] } = usePageAssets(pageSlug);
  const { data: globalAssets = [] } = usePageAssets('global');
  
  // Get global background toggle state
  const { useGlobalBackground } = useBlockToggle(pageSlug);
  
  // Use the background priority system
  const { background, source } = getBackgroundPriority(pageAssets, globalAssets, useGlobalBackground);
  
  // Enhanced debug logging
  console.log('[DEBUG] Layout background system:', {
    pageSlug,
    pageAssets: pageAssets.length,
    globalAssets: globalAssets.length,
    useGlobalBackground,
    pageBg: pageAssets.find(a => a.slot === 'background'),
    globalBg: globalAssets.find(a => a.slot === 'sitewide-background'),
    selectedBackground: background,
    source,
    allPageAssets: pageAssets,
    allGlobalAssets: globalAssets
  });

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden">
      {/* Fixed background layer */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          width: '100vw',
          height: '100vh',
          backgroundImage: background?.imageUrl
            ? `url(${background.imageUrl})`
            : BACKGROUND_PRIORITY.fallback,
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
        }}
      />
      <div className="flex flex-col min-h-screen" style={{ backgroundColor: background ? `rgba(255,255,255,${background.overlay ?? 0.2})` : undefined }}>
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
