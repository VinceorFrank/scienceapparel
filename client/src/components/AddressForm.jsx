import React, { useState } from "react";

const defaultState = {
  firstName: "",
  lastName: "",
  address: "",
  city: "",
  postalCode: "",
  country: "",
  type: "shipping",
  isDefault: false,
};

const AddressForm = ({ initialData, onSave, onCancel }) => {
  const [form, setForm] = useState(initialData || defaultState);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.firstName) errs.firstName = "Prénom requis";
    if (!form.lastName) errs.lastName = "Nom requis";
    if (!form.address) errs.address = "Adresse requise";
    if (!form.city) errs.city = "Ville requise";
    if (!form.postalCode) errs.postalCode = "Code postal requis";
    if (!form.country) errs.country = "Pays requis";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Prénom *</label>
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.firstName && <div className="text-red-500 text-xs mt-1">{errors.firstName}</div>}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Nom *</label>
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.lastName && <div className="text-red-500 text-xs mt-1">{errors.lastName}</div>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Adresse *</label>
        <input
          type="text"
          name="address"
          value={form.address}
          onChange={handleChange}
          className={`w-full border rounded px-3 py-2 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.address && <div className="text-red-500 text-xs mt-1">{errors.address}</div>}
      </div>
      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Ville *</label>
          <input
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.city && <div className="text-red-500 text-xs mt-1">{errors.city}</div>}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Code postal *</label>
          <input
            type="text"
            name="postalCode"
            value={form.postalCode}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 ${errors.postalCode ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.postalCode && <div className="text-red-500 text-xs mt-1">{errors.postalCode}</div>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Pays *</label>
        <input
          type="text"
          name="country"
          value={form.country}
          onChange={handleChange}
          className={`w-full border rounded px-3 py-2 ${errors.country ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.country && <div className="text-red-500 text-xs mt-1">{errors.country}</div>}
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="isDefault"
          checked={form.isDefault}
          onChange={handleChange}
          id="isDefault"
        />
        <label htmlFor="isDefault" className="text-sm">Définir comme adresse par défaut</label>
      </div>
      <div className="flex space-x-4 mt-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "Enregistrement..." : initialData ? "Mettre à jour" : "Ajouter"}
        </button>
        <button
          type="button"
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          onClick={onCancel}
          disabled={saving}
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

export default AddressForm; 