const axios = require('axios');

// Carrier Configuration
const carriers = {
  canadaPost: {
    name: 'Canada Post',
    enabled: true,
    apiKey: process.env.CANADA_POST_API_KEY,
    apiSecret: process.env.CANADA_POST_API_SECRET,
    customerNumber: process.env.CANADA_POST_CUSTOMER_NUMBER,
    baseUrl: 'https://soa-gw.canadapost.ca/rs/ship/price',
    markup: 2.50, // Admin configurable markup
    deliveryDays: 3-5
  },
  ups: {
    name: 'UPS',
    enabled: true,
    clientId: process.env.UPS_CLIENT_ID,
    clientSecret: process.env.UPS_CLIENT_SECRET,
    accountNumber: process.env.UPS_ACCOUNT_NUMBER,
    baseUrl: 'https://wwwcie.ups.com/api/shipments/v1/rates',
    markup: 3.00,
    deliveryDays: 2-4
  },
  purolator: {
    name: 'Purolator',
    enabled: false,
    apiKey: process.env.PUROLATOR_API_KEY,
    baseUrl: 'https://api.purolator.com/shipping/rs/v1/rates',
    markup: 2.75,
    deliveryDays: 2-3
  },
  fedex: {
    name: 'FedEx',
    enabled: false,
    apiKey: process.env.FEDEX_API_KEY,
    baseUrl: 'https://apis-sandbox.fedex.com/rate/v1/rates/quotes',
    markup: 3.50,
    deliveryDays: 1-3
  }
};

// Box Tiers Configuration
const boxTiers = {
  small: {
    name: 'Small',
    dimensions: { length: 12, width: 9, height: 2 },
    maxWeight: 2, // lbs
    maxQuantity: 1,
    basePrice: 8.99,
    description: 'Perfect for small items like jewelry, accessories'
  },
  medium: {
    name: 'Medium', 
    dimensions: { length: 14, width: 10, height: 4 },
    maxWeight: 5,
    maxQuantity: 10,
    basePrice: 12.99,
    description: 'Ideal for clothing, books, small electronics'
  },
  large: {
    name: 'Large',
    dimensions: { length: 16, width: 12, height: 6 },
    maxWeight: 10,
    maxQuantity: 20,
    basePrice: 16.99,
    description: 'Great for multiple items, medium electronics'
  },
  xl: {
    name: 'XL',
    dimensions: { length: 20, width: 14, height: 8 },
    maxWeight: 20,
    maxQuantity: 35,
    basePrice: 22.99,
    description: 'For large orders, bulky items, multiple products'
  }
};

class ShippingService {
  constructor() {
    this.enabledCarriers = Object.keys(carriers).filter(key => carriers[key].enabled);
  }

  // Calculate shipping rates for Québec addresses
  async calculateShippingRates(cartItems, destinationAddress) {
    try {
      const rates = [];
      const totalWeight = this.calculateTotalWeight(cartItems);
      const boxTier = this.selectBoxTier(cartItems);
      
      // Validate Québec address
      if (!this.isQuebecAddress(destinationAddress)) {
        throw new Error('Shipping currently available only for Québec addresses');
      }

      // Get rates from each enabled carrier
      for (const carrierKey of this.enabledCarriers) {
        const carrier = carriers[carrierKey];
        const rate = await this.getCarrierRate(carrierKey, totalWeight, boxTier, destinationAddress);
        if (rate) {
          rates.push({
            carrier: carrier.name,
            carrierKey: carrierKey,
            price: rate.price + carrier.markup,
            deliveryDays: carrier.deliveryDays,
            boxTier: boxTier.name,
            estimatedDelivery: this.calculateEstimatedDelivery(carrier.deliveryDays)
          });
        }
      }

      return rates.sort((a, b) => a.price - b.price);
    } catch (error) {
      console.error('Shipping rate calculation error:', error);
      throw error;
    }
  }

  // Calculate total weight of cart items
  calculateTotalWeight(cartItems) {
    return cartItems.reduce((total, item) => {
      const itemWeight = item.weight || 0.5; // Default weight if not specified
      return total + (itemWeight * item.quantity);
    }, 0);
  }

  // Select appropriate box tier based on cart contents
  selectBoxTier(cartItems) {
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalQuantity <= boxTiers.small.maxQuantity) return boxTiers.small;
    if (totalQuantity <= boxTiers.medium.maxQuantity) return boxTiers.medium;
    if (totalQuantity <= boxTiers.large.maxQuantity) return boxTiers.large;
    return boxTiers.xl;
  }

  // Validate if address is in Québec
  isQuebecAddress(address) {
    const quebecProvinces = ['QC', 'QUÉBEC', 'QUEBEC'];
    const province = address.province?.toUpperCase() || address.state?.toUpperCase();
    return quebecProvinces.includes(province);
  }

  // Get rate from specific carrier
  async getCarrierRate(carrierKey, weight, boxTier, destinationAddress) {
    try {
      switch (carrierKey) {
        case 'canadaPost':
          return await this.getCanadaPostRate(weight, boxTier, destinationAddress);
        case 'ups':
          return await this.getUPSRate(weight, boxTier, destinationAddress);
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error getting ${carrierKey} rate:`, error);
      return null;
    }
  }

  // Canada Post API integration
  async getCanadaPostRate(weight, boxTier, destinationAddress) {
    try {
      const carrier = carriers.canadaPost;
      
      const requestData = {
        originPostalCode: process.env.SHIPPING_ORIGIN_POSTAL_CODE || 'H2X1Y1',
        destinationPostalCode: destinationAddress.postalCode,
        weight: weight,
        length: boxTier.dimensions.length,
        width: boxTier.dimensions.width,
        height: boxTier.dimensions.height,
        serviceType: 'Regular Parcel'
      };

      const response = await axios.post(carrier.baseUrl, requestData, {
        auth: {
          username: carrier.apiKey,
          password: carrier.apiSecret
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return {
        price: parseFloat(response.data.price),
        service: response.data.serviceName
      };
    } catch (error) {
      console.error('Canada Post API error:', error);
      // Return fallback rate for development
      return {
        price: boxTier.basePrice,
        service: 'Regular Parcel'
      };
    }
  }

  // UPS API integration
  async getUPSRate(weight, boxTier, destinationAddress) {
    try {
      const carrier = carriers.ups;
      
      // First get access token
      const tokenResponse = await axios.post('https://wwwcie.ups.com/security/v1/oauth/token', {
        grant_type: 'client_credentials'
      }, {
        auth: {
          username: carrier.clientId,
          password: carrier.clientSecret
        }
      });

      const accessToken = tokenResponse.data.access_token;

      const requestData = {
        RateRequest: {
          Request: {
            RequestOption: 'Shop',
            TransactionReference: {
              CustomerContext: 'Shipping Rate Request'
            }
          },
          Shipment: {
            Shipper: {
              Address: {
                AddressLine: process.env.SHIPPING_ORIGIN_ADDRESS || '123 Main St',
                City: process.env.SHIPPING_ORIGIN_CITY || 'Montreal',
                StateProvinceCode: 'QC',
                PostalCode: process.env.SHIPPING_ORIGIN_POSTAL_CODE || 'H2X1Y1',
                CountryCode: 'CA'
              }
            },
            ShipTo: {
              Address: {
                AddressLine: destinationAddress.street,
                City: destinationAddress.city,
                StateProvinceCode: destinationAddress.province,
                PostalCode: destinationAddress.postalCode,
                CountryCode: 'CA'
              }
            },
            ShipFrom: {
              Address: {
                AddressLine: process.env.SHIPPING_ORIGIN_ADDRESS || '123 Main St',
                City: process.env.SHIPPING_ORIGIN_CITY || 'Montreal',
                StateProvinceCode: 'QC',
                PostalCode: process.env.SHIPPING_ORIGIN_POSTAL_CODE || 'H2X1Y1',
                CountryCode: 'CA'
              }
            },
            Service: {
              Code: '03',
              Description: 'Ground'
            },
            Package: {
              PackagingType: {
                Code: '02',
                Description: 'Package'
              },
              Dimensions: {
                UnitOfMeasurement: {
                  Code: 'IN'
                },
                Length: boxTier.dimensions.length.toString(),
                Width: boxTier.dimensions.width.toString(),
                Height: boxTier.dimensions.height.toString()
              },
              PackageWeight: {
                UnitOfMeasurement: {
                  Code: 'LBS'
                },
                Weight: weight.toString()
              }
            }
          }
        }
      };

      const response = await axios.post(carrier.baseUrl, requestData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        price: parseFloat(response.data.RateResponse.RatedShipment.TotalCharges.MonetaryValue),
        service: response.data.RateResponse.RatedShipment.Service.Name
      };
    } catch (error) {
      console.error('UPS API error:', error);
      // Return fallback rate for development
      return {
        price: boxTier.basePrice + 2,
        service: 'Ground'
      };
    }
  }

  // Calculate estimated delivery date
  calculateEstimatedDelivery(deliveryDays) {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + deliveryDays);
    return deliveryDate.toISOString().split('T')[0];
  }

  // Admin functions for carrier management
  async updateCarrierSettings(carrierKey, settings) {
    if (carriers[carrierKey]) {
      carriers[carrierKey] = { ...carriers[carrierKey], ...settings };
      return true;
    }
    return false;
  }

  async updateBoxTierSettings(tierKey, settings) {
    if (boxTiers[tierKey]) {
      boxTiers[tierKey] = { ...boxTiers[tierKey], ...settings };
      return true;
    }
    return false;
  }

  // Get current carrier settings
  getCarrierSettings() {
    return carriers;
  }

  // Get current box tier settings
  getBoxTierSettings() {
    return boxTiers;
  }
}

module.exports = new ShippingService(); 