import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const token = localStorage.getItem('token');

  try {
    const res = await axios.post(`${API_BASE}/upload?type=image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Image upload failed');
  }
}; 