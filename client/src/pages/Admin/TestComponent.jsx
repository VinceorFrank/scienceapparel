import React from 'react';

const TestComponent = () => {
  console.log('🧪 TestComponent is rendering!');
  
  return (
    <div className="p-8">
      <div className="bg-red-600 text-white p-8 rounded-lg border-4 border-yellow-400 shadow-xl">
        <h1 className="text-4xl font-bold text-center mb-4">🧪 TEST COMPONENT 🧪</h1>
        <p className="text-2xl text-center">This is a brand new test component!</p>
        <p className="text-lg text-center mt-2">If you can see this, routing is working!</p>
      </div>
    </div>
  );
};

export default TestComponent; 