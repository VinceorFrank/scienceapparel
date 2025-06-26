import React, { useState } from 'react';
import { useSupportManagement } from '../../hooks/useSupportManagement';
import { useLang } from '../../utils/lang';

const SupportAdmin = () => {
  const {
    tickets,
    pagination,
    stats,
    isLoading,
    selectedTickets,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    status,
    setStatus,
    priority,
    setPriority,
    category,
    setCategory,
    assignedTo,
    setAssignedTo,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    handleViewTicket,
    handleEditTicket,
    handleAddResponse,
    handleDeleteTicket,
    handleUpdateTicket,
    handleAddResponseToTicket,
    handleBulkUpdate,
    handleSelectTicket,
    handleSelectAll,
    handleCloseModals,
    handleRefresh,
    getStatusColor,
    getPriorityColor,
    getCategoryColor,
    isViewModalOpen,
    isResponseModalOpen,
    isEditModalOpen,
    ticketDetails
  } = useSupportManagement();

  const { t } = useLang();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Bulk action options
  const bulkActions = [
    { value: 'status_open', label: 'Set Status: Open' },
    { value: 'status_in_progress', label: 'Set Status: In Progress' },
    { value: 'status_resolved', label: 'Set Status: Resolved' },
    { value: 'status_closed', label: 'Set Status: Closed' },
    { value: 'priority_low', label: 'Set Priority: Low' },
    { value: 'priority_medium', label: 'Set Priority: Medium' },
    { value: 'priority_high', label: 'Set Priority: High' },
    { value: 'priority_urgent', label: 'Set Priority: Urgent' }
  ];

  const handleBulkAction = (action) => {
    const [field, value] = action.split('_');
    const updates = { [field]: value };
    handleBulkUpdate(updates);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTicketAge = (createdAt) => {
    const age = Math.floor((Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
    if (age === 0) return 'Today';
    if (age === 1) return '1 day ago';
    return `${age} days ago`;
  };

  return (
    <div className="min-h-screen bg-[#FCFAF6] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold mb-1" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED' }}>
            {t('supportManagement') || 'Support Management'}
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-pink-300 text-white rounded-full shadow hover:bg-pink-400 transition flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>{t('refresh') || 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-6 items-stretch">
            <div className="bg-gradient-to-br from-blue-100 via-pink-100 to-white p-6 rounded-3xl shadow-lg border border-blue-100 min-h-[110px] flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED', textTransform: 'capitalize' }}>
                {(t('totalTickets') || 'Total Tickets').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h3>
              <p className="text-3xl font-bold text-gray-800">{stats?.totalTickets || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-100 via-pink-100 to-white p-6 rounded-3xl shadow-lg border border-yellow-100 min-h-[110px] flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED', textTransform: 'capitalize' }}>
                {(t('openTickets') || 'Open Tickets').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h3>
              <p className="text-3xl font-bold text-gray-800">
                {stats?.byStatus?.find(s => s._id === 'open')?.count || 0}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-100 via-pink-100 to-white p-6 rounded-3xl shadow-lg border border-green-100 min-h-[110px] flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED', textTransform: 'capitalize' }}>
                {(t('resolvedTickets') || 'Resolved Tickets').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h3>
              <p className="text-3xl font-bold text-gray-800">
                {stats?.byStatus?.find(s => s._id === 'resolved')?.count || 0}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-100 via-pink-100 to-white p-6 rounded-3xl shadow-lg border border-purple-100 min-h-[110px] flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Fredoka One, cursive', color: '#6DD5ED', textTransform: 'capitalize' }}>
                {(t('avgResponseTime') || 'Avg Response Time').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </h3>
              <p className="text-3xl font-bold text-gray-800">{stats?.averageResponseTime || 0}h</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-pink-100">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('searchTickets') || 'Search Tickets'}
              </label>
              <input
                type="text"
                placeholder={t('searchByCustomerSubject') || 'Search by customer, subject...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('status') || 'Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="all">{t('allStatuses') || 'All Statuses'}</option>
                <option value="open">{t('open') || 'Open'}</option>
                <option value="in_progress">{t('inProgress') || 'In Progress'}</option>
                <option value="waiting_customer">{t('waitingCustomer') || 'Waiting Customer'}</option>
                <option value="resolved">{t('resolved') || 'Resolved'}</option>
                <option value="closed">{t('closed') || 'Closed'}</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('priority') || 'Priority'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="all">{t('allPriorities') || 'All Priorities'}</option>
                <option value="low">{t('low') || 'Low'}</option>
                <option value="medium">{t('medium') || 'Medium'}</option>
                <option value="high">{t('high') || 'High'}</option>
                <option value="urgent">{t('urgent') || 'Urgent'}</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('category') || 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="all">{t('allCategories') || 'All Categories'}</option>
                <option value="general">{t('general') || 'General'}</option>
                <option value="technical">{t('technical') || 'Technical'}</option>
                <option value="billing">{t('billing') || 'Billing'}</option>
                <option value="shipping">{t('shipping') || 'Shipping'}</option>
                <option value="product">{t('product') || 'Product'}</option>
                <option value="refund">{t('refund') || 'Refund'}</option>
                <option value="other">{t('other') || 'Other'}</option>
              </select>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              {showAdvancedFilters ? t('hideAdvanced') || 'Hide Advanced' : t('showAdvanced') || 'Show Advanced'}
            </button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('sortBy') || 'Sort By'}
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="createdAt">{t('dateCreated') || 'Date Created'}</option>
                    <option value="updatedAt">{t('lastUpdated') || 'Last Updated'}</option>
                    <option value="priority">{t('priority') || 'Priority'}</option>
                    <option value="status">{t('status') || 'Status'}</option>
                    <option value="customerName">{t('customerName') || 'Customer Name'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('sortOrder') || 'Sort Order'}
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="desc">{t('newestFirst') || 'Newest First'}</option>
                    <option value="asc">{t('oldestFirst') || 'Oldest First'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('itemsPerPage') || 'Items per Page'}
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(parseInt(e.target.value))}
                    className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-pink-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedTickets.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-yellow-800 font-medium">
                {selectedTickets.length} {t('ticketsSelected') || 'tickets selected'}
              </span>
              <div className="flex items-center space-x-2">
                <select
                  onChange={(e) => handleBulkAction(e.target.value)}
                  className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">{t('bulkActions') || 'Bulk Actions'}</option>
                  {bulkActions.map(action => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleSelectAll(false)}
                  className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  {t('clearSelection') || 'Clear'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tickets Table */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-pink-100">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('loadingTickets') || 'Loading tickets...'}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-pink-100 to-blue-100">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedTickets.length === tickets.length && tickets.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">{t('ticket')}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t('customer')}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t('subject')}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t('status')}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t('priority')}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t('category')}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t('age')}</th>
                      <th className="px-4 py-3 text-left font-semibold">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tickets.map((ticket) => (
                      <tr key={ticket._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedTickets.includes(ticket._id)}
                            onChange={(e) => handleSelectTicket(ticket._id, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-gray-600">
                            #{ticket._id.slice(-6)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{ticket.customerName}</div>
                            <div className="text-sm text-gray-500">{ticket.customerEmail}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs truncate" title={ticket.subject}>
                            {['Order not received','Refund request','Technical issue with login','Product question','Billing error'].includes(ticket.subject)
                              ? t(
                                  ticket.subject === 'Order not received' ? 'orderNotReceived' :
                                  ticket.subject === 'Refund request' ? 'refundRequest' :
                                  ticket.subject === 'Technical issue with login' ? 'technicalIssueWithLogin' :
                                  ticket.subject === 'Product question' ? 'productQuestion' :
                                  ticket.subject === 'Billing error' ? 'billingError' :
                                  ticket.subject
                                )
                              : ticket.subject}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {t(ticket.status) || ticket.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {t(ticket.priority) || ticket.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(ticket.category)}`}>
                            {t(ticket.category) || ticket.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {ticket.createdAt ? (getTicketAge(ticket.createdAt) === 'Today' ? t('today') : getTicketAge(ticket.createdAt)) : ''}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewTicket(ticket._id)}
                              className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition"
                            >
                              {t('view')}
                            </button>
                            <button
                              onClick={() => handleAddResponse(ticket._id)}
                              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition"
                            >
                              {t('respond')}
                            </button>
                            <button
                              onClick={() => handleEditTicket(ticket._id)}
                              className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 transition"
                            >
                              {t('edit')}
                            </button>
                            <button
                              onClick={() => handleDeleteTicket(ticket._id)}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
                            >
                              {t('delete')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      {t('showing') || 'Showing'} {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} {t('to') || 'to'} {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} {t('of') || 'of'} {pagination.totalItems} {t('tickets') || 'tickets'}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('previous') || 'Previous'}
                      </button>
                      <span className="px-3 py-1 bg-white border border-gray-300 rounded">
                        {t('page') || 'Page'} {page} {t('of') || 'of'} {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === pagination.totalPages}
                        className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('next') || 'Next'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Empty State */}
        {!isLoading && tickets.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📧</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('noSupportTickets') || 'No support tickets found'}
            </h3>
            <p className="text-gray-500">
              {t('noTicketsMessage') || 'There are no support tickets matching your current filters.'}
            </p>
          </div>
        )}
      </div>

      {/* Simple Modal for Viewing Ticket */}
      {isViewModalOpen && ticketDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Ticket #{ticketDetails._id.slice(-6)}</h2>
              <button
                onClick={handleCloseModals}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Customer Information</h3>
                <p><strong>Name:</strong> {ticketDetails.customerName}</p>
                <p><strong>Email:</strong> {ticketDetails.customerEmail}</p>
                {ticketDetails.customerPhone && <p><strong>Phone:</strong> {ticketDetails.customerPhone}</p>}
              </div>
              <div>
                <h3 className="font-semibold">Ticket Details</h3>
                <p><strong>Subject:</strong> {ticketDetails.subject}</p>
                <p><strong>Message:</strong> {ticketDetails.message}</p>
                <p><strong>Category:</strong> {ticketDetails.category}</p>
                <p><strong>Priority:</strong> {ticketDetails.priority}</p>
                <p><strong>Status:</strong> {ticketDetails.status}</p>
                <p><strong>Created:</strong> {formatDate(ticketDetails.createdAt)}</p>
              </div>
              {ticketDetails.responses && ticketDetails.responses.length > 0 && (
                <div>
                  <h3 className="font-semibold">Responses</h3>
                  {ticketDetails.responses.map((response, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 mb-2">
                      <p><strong>{response.adminName}</strong> - {formatDate(response.createdAt)}</p>
                      <p>{response.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simple Modal for Adding Response */}
      {isResponseModalOpen && ticketDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Response</h2>
              <button
                onClick={handleCloseModals}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleAddResponseToTicket({
                message: formData.get('message'),
                isInternal: formData.get('isInternal') === 'on'
              });
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Enter your response..."
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isInternal"
                    className="rounded border-gray-300 mr-2"
                  />
                  <span className="text-sm text-gray-700">Internal note (not visible to customer)</span>
                </label>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                >
                  Send Response
                </button>
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportAdmin; 