export const applyFilters = (query, queryParams) => {
  const filters = {};

  if(queryParams.status) {
    filter.status = queryParams.status;
  }

  if(queryParams.author) {
    filters.author = queryParams.author;
  }

  return query.find(filters);
}

export const applySorting = (query, sort='desc') => {
  const sortOrder = sort === "asc" ? 1 : -1;

  return query.sort({ createdAt: sortOrder });
}

export const applyPagination = ( query, page = 1, limit = 10 ) => {
  const skip = (page - 1) * limit;

  return {
    query: query.skip(skip).limit(limit),
    pagination: {
      page,
      limit,
    },
  };
};
