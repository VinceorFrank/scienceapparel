import React, { createContext, useContext, useState } from "react";
import en from '../locales/en.json';
import fr from '../locales/fr.json';

const translations = { en, fr };

const LangContext = createContext();

export const useLang = () => useContext(LangContext);

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState('en');
  const t = (key) => translations[lang][key] || key;
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}; 