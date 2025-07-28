import React from 'react';
import { useLang } from '../../utils/lang';

const InfoBlockB = ({ 
  enabled = true, 
  title, 
  content, 
  backgroundImage, 
  overlay = 0.2,
  className = "bg-white border border-pink-100",
  titleClassName = "text-2xl font-bold text-blue-400 mb-4",
  contentClassName = "text-slate-600"
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
      className={`rounded-3xl p-12 text-center shadow-xl relative overflow-hidden ${className}`}
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
          {title || t('teamCulture')}
        </h2>
        <p className={contentClassName}>
          {content || t('aboutTeamDescription')}
        </p>
      </div>
    </section>
  );
};

export default InfoBlockB; 