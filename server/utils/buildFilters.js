/**
 * Advanced filtering utility for building MongoDB query filters
 */

/**
 * Build text search filter
 * @param {string} searchTerm - Search term
 * @param {Array} fields - Fields to search in
 * @returns {Object} Text search filter
 */
const buildTextSearchFilter = (searchTerm, fields) => {
  if (!searchTerm || !fields.length) return {};

  const searchConditions = fields.map(field => ({
    [field]: { $regex: searchTerm, $options: 'i' }
  }));

  return { $or: searchConditions };
};

/**
 * Build date range filter
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @param {string} field - Date field name
 * @returns {Object} Date range filter
 */
const buildDateRangeFilter = (startDate, endDate, field = 'createdAt') => {
  const filter = {};

  if (startDate) {
    filter[field] = { $gte: new Date(startDate) };
  }

  if (endDate) {
    filter[field] = { ...filter[field], $lte: new Date(endDate) };
  }

  return filter;
};

/**
 * Build numeric range filter
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} field - Field name
 * @returns {Object} Numeric range filter
 */
const buildNumericRangeFilter = (min, max, field) => {
  const filter = {};

  if (min !== undefined && min !== null) {
    filter[field] = { $gte: Number(min) };
  }

  if (max !== undefined && max !== null) {
    filter[field] = { ...filter[field], $lte: Number(max) };
  }

  return filter;
};

/**
 * Build boolean filter
 * @param {boolean} value - Boolean value
 * @param {string} field - Field name
 * @returns {Object} Boolean filter
 */
const buildBooleanFilter = (value, field) => {
  if (value === undefined || value === null) return {};
  
  // Handle string boolean values
  const boolValue = typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value);
  return { [field]: boolValue };
};

/**
 * Build array filter
 * @param {Array} values - Array of values
 * @param {string} field - Field name
 * @param {string} operator - Array operator ('in', 'nin', 'all')
 * @returns {Object} Array filter
 */
const buildArrayFilter = (values, field, operator = 'in') => {
  if (!values || !Array.isArray(values) || values.length === 0) return {};

  const operators = {
    in: { $in: values },
    nin: { $nin: values },
    all: { $all: values }
  };

  return { [field]: operators[operator] || operators.in };
};

/**
 * Build sorting object
 * @param {string} sortString - Sort string (e.g., "name,-price,createdAt")
 * @param {Object} allowedFields - Object mapping field names to their allowed sort directions
 * @returns {Object} Sort object
 */
const buildSortObject = (sortString, allowedFields = {}) => {
  if (!sortString) return {};

  const sortFields = sortString.split(',');
  const sortObject = {};

  sortFields.forEach(field => {
    const isDescending = field.startsWith('-');
    const cleanField = isDescending ? field.substring(1) : field;
    
    // Check if field is allowed
    if (allowedFields[cleanField] || Object.keys(allowedFields).length === 0) {
      sortObject[cleanField] = isDescending ? -1 : 1;
    }
  });

  return sortObject;
};

/**
 * Build advanced filters for products
 * @param {Object} query - Request query object
 * @returns {Object} MongoDB filter object
 */
const buildProductFilters = (query) => {
  const filters = {};

  // Text search across multiple fields
  if (query.keyword) {
    const textSearch = buildTextSearchFilter(query.keyword, ['name', 'description', 'tags']);
    Object.assign(filters, textSearch);
  }

  // Category filter
  if (query.category) {
    filters.category = query.category;
  }

  // Price range filter
  if (query.minPrice || query.maxPrice) {
    const priceFilter = buildNumericRangeFilter(query.minPrice, query.maxPrice, 'price');
    Object.assign(filters, priceFilter);
  }

  // Stock range filter
  if (query.minStock || query.maxStock) {
    const stockFilter = buildNumericRangeFilter(query.minStock, query.maxStock, 'stock');
    Object.assign(filters, stockFilter);
  }

  // Rating filter
  if (query.minRating) {
    filters.rating = { $gte: Number(query.minRating) };
  }

  // Boolean filters
  if (query.featured !== undefined) {
    const featuredFilter = buildBooleanFilter(query.featured, 'featured');
    Object.assign(filters, featuredFilter);
  }

  if (query.archived !== undefined) {
    const archivedFilter = buildBooleanFilter(query.archived, 'archived');
    Object.assign(filters, archivedFilter);
  }

  // Tag filter
  if (query.tags) {
    const tags = Array.isArray(query.tags) ? query.tags : [query.tags];
    const tagFilter = buildArrayFilter(tags, 'tags', 'in');
    Object.assign(filters, tagFilter);
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    const dateFilter = buildDateRangeFilter(query.startDate, query.endDate, 'createdAt');
    Object.assign(filters, dateFilter);
  }

  // Exclude archived products by default (unless specifically requested)
  if (query.archived === undefined) {
    filters.archived = { $ne: true };
  }

  return filters;
};

/**
 * Build advanced filters for orders
 * @param {Object} query - Request query object
 * @returns {Object} MongoDB filter object
 */
const buildOrderFilters = (query) => {
  const filters = {};

  // Status filter
  if (query.status) {
    filters.status = query.status;
  }

  // Payment status filter
  if (query.isPaid !== undefined) {
    const paidFilter = buildBooleanFilter(query.isPaid, 'isPaid');
    Object.assign(filters, paidFilter);
  }

  // Delivery status filter
  if (query.isDelivered !== undefined) {
    const deliveredFilter = buildBooleanFilter(query.isDelivered, 'isDelivered');
    Object.assign(filters, deliveredFilter);
  }

  // Total price range filter
  if (query.minTotal || query.maxTotal) {
    const totalFilter = buildNumericRangeFilter(query.minTotal, query.maxTotal, 'totalPrice');
    Object.assign(filters, totalFilter);
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    const dateFilter = buildDateRangeFilter(query.startDate, query.endDate, 'createdAt');
    Object.assign(filters, dateFilter);
  }

  // User filter
  if (query.user) {
    filters.user = query.user;
  }

  // Payment method filter
  if (query.paymentMethod) {
    filters.paymentMethod = query.paymentMethod;
  }

  return filters;
};

/**
 * Build advanced filters for users
 * @param {Object} query - Request query object
 * @returns {Object} MongoDB filter object
 */
const buildUserFilters = (query) => {
  const filters = {};

  // Text search across name and email
  if (query.search) {
    const textSearch = buildTextSearchFilter(query.search, ['name', 'email']);
    Object.assign(filters, textSearch);
  }

  // Role filter
  if (query.role) {
    filters.role = query.role;
  }

  // Admin status filter
  if (query.isAdmin !== undefined) {
    const adminFilter = buildBooleanFilter(query.isAdmin, 'isAdmin');
    Object.assign(filters, adminFilter);
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    const dateFilter = buildDateRangeFilter(query.startDate, query.endDate, 'createdAt');
    Object.assign(filters, dateFilter);
  }

  return filters;
};

/**
 * Build advanced filters for categories
 * @param {Object} query - Request query object
 * @returns {Object} MongoDB filter object
 */
const buildCategoryFilters = (query) => {
  const filters = {};

  // Text search
  if (query.search) {
    const textSearch = buildTextSearchFilter(query.search, ['name', 'description']);
    Object.assign(filters, textSearch);
  }

  // Date range filter
  if (query.startDate || query.endDate) {
    const dateFilter = buildDateRangeFilter(query.startDate, query.endDate, 'createdAt');
    Object.assign(filters, dateFilter);
  }

  return filters;
};

/**
 * Generic filter builder
 * @param {Object} query - Request query object
 * @param {string} type - Filter type ('product', 'order', 'user', 'category')
 * @returns {Object} MongoDB filter object
 */
const buildFilters = (query, type = 'product') => {
  const filterBuilders = {
    product: buildProductFilters,
    order: buildOrderFilters,
    user: buildUserFilters,
    category: buildCategoryFilters
  };

  const builder = filterBuilders[type];
  return builder ? builder(query) : {};
};

module.exports = {
  buildFilters,
  buildTextSearchFilter,
  buildDateRangeFilter,
  buildNumericRangeFilter,
  buildBooleanFilter,
  buildArrayFilter,
  buildSortObject,
  buildProductFilters,
  buildOrderFilters,
  buildUserFilters,
  buildCategoryFilters
};
