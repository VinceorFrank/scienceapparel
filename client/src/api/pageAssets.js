export const upsertPageAsset = async (formData) => {
  const res = await fetch('/api/pages', {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    body: formData
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
};

export const deletePageAsset = async (id) => {
  const res = await fetch(`/api/pages/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}; 