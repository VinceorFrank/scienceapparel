# 🚚 Québec Shipping API Setup Guide

## 📋 **Overview**
This guide will help you set up shipping APIs for Québec-based customers using Canada Post and UPS. The system includes automatic box selection, admin-configurable markup, and real-time rate calculation.

## 🎯 **Phase 1: API Credentials Acquisition**

### **Step 1: Canada Post API Setup**

#### 1.1 Register for Canada Post Developer Account
1. **Visit:** https://www.canadapost-postescanada.ca/ac/support/api/
2. **Click:** "Get Started" → "Register for a developer account"
3. **Fill out the registration form:**
   - Business name: Your company name
   - Contact information
   - Email verification required

#### 1.2 Access Developer Portal
1. **Log into your Canada Post developer account**
2. **Navigate to:** "My Account" → "API Keys"
3. **Request access to:** "Shipping APIs" (Rate API, Tracking API)

#### 1.3 Get API Credentials
You'll receive:
- **API Key** (username)
- **API Secret** (password) 
- **Customer Number** (if you have a Canada Post business account)

#### 1.4 Test Canada Post API
```bash
# Test endpoint (replace with your credentials)
curl -X POST https://soa-gw.canadapost.ca/rs/ship/price \
  -u "YOUR_API_KEY:YOUR_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "originPostalCode": "H2X1Y1",
    "destinationPostalCode": "H3A1A1",
    "weight": 2.5,
    "length": 12,
    "width": 9,
    "height": 2,
    "serviceType": "Regular Parcel"
  }'
```

---

### **Step 2: UPS API Setup**

#### 2.1 Register for UPS Developer Account
1. **Visit:** https://www.ups.com/upsdeveloperkit
2. **Click:** "Get Started" → "Register"
3. **Complete registration process**

#### 2.2 Access UPS Developer Portal
1. **Log into your UPS developer account**
2. **Navigate to:** "My Apps" → "Create New App"
3. **Select:** "REST API" → "Shipping APIs"

#### 2.3 Get API Credentials
You'll receive:
- **Client ID**
- **Client Secret**
- **Account Number** (if you have a UPS business account)

#### 2.4 Test UPS API
```bash
# First get access token
curl -X POST https://wwwcie.ups.com/security/v1/oauth/token \
  -u "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials"

# Then test rate calculation (use token from above)
curl -X POST https://wwwcie.ups.com/api/shipments/v1/rates \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "RateRequest": {
      "Request": {
        "RequestOption": "Shop"
      },
      "Shipment": {
        "Shipper": {
          "Address": {
            "AddressLine": "123 Main St",
            "City": "Montreal",
            "StateProvinceCode": "QC",
            "PostalCode": "H2X1Y1",
            "CountryCode": "CA"
          }
        },
        "ShipTo": {
          "Address": {
            "AddressLine": "456 Test St",
            "City": "Montreal",
            "StateProvinceCode": "QC",
            "PostalCode": "H3A1A1",
            "CountryCode": "CA"
          }
        },
        "Service": {
          "Code": "03",
          "Description": "Ground"
        },
        "Package": {
          "PackagingType": {
            "Code": "02",
            "Description": "Package"
          },
          "Dimensions": {
            "UnitOfMeasurement": {
              "Code": "IN"
            },
            "Length": "12",
            "Width": "9",
            "Height": "2"
          },
          "PackageWeight": {
            "UnitOfMeasurement": {
              "Code": "LBS"
            },
            "Weight": "2.5"
          }
        }
      }
    }
  }'
```

---

## 🛠 **Phase 2: Backend Configuration**

### **Step 3: Environment Variables Setup**

1. **Copy the updated env.example to .env:**
```bash
cp server/env.example server/.env
```

2. **Add your API credentials to server/.env:**
```env
# Canada Post API
CANADA_POST_API_KEY=your-actual-canada-post-api-key
CANADA_POST_API_SECRET=your-actual-canada-post-api-secret
CANADA_POST_CUSTOMER_NUMBER=your-actual-customer-number

# UPS API
UPS_CLIENT_ID=your-actual-ups-client-id
UPS_CLIENT_SECRET=your-actual-ups-client-secret
UPS_ACCOUNT_NUMBER=your-actual-ups-account-number

# Shipping Origin Address (your warehouse)
SHIPPING_ORIGIN_ADDRESS=123 Main Street
SHIPPING_ORIGIN_CITY=Montreal
SHIPPING_ORIGIN_POSTAL_CODE=H2X1Y1
SHIPPING_ORIGIN_PROVINCE=QC
```

### **Step 4: Install Dependencies**

```bash
cd server
npm install axios
```

### **Step 5: Test Backend Integration**

1. **Start the backend server:**
```bash
npm run dev
```

2. **Test shipping rate calculation:**
```bash
curl -X POST http://localhost:5000/api/shipping/rates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "cartItems": [
      {
        "_id": "product123",
        "name": "Test Product",
        "quantity": 2,
        "weight": 0.5
      }
    ],
    "destinationAddress": {
      "street": "456 Test Street",
      "city": "Montreal",
      "province": "QC",
      "postalCode": "H3A1A1"
    }
  }'
```

---

## 🎛 **Phase 3: Admin Panel Configuration**

### **Step 6: Access Admin Shipping Settings**

1. **Navigate to:** `/admin/shipping` in your admin panel
2. **Configure carriers:**
   - Enable/disable carriers
   - Set markup percentages
   - Configure delivery time estimates

3. **Configure box tiers:**
   - Small: 1 item max
   - Medium: 10 items max  
   - Large: 20 items max
   - XL: 35 items max

### **Step 7: Test Admin Functions**

1. **Test carrier settings update:**
```bash
curl -X PUT http://localhost:5000/api/shipping/admin/carriers/canadaPost \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "markup": 3.00,
    "deliveryDays": "3-5"
  }'
```

2. **Test box tier settings update:**
```bash
curl -X PUT http://localhost:5000/api/shipping/admin/boxes/small \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "basePrice": 9.99,
    "maxQuantity": 2
  }'
```

---

## 🧪 **Phase 4: Testing & Validation**

### **Step 8: Frontend Integration Testing**

1. **Test cart shipping calculation:**
   - Add items to cart
   - Enter Québec address
   - Verify shipping rates appear

2. **Test admin shipping panel:**
   - Toggle carriers on/off
   - Adjust markup percentages
   - Update box tier settings

### **Step 9: Production Readiness**

1. **Update environment variables for production:**
   - Use production API endpoints
   - Set secure JWT secrets
   - Configure CORS for production domain

2. **Test with real Québec addresses:**
   - Montreal: H2X1Y1, H3A1A1
   - Quebec City: G1K1A1
   - Laval: H7L1A1

---

## 📊 **Box Tier Configuration**

| Tier | Dimensions | Max Items | Base Price | Use Case |
|------|------------|-----------|------------|----------|
| Small | 12x9x2 in | 1 | $8.99 | Jewelry, accessories |
| Medium | 14x10x4 in | 10 | $12.99 | Clothing, books |
| Large | 16x12x6 in | 20 | $16.99 | Multiple items |
| XL | 20x14x8 in | 35 | $22.99 | Large orders |

---

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **API Authentication Errors:**
   - Verify API credentials are correct
   - Check if API keys are active
   - Ensure proper authorization headers

2. **Rate Calculation Failures:**
   - Verify Québec address format
   - Check weight calculations
   - Validate box tier selection

3. **Admin Panel Issues:**
   - Ensure admin JWT token is valid
   - Check CORS configuration
   - Verify route permissions

### **Debug Commands:**

```bash
# Test Canada Post connection
curl -v -X POST https://soa-gw.canadapost.ca/rs/ship/price \
  -u "YOUR_API_KEY:YOUR_API_SECRET"

# Test UPS connection  
curl -v -X POST https://wwwcie.ups.com/security/v1/oauth/token \
  -u "YOUR_CLIENT_ID:YOUR_CLIENT_SECRET"

# Test backend shipping service
curl -X POST http://localhost:5000/api/shipping/admin/test-rates \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cartItems": [{"_id": "test", "quantity": 1, "weight": 1}],
    "destinationAddress": {
      "street": "123 Test St",
      "city": "Montreal", 
      "province": "QC",
      "postalCode": "H2X1Y1"
    }
  }'
```

---

## ✅ **Next Steps**

1. **Get API credentials** from Canada Post and UPS
2. **Update environment variables** with your credentials
3. **Test the integration** using the provided test commands
4. **Configure admin settings** for carriers and box tiers
5. **Test with real Québec addresses** in the frontend
6. **Deploy to production** with proper security settings

**Need help?** Check the troubleshooting section or contact support with specific error messages. 