import React from 'react';

// Modal.jsx - Reusable modal dialog component
// Props:
//   open: boolean, whether the modal is open
//   onClose: function to close the modal
//   title: string, modal title (optional)
//   children: modal content
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white p-6 rounded shadow-lg w-full max-w-md"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {title && <h2 className="text-xl font-bold mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
};

export default Modal; 