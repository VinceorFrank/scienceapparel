import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { api } from '../api/config';

export const useSupportManagement = () => {
  const queryClient = useQueryClient();
  
  // State for filtering and pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [category, setCategory] = useState('all');
  const [assignedTo, setAssignedTo] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // State for modals and forms
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState([]);

  // Fetch support tickets
  const {
    data: ticketsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['support-tickets', page, pageSize, search, status, priority, category, assignedTo, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder
      });

      if (search) params.append('search', search);
      if (status !== 'all') params.append('status', status);
      if (priority !== 'all') params.append('priority', priority);
      if (category !== 'all') params.append('category', category);
      if (assignedTo !== 'all') params.append('assignedTo', assignedTo);

      const response = await api.get(`/support?${params}`);
      return response.data;
    },
    keepPreviousData: true
  });

  // Fetch support statistics
  const { data: stats } = useQuery({
    queryKey: ['support-stats'],
    queryFn: async () => {
      const response = await api.get('/support/stats');
      return response.data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch single ticket
  const { data: ticketDetails } = useQuery({
    queryKey: ['support-ticket', selectedTicket],
    queryFn: async () => {
      if (!selectedTicket) return null;
      const response = await api.get(`/support/${selectedTicket}`);
      return response.data;
    },
    enabled: !!selectedTicket
  });

  // Mutations
  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const response = await api.put(`/support/${id}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['support-tickets']);
      queryClient.invalidateQueries(['support-stats']);
      toast.success('Ticket updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error updating ticket');
    }
  });

  const addResponseMutation = useMutation({
    mutationFn: async ({ id, response }) => {
      const responseData = await api.post(`/support/${id}/response`, response);
      return responseData.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['support-tickets']);
      queryClient.invalidateQueries(['support-ticket']);
      toast.success('Response added successfully');
      setIsResponseModalOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error adding response');
    }
  });

  const deleteTicketMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/support/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['support-tickets']);
      queryClient.invalidateQueries(['support-stats']);
      toast.success('Ticket deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error deleting ticket');
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ticketIds, updates }) => {
      const response = await api.put('/support/bulk/update', { ticketIds, updates });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['support-tickets']);
      queryClient.invalidateQueries(['support-stats']);
      toast.success(`Successfully updated ${data.modifiedCount} tickets`);
      setSelectedTickets([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error bulk updating tickets');
    }
  });

  // Action handlers
  const handleViewTicket = (ticketId) => {
    setSelectedTicket(ticketId);
    setIsViewModalOpen(true);
  };

  const handleEditTicket = (ticketId) => {
    setSelectedTicket(ticketId);
    setIsEditModalOpen(true);
  };

  const handleAddResponse = (ticketId) => {
    setSelectedTicket(ticketId);
    setIsResponseModalOpen(true);
  };

  const handleDeleteTicket = (ticketId) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      deleteTicketMutation.mutate(ticketId);
    }
  };

  const handleUpdateTicket = (updates) => {
    if (selectedTicket) {
      updateTicketMutation.mutate({ id: selectedTicket, updates });
      setIsEditModalOpen(false);
    }
  };

  const handleAddResponseToTicket = (response) => {
    if (selectedTicket) {
      addResponseMutation.mutate({ id: selectedTicket, response });
    }
  };

  const handleBulkUpdate = (updates) => {
    if (selectedTickets.length === 0) {
      toast.warning('Please select tickets to update');
      return;
    }
    bulkUpdateMutation.mutate({ ticketIds: selectedTickets, updates });
  };

  const handleSelectTicket = (ticketId, checked) => {
    if (checked) {
      setSelectedTickets([...selectedTickets, ticketId]);
    } else {
      setSelectedTickets(selectedTickets.filter(id => id !== ticketId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTickets(ticketsData?.tickets?.map(ticket => ticket._id) || []);
    } else {
      setSelectedTickets([]);
    }
  };

  const handleCloseModals = () => {
    setIsViewModalOpen(false);
    setIsResponseModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedTicket(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  // Helper functions
  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      waiting_customer: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryColor = (category) => {
    const colors = {
      general: 'bg-blue-100 text-blue-800',
      technical: 'bg-purple-100 text-purple-800',
      billing: 'bg-green-100 text-green-800',
      shipping: 'bg-orange-100 text-orange-800',
      product: 'bg-pink-100 text-pink-800',
      refund: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return {
    // Data
    tickets: ticketsData?.tickets || [],
    pagination: ticketsData?.pagination,
    stats,
    ticketDetails,
    selectedTickets,
    
    // Loading states
    isLoading,
    isUpdating: updateTicketMutation.isLoading,
    isAddingResponse: addResponseMutation.isLoading,
    isDeleting: deleteTicketMutation.isLoading,
    isBulkUpdating: bulkUpdateMutation.isLoading,
    
    // Modal states
    isViewModalOpen,
    isResponseModalOpen,
    isEditModalOpen,
    selectedTicket,
    
    // Filters and pagination
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
    
    // Actions
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
    
    // Helper functions
    getStatusColor,
    getPriorityColor,
    getCategoryColor,
    
    // Error
    error
  };
}; 