import React from "react";
import { usePageAssets } from "../hooks/usePageAssets";
import Header from "./Header";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

const PageLayout = ({ slug, children }) => {
  const { data: assets = [] } = usePageAssets(slug);

  const bgAsset = assets.find(a => a.slot === "background");
  const backgroundImage = bgAsset?.imageUrl;
  const overlay = bgAsset?.overlay ?? 0.2;

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden">
      {/* Background */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          width: '100vw',
          height: '100vh',
          backgroundImage: backgroundImage
            ? `url(${backgroundImage})`
            : 'linear-gradient(135deg, #FB9EBB, #F3F3AB, #A4D4DC, #F4CEB8)',
          backgroundAttachment: 'fixed',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
        }}
      />
      {/* Content */}
      <div
        className="flex flex-col min-h-screen"
        style={{ backgroundColor: `rgba(255,255,255,${overlay})` }}
      >
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

export default PageLayout; 