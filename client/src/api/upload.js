import api from './config';

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await api.post('/upload?type=image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Image upload failed');
  }
}; 