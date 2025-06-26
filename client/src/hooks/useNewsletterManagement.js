import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { api } from '../api/config';

export const useNewsletterManagement = () => {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [html, setHtml] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  // Fetch subscribers
  const {
    data: subscribers = [],
    isLoading: loadingSubscribers,
    error: subscribersError
  } = useQuery({
    queryKey: ['newsletter-subscribers'],
    queryFn: async () => {
      const res = await api.get('/newsletter/subscribers');
      return res.data;
    }
  });

  // Fetch campaign history
  const {
    data: campaignData,
    isLoading: loadingCampaigns,
    error: campaignsError
  } = useQuery({
    queryKey: ['newsletter-campaigns'],
    queryFn: async () => {
      const res = await api.get('/newsletter/campaigns');
      return res.data;
    }
  });

  // Fetch scheduled newsletters
  const {
    data: scheduledCampaigns = [],
    isLoading: loadingScheduled,
    error: scheduledError
  } = useQuery({
    queryKey: ['newsletter-scheduled'],
    queryFn: async () => {
      const res = await api.get('/newsletter/scheduled');
      return res.data;
    }
  });

  // Fetch campaign statistics
  const {
    data: campaignStats,
    isLoading: loadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['newsletter-stats'],
    queryFn: async () => {
      const res = await api.get('/newsletter/campaigns/stats');
      return res.data;
    }
  });

  // Send newsletter mutation
  const sendNewsletterMutation = useMutation({
    mutationFn: async ({ subject, message, html, scheduledAt }) => {
      const res = await api.post('/newsletter/send', { subject, message, html, scheduledAt });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Newsletter sent!');
      setSubject('');
      setMessage('');
      setHtml('');
      setScheduledAt('');
      // Refresh campaign data
      queryClient.invalidateQueries(['newsletter-campaigns']);
      queryClient.invalidateQueries(['newsletter-scheduled']);
      queryClient.invalidateQueries(['newsletter-stats']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error sending newsletter');
    }
  });

  // Cancel scheduled newsletter mutation
  const cancelScheduledMutation = useMutation({
    mutationFn: async (campaignId) => {
      const res = await api.delete(`/newsletter/scheduled/${campaignId}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Scheduled newsletter cancelled!');
      queryClient.invalidateQueries(['newsletter-scheduled']);
      queryClient.invalidateQueries(['newsletter-campaigns']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error cancelling scheduled newsletter');
    }
  });

  // Unsubscribe mutation (optional)
  const unsubscribeMutation = useMutation({
    mutationFn: async (email) => {
      const res = await api.post('/newsletter/unsubscribe', { email });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['newsletter-subscribers']);
      toast.success('Subscriber removed');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error unsubscribing');
    }
  });

  // Handlers
  const handleSendNewsletter = (e, htmlContent) => {
    e.preventDefault();
    sendNewsletterMutation.mutate({ subject, message, html: htmlContent, scheduledAt });
  };

  const handleCancelScheduled = (campaignId) => {
    if (window.confirm('Cancel this scheduled newsletter?')) {
      cancelScheduledMutation.mutate(campaignId);
    }
  };

  const handleUnsubscribe = (email) => {
    if (window.confirm('Remove this subscriber?')) {
      unsubscribeMutation.mutate(email);
    }
  };

  return {
    // State
    subject,
    setSubject,
    message,
    setMessage,
    html,
    setHtml,
    scheduledAt,
    setScheduledAt,
    // Data
    subscribers,
    loadingSubscribers,
    subscribersError,
    campaigns: campaignData?.campaigns || [],
    campaignPagination: campaignData?.pagination,
    loadingCampaigns,
    campaignsError,
    scheduledCampaigns,
    loadingScheduled,
    scheduledError,
    campaignStats,
    loadingStats,
    statsError,
    // Actions
    handleSendNewsletter,
    handleCancelScheduled,
    handleUnsubscribe,
    sending: sendNewsletterMutation.isLoading,
    cancelling: cancelScheduledMutation.isLoading,
    unsubscribing: unsubscribeMutation.isLoading,
  };
}; 