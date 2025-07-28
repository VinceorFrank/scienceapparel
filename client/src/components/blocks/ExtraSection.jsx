import React from 'react';

const ExtraSection = ({ type = 'text', imageUrl, textContent, overlay = 0.2 }) => {
  const style = {
    backgroundImage: imageUrl
      ? `url(${imageUrl})`
      : 'linear-gradient(135deg, #FB9EBB, #F3F3AB, #A4D4DC, #F4CEB8)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  return (
    <section className="w-full py-12 px-4 sm:px-8 relative rounded-3xl overflow-hidden mb-8 shadow-xl" style={style}>
      {imageUrl && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(255,255,255,${overlay})` }}
        />
      )}
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {type === 'text' ? (
          <p className="text-lg sm:text-xl text-slate-700 font-semibold leading-relaxed">
            {textContent || 'Add custom text in the admin panel for this extra section.'}
          </p>
        ) : (
          <img
            src={imageUrl || '/placeholder.png'}
            alt="Extra Section"
            className="w-full max-w-md mx-auto rounded-xl border-4 border-white shadow-lg"
          />
        )}
      </div>
    </section>
  );
};

export default ExtraSection; 