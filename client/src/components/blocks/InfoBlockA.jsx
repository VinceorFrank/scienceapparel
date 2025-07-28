import React from 'react';
import { useLang } from '../../utils/lang';

const InfoBlockA = ({ 
  enabled = true, 
  title, 
  content, 
  backgroundImage, 
  overlay = 0.2,
  className = "bg-blue-100",
  titleClassName = "text-3xl font-bold text-pink-500",
  contentClassName = "text-slate-600 mt-4"
}) => {
  const { t } = useLang();

  if (!enabled) return null;

  const style = backgroundImage ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};

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
        <h2 
          className={titleClassName} 
          style={{ fontFamily: 'Fredoka One, cursive' }}
        >
          {title || t('whyChooseUs')}
        </h2>
        <p className={contentClassName}>
          {content || t('aboutTextBlock')}
        </p>
      </div>
    </section>
  );
};

export default InfoBlockA; 