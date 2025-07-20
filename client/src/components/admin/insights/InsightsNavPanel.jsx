import React, { useEffect, useState } from 'react';

const sections = [
  { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
  { id: 'sales', label: '📈 Sales Analytics', icon: '📈' },
  { id: 'customers', label: '👥 Customer Analytics', icon: '👥' },
  { id: 'products', label: '📦 Product Analytics', icon: '📦' },
  { id: 'engagement', label: '📬 Engagement Analytics', icon: '📬' },
];

const InsightsNavPanel = ({ className = '' }) => {
  const [active, setActive] = useState('dashboard');

  useEffect(() => {
    const handleScroll = () => {
      let found = 'dashboard';
      for (let sec of sections) {
        const el = document.getElementById(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Consider section active when it's near the top of the viewport
          if (rect.top <= 150 && rect.bottom >= 150) {
            found = sec.id;
          }
        }
      }
      setActive(found);
    };

    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <nav className={`sticky top-20 w-48 hidden lg:block space-y-1 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Quick Navigation
        </h3>
        <div className="h-px bg-gray-200"></div>
      </div>
      
      {sections.map(sec => (
        <button
          key={sec.id}
          onClick={() => scrollToSection(sec.id)}
          className={`w-full text-left text-sm px-3 py-2 rounded-md transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 ${
            active === sec.id 
              ? 'bg-blue-100 text-blue-700 font-medium shadow-sm' 
              : 'text-gray-600 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{sec.icon}</span>
            <span className="truncate">{sec.label}</span>
          </div>
        </button>
      ))}
      
      {/* Mobile dropdown version */}
      <div className="lg:hidden">
        <select
          value={active}
          onChange={(e) => scrollToSection(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {sections.map(sec => (
            <option key={sec.id} value={sec.id}>
              {sec.label}
            </option>
          ))}
        </select>
      </div>
    </nav>
  );
};

export default InsightsNavPanel; 