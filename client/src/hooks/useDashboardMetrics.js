import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardMetrics,
  fetchSalesMetrics,
  fetchRecentOrders,
  fetchStockAlerts,
  fetchCustomerActivity,
} from '../api/dashboard';

// Hook for all dashboard metrics
export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: fetchDashboardMetrics,
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

// Hook for sales metrics
export const useSalesMetrics = () => {
  return useQuery({
    queryKey: ['salesMetrics'],
    queryFn: fetchSalesMetrics,
    refetchInterval: 300000,
  });
};

// Hook for recent orders
export const useRecentOrders = () => {
  return useQuery({
    queryKey: ['recentOrders'],
    queryFn: fetchRecentOrders,
    refetchInterval: 300000,
  });
};

// Hook for stock alerts
export const useStockAlerts = () => {
  return useQuery({
    queryKey: ['stockAlerts'],
    queryFn: fetchStockAlerts,
    refetchInterval: 300000,
  });
};

// Hook for customer activity
export const useCustomerActivity = () => {
  return useQuery({
    queryKey: ['customerActivity'],
    queryFn: fetchCustomerActivity,
    refetchInterval: 300000,
  });
}; 