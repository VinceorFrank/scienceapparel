import api from './config';

export const uploadImage = async (formData) => {
  try {
    console.log('[uploadImage] Starting upload...');
    console.log('[uploadImage] formData type:', typeof formData);
    console.log('[uploadImage] formData instanceof FormData:', formData instanceof FormData);
    
    // Log FormData contents
    console.log('[uploadImage] FormData contents:');
    for (let pair of formData.entries()) {
      console.log('[uploadImage] FormData entry:', pair[0], pair[1]);
    }
    
    console.log('[uploadImage] Making POST request to /upload...');
    const response = await api.post('/upload', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data' 
      }
    });
    
    console.log('[uploadImage] Response received:', response);
    console.log('[uploadImage] Response status:', response.status);
    console.log('[uploadImage] Response data:', response.data);
    
    if (!response.data) {
      throw new Error('No response data received');
    }
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Upload failed');
    }
    
    console.log('[uploadImage] Upload successful, returning:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('[uploadImage] ERROR:', error);
    console.error('[uploadImage] Error response:', error.response);
    console.error('[uploadImage] Error message:', error.message);
    
    if (error.response) {
      console.error('[uploadImage] Error response data:', error.response.data);
      console.error('[uploadImage] Error response status:', error.response.status);
    }
    
    throw new Error(error.response?.data?.message || error.message || 'Image upload failed');
  }
}; 