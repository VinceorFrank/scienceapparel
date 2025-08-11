export const upsertPageAsset = async (formData) => {
  console.log('[DEBUG] upsertPageAsset formData keys:', Array.from(formData.entries()).map(([key, value]) => [key, typeof value]));
  const res = await fetch('/api/pages', {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    body: formData
  });
  console.log('[DEBUG] upsert status:', res.status);
  if (!res.ok) throw new Error('Upload failed');
  const json = await res.json();
  console.log('[DEBUG] upsert json:', json);
  return json;
};

export const deletePageAsset = async ({ pageSlug, slot }) => {
  const res = await fetch(`/api/pages/${pageSlug}/${slot}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}; 