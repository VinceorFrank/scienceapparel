# 🧪 Image Upload Flow Testing Guide

## 📋 Pre-Testing Checklist

### 1. Environment Setup
- [ ] Backend server running on `http://localhost:5000`
- [ ] Frontend running on `http://localhost:5173`
- [ ] MongoDB connected and accessible
- [ ] Admin user logged in
- [ ] Browser console open (F12)

### 2. File Structure Verification
- [ ] `server/uploads/images/` directory exists
- [ ] `server/app.js` has static file serving configured
- [ ] CORS properly configured for both API and static files

## 🔍 Step-by-Step Testing Process

### Step 1: Open Admin Panel
1. Navigate to `http://localhost:5173/admin`
2. Login with admin credentials
3. Go to Products section
4. Open browser console (F12)

### Step 2: Test Image Upload Flow

#### A. Create New Product with Image
1. Click "Add Product" button
2. Fill in product details (name, description, price, stock, category)
3. **Drag and drop an image** or click to select one
4. **Watch console logs** for:
   ```
   [ProductImageUpload] onDrop called
   [ProductImageUpload] File selected: {name, type, size, isFile}
   [ProductImageUpload] Created preview URL: blob:...
   [ProductImageUpload] Calling onImageChange with File object
   ```

#### B. Save Product
1. Click "Create Product" button
2. **Watch console logs** for:
   ```
   [useProductManagement] handleSave called with productData
   [useProductManagement] imageFile type: object
   [useProductManagement] imageFile instanceof File: true
   [useProductManagement] Starting image upload...
   [useProductManagement] FormData contents:
   [useProductManagement] FormData entry: image [File object]
   [useProductManagement] Calling uploadImage...
   ```

#### C. Upload Process
3. **Watch console logs** for:
   ```
   [uploadImage] Starting upload...
   [uploadImage] formData instanceof FormData: true
   [uploadImage] FormData contents:
   [uploadImage] FormData entry: image [File object]
   [uploadImage] Making POST request to /upload...
   ```

#### D. Backend Upload
4. **Watch server console** for:
   ```
   [upload] POST /api/upload called
   [upload] Request headers: {...}
   [upload] Multer processing completed
   [upload] req.file: {originalname, filename, path, size, mimetype}
   [upload] Generated filePath: /uploads/images/1234567890-test.jpg
   [upload] Sending response: {success: true, filePath: "/uploads/images/..."}
   ```

#### E. Frontend Response
5. **Watch console logs** for:
   ```
   [uploadImage] Response received: {status: 200, data: {...}}
   [uploadImage] Response data: {success: true, filePath: "/uploads/images/..."}
   [uploadImage] Upload successful, returning: {...}
   ```

#### F. Product Creation
6. **Watch console logs** for:
   ```
   [useProductManagement] uploadImage response: {success: true, filePath: "/uploads/images/..."}
   [useProductManagement] Updated imageUrl from upload: /uploads/images/...
   [useProductManagement] Final cleanedData to send: {name, description, price, stock, category, image}
   [useProductManagement] Creating new product
   [useProductManagement] Calling addProduct...
   ```

#### G. Backend Product Creation
7. **Watch server console** for:
   ```
   [products] POST /api/products called
   [products] Request body: {name, description, price, stock, category, image}
   [products] Product created successfully: {id, name, image, category}
   ```

### Step 3: Verify Product Display

#### A. Product List Refresh
1. **Watch console logs** for:
   ```
   [useProductManagement] addProduct response: {...}
   [useProductManagement] Refreshing products list...
   ```

#### B. Image URL Construction
2. **Watch console logs** for:
   ```
   [ProductTable] getImageUrl called with: /uploads/images/1234567890-test.jpg
   [ProductTable] imagePath type: string
   [ProductTable] Relative uploads path, constructed URL: http://localhost:5000/uploads/images/1234567890-test.jpg
   ```

#### C. Image Loading
3. **Watch console logs** for:
   ```
   [ProductTable] Image loaded successfully for product: Test Product URL: http://localhost:5000/uploads/images/1234567890-test.jpg
   ```

### Step 4: Test Edit Product with New Image

#### A. Edit Existing Product
1. Click "Edit" on the created product
2. **Watch console logs** for:
   ```
   [ProductForm] editingProduct.image: /uploads/images/1234567890-test.jpg
   ```

#### B. Upload New Image
1. Drag and drop a different image
2. **Watch console logs** for:
   ```
   [ProductImageUpload] onDrop called
   [ProductImageUpload] File selected: {name, type, size, isFile}
   [ProductImageUpload] Created preview URL: blob:...
   ```

#### C. Save Changes
1. Click "Save Changes"
2. **Watch console logs** for:
   ```
   [useProductManagement] handleSave called with productData
   [useProductManagement] imageFile type: object
   [useProductManagement] Starting image upload...
   [useProductManagement] Calling uploadImage...
   ```

#### D. Backend Update
3. **Watch server console** for:
   ```
   [products] PUT /api/products/[id] called
   [products] Request body: {name, description, price, stock, category, image}
   [products] Product updated successfully: {id, name, image, category}
   ```

## 🚨 Common Issues and Solutions

### Issue 1: "No file uploaded" Error
**Symptoms**: Backend returns 400 with "No file uploaded"
**Causes**:
- FormData not properly constructed
- Wrong field name in FormData
- Multer configuration issue

**Debug Steps**:
1. Check `[uploadImage] FormData contents` logs
2. Verify field name is "image"
3. Check `[upload] Request headers` for Content-Type

### Issue 2: "Upload failed" Error
**Symptoms**: Frontend receives error response
**Causes**:
- File size too large
- Invalid file type
- Server storage issues

**Debug Steps**:
1. Check file size in `[ProductImageUpload] File selected` logs
2. Verify file type is jpeg/png
3. Check server uploads directory permissions

### Issue 3: Image Not Displaying
**Symptoms**: Product saved but image doesn't show
**Causes**:
- Wrong image path in database
- Static file serving not configured
- CORS issues with images

**Debug Steps**:
1. Check `[ProductTable] getImageUrl` logs
2. Verify image path in database
3. Test direct image URL in browser
4. Check network tab for image requests

### Issue 4: "Missing/invalid image" Validation Error
**Symptoms**: Product save fails with validation error
**Causes**:
- imageUrl not properly set after upload
- Response field mismatch

**Debug Steps**:
1. Check `[useProductManagement] uploadImage response` logs
2. Verify response contains `filePath` field
3. Check `[useProductManagement] Final cleanedData` logs

## 📊 Expected Log Flow Summary

### Successful Flow:
```
Frontend: [ProductImageUpload] onDrop → File selected → Preview created
Frontend: [useProductManagement] handleSave → imageFile detected → uploadImage called
Frontend: [uploadImage] FormData created → POST /upload → Response received
Backend:  [upload] File received → Multer processed → filePath generated → Response sent
Frontend: [useProductManagement] uploadImage response → imageUrl updated → product saved
Backend:  [products] Product updated → Database saved → Response sent
Frontend: [ProductTable] getImageUrl → URL constructed → Image loaded
```

### Error Flow:
```
Frontend: [ProductImageUpload] onDrop → File selected → Preview created
Frontend: [useProductManagement] handleSave → imageFile detected → uploadImage called
Frontend: [uploadImage] ERROR → Error details logged → Error thrown
Frontend: [useProductManagement] handleSave ERROR → Error message displayed
```

## 🎯 Success Criteria

✅ **Image Upload**: File successfully uploaded to server
✅ **Database Storage**: Image path correctly stored in product document
✅ **Image Display**: Image loads correctly in product table
✅ **Edit Functionality**: Can edit product and upload new image
✅ **Error Handling**: Proper error messages for failed uploads

## 🔧 Quick Fixes

### If upload endpoint not found:
```javascript
// In client/src/api/upload.js - Remove ?type=image
const response = await api.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### If response field mismatch:
```javascript
// In client/src/hooks/useProductManagement.jsx
const response = await uploadImage(uploadData);
imageUrl = response.filePath; // Make sure this matches backend response
```

### If static files not serving:
```javascript
// In server/app.js - Ensure this is present
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));
```

Run through this testing guide step by step, and the comprehensive logging will help you identify exactly where the issue occurs in your image upload flow! 