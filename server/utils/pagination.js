/**
 * Pagination utility for consistent pagination across all API endpoints
 */

/**
 * Create pagination metadata
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} Pagination metadata
 */
const createPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  const nextPage = hasNextPage ? page + 1 : null;
  const prevPage = hasPrevPage ? page - 1 : null;

  return {
    currentPage: page,
    itemsPerPage: limit,
    totalItems: total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    startIndex: (page - 1) * limit + 1,
    endIndex: Math.min(page * limit, total)
  };
};

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Request query object
 * @param {Object} options - Configuration options
 * @returns {Object} Pagination parameters
 */
const parsePaginationParams = (query, options = {}) => {
  const {
    defaultPage = 1,
    defaultLimit = 10,
    maxLimit = 100,
    minLimit = 1
  } = options;

  let page = parseInt(query.page) || defaultPage;
  let limit = parseInt(query.limit) || defaultLimit;

  // Validate and constrain values
  page = Math.max(1, page);
  limit = Math.max(minLimit, Math.min(maxLimit, limit));

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip
  };
};

/**
 * Create paginated response
 * @param {Array} data - Array of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {Object} additionalMeta - Additional metadata to include
 * @returns {Object} Paginated response object
 */
const createPaginatedResponse = (data, page, limit, total, additionalMeta = {}) => {
  const pagination = createPaginationMeta(page, limit, total);

  return {
    success: true,
    data,
    pagination,
    ...additionalMeta
  };
};

/**
 * Apply pagination to Mongoose query
 * @param {Object} query - Mongoose query object
 * @param {Object} paginationParams - Pagination parameters
 * @returns {Object} Modified query object
 */
const applyPagination = (query, paginationParams) => {
  const { skip, limit } = paginationParams;
  return query.skip(skip).limit(limit);
};

/**
 * Execute paginated query with count
 * @param {Object} model - Mongoose model
 * @param {Object} filter - Query filter
 * @param {Object} paginationParams - Pagination parameters
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Paginated result
 */
const executePaginatedQuery = async (model, filter, paginationParams, options = {}) => {
  const { page, limit } = paginationParams;
  const { sort, populate, select, lean = false } = options;

  // Build query
  let query = model.find(filter);

  // Apply sorting
  if (sort) {
    query = query.sort(sort);
  }

  // Apply population
  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach(pop => query = query.populate(pop));
    } else {
      query = query.populate(populate);
    }
  }

  // Apply field selection
  if (select) {
    query = query.select(select);
  }

  // Apply lean option
  if (lean) {
    query = query.lean();
  }

  // Execute count and data queries in parallel
  const [total, data] = await Promise.all([
    model.countDocuments(filter).exec(),
    applyPagination(query.clone(), paginationParams).exec()
  ]);

  return {
    data,
    total,
    pagination: createPaginationMeta(page, limit, total)
  };
};

/**
 * Create pagination links for HATEOAS
 * @param {string} baseUrl - Base URL for the API
 * @param {Object} paginationMeta - Pagination metadata
 * @param {Object} queryParams - Additional query parameters
 * @returns {Object} Pagination links
 */
const createPaginationLinks = (baseUrl, paginationMeta, queryParams = {}) => {
  const { currentPage, totalPages, hasNextPage, hasPrevPage, nextPage, prevPage } = paginationMeta;
  
  const buildUrl = (page) => {
    const params = new URLSearchParams({
      ...queryParams,
      page: page.toString()
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const links = {
    self: buildUrl(currentPage),
    first: buildUrl(1),
    last: buildUrl(totalPages)
  };

  if (hasPrevPage) {
    links.prev = buildUrl(prevPage);
  }

  if (hasNextPage) {
    links.next = buildUrl(nextPage);
  }

  return links;
};

module.exports = {
  createPaginationMeta,
  parsePaginationParams,
  createPaginatedResponse,
  applyPagination,
  executePaginatedQuery,
  createPaginationLinks
}; 