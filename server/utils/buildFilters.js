function buildFilters(query) {
  const filters = {};

  if (query.keyword) {
    filters.name = { $regex: query.keyword, $options: 'i' };
  }

  if (query.category) {
    filters.category = query.category;
  }

  if (query.minPrice || query.maxPrice) {
    filters.price = {};
    if (query.minPrice) filters.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filters.price.$lte = Number(query.maxPrice);
  }

  return filters;
}

module.exports = buildFilters;
