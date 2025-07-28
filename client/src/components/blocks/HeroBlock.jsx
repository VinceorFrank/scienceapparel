import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../utils/lang';

const HeroBlock = ({ 
  enabled = true, 
  title, 
  subtitle, 
  backgroundImage, 
  overlay = 0.2,
  className = "bg-pink-100",
  titleClassName = "text-4xl font-bold text-blue-500",
  subtitleClassName = "text-slate-600 mt-4",
  buttonPosition = 'bottom',
  buttonDestination = 'products',
  onButtonClick = null
}) => {
  const { t } = useLang();

  if (!enabled) return null;

  const style = backgroundImage ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};

  // Helper function to get button destination URL
  const getButtonDestination = () => {
    switch (buttonDestination) {
      case 'clothing-accessories':
        return '/clothing-accessories';
      case 'accessories':
        return '/accessories';
      default:
        return '/products';
    }
  };

  const renderButton = () => (
    <Link to={getButtonDestination()}>
      <button 
        className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-pink-400 to-pink-500 text-white font-bold rounded-full shadow-lg hover:from-pink-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-base sm:text-lg"
        onClick={onButtonClick}
      >
        {t('shopNow')}
      </button>
    </Link>
  );

  return (
    <section 
      className={`rounded-3xl p-12 mb-10 text-center shadow-xl relative overflow-hidden ${className}`}
      style={style}
    >
      {backgroundImage && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(255,255,255,${overlay})` }}
        />
      )}
      <div className="relative z-10">
        {/* Button at Top */}
        {buttonPosition === 'top' && (
          <div className="mb-8">
            {renderButton()}
          </div>
        )}

        <h1 
          className={titleClassName} 
          style={{ fontFamily: 'Fredoka One, cursive' }}
        >
          {title || t('aboutUs')}
        </h1>

        {/* Button at Middle */}
        {buttonPosition === 'middle' && (
          <div className="mb-8">
            {renderButton()}
          </div>
        )}

        <p className={subtitleClassName}>
          {subtitle || t('ourMissionStatement')}
        </p>

        {/* Button at Bottom (default) */}
        {buttonPosition === 'bottom' && (
          <div className="mt-8">
            {renderButton()}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroBlock; 