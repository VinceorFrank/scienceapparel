import React, { useState } from "react";

const defaultState = {
  firstName: "",
  lastName: "",
  address: "",
  city: "",
  province: "",      // ➕ NEW – matches validator
  postalCode: "",
  country: "",
  type: "shipping",
  isDefault: false,
};

const AddressForm = ({ initialData, onSave, onCancel }) => {
  const [form, setForm] = useState(initialData || defaultState);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  /* ---------- helpers ---------- */
  const validate = () => {
    const errs = {};
    if (!form.firstName.trim())  errs.firstName  = "Prénom requis";
    if (!form.lastName.trim())   errs.lastName   = "Nom requis";
    if (!form.address.trim())    errs.address    = "Adresse requise";
    if (!form.city.trim())       errs.city       = "Ville requise";
    if (!form.province.trim())   errs.province   = "Province / État requis";   // 🆕
    if (!form.postalCode.trim()) errs.postalCode = "Code postal requis";
    if (!form.country.trim())    errs.country    = "Pays requis";
    return errs;
  };

  const handleChange = ({ target }) => {
    const { name, value, type, checked } = target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await onSave(form);        // parent keeps full address incl. province
    } finally {
      setSaving(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* First & Last name */}
      <div className="flex space-x-4">
        {["firstName", "lastName"].map((field) => (
          <div className="flex-1" key={field}>
            <label className="block text-sm font-medium mb-1">
              {field === "firstName" ? "Prénom" : "Nom"} *
            </label>
            <input
              type="text"
              name={field}
              autoComplete={field === "firstName" ? "given-name" : "family-name"}
              value={form[field]}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 ${
                errors[field] ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors[field] && (
              <div className="text-red-500 text-xs mt-1">{errors[field]}</div>
            )}
          </div>
        ))}
      </div>

      {/* Address line */}
      <div>
        <label className="block text-sm font-medium mb-1">Adresse *</label>
        <input
          type="text"
          name="address"
          autoComplete="street-address"
          value={form.address}
          onChange={handleChange}
          className={`w-full border rounded px-3 py-2 ${
            errors.address ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.address && (
          <div className="text-red-500 text-xs mt-1">{errors.address}</div>
        )}
      </div>

      {/* City - Province - Postal */}
      <div className="flex space-x-4">
        {[
          { name: "city", label: "Ville", autoComplete: "address-level2" },
          { name: "province", label: "Province / État", autoComplete: "address-level1" },
          { name: "postalCode", label: "Code postal", autoComplete: "postal-code" },
        ].map(({ name, label, autoComplete }) => (
          <div className="flex-1" key={name}>
            <label className="block text-sm font-medium mb-1">{label} *</label>
            <input
              type="text"
              name={name}
              autoComplete={autoComplete}
              value={form[name]}
              onChange={handleChange}
              className={`w-full border rounded px-3 py-2 ${
                errors[name] ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors[name] && (
              <div className="text-red-500 text-xs mt-1">{errors[name]}</div>
            )}
          </div>
        ))}
      </div>

      {/* Country */}
      <div>
        <label className="block text-sm font-medium mb-1">Pays *</label>
        <input
          type="text"
          name="country"
          autoComplete="country-name"
          value={form.country}
          onChange={handleChange}
          className={`w-full border rounded px-3 py-2 ${
            errors.country ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.country && (
          <div className="text-red-500 text-xs mt-1">{errors.country}</div>
        )}
      </div>

      {/* Default address toggle */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="isDefault"
          id="isDefault"
          checked={form.isDefault}
          onChange={handleChange}
        />
        <label htmlFor="isDefault" className="text-sm">
          Définir comme adresse par défaut
        </label>
      </div>

      {/* Buttons */}
      <div className="flex space-x-4 mt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : initialData ? "Mettre à jour" : "Ajouter"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

export default AddressForm; 