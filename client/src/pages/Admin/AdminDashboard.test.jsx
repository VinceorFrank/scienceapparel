import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";

// Mock the SalesChart component that's causing network errors
vi.mock("./components/SalesChart", () => ({
  default: () => <div data-testid="sales-chart">Sales Chart Component</div>
}));

// Mock the RevenueChart component
vi.mock("./components/RevenueChart", () => ({
  default: () => <div data-testid="revenue-chart">Revenue Chart Component</div>
}));

// Mock the InsightsCharts component
vi.mock("./components/InsightsCharts", () => ({
  default: () => <div data-testid="insights-charts">Insights Charts Component</div>
}));

// Mock the DashboardMetrics component
vi.mock("../../components/DashboardMetrics", () => ({
  default: () => (
    <div data-testid="dashboard-metrics">
      <div>Total Sales: $15,000</div>
      <div>Total Orders: 45</div>
      <div>Total Products: 120</div>
      <div>Total Customers: 89</div>
    </div>
  )
}));

// Mock the API calls
vi.mock("../../api/dashboard", () => ({
  fetchDashboardMetrics: vi.fn(() => Promise.resolve({
    overview: {
      sales: 15000,
      orders: 45,
      products: 120,
      customers: 89
    },
    recentOrders: [],
    lowStockProducts: []
  })),
  fetchSalesMetrics: vi.fn(() => Promise.resolve([])),
  fetchRecentOrders: vi.fn(() => Promise.resolve([])),
  fetchStockAlerts: vi.fn(() => Promise.resolve([])),
  fetchCustomerActivity: vi.fn(() => Promise.resolve({ users: 89, orders: 45 }))
}));

// Mock React Query
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(({ queryKey, queryFn }) => {
    if (queryKey[0] === 'dashboardMetrics') {
      return {
        data: {
          overview: {
            sales: 15000,
            orders: 45,
            products: 120,
            customers: 89
          },
          recentOrders: [],
          lowStockProducts: []
        },
        isLoading: false,
        error: null
      };
    }
    if (queryKey[0] === 'recentOrders') {
      return {
        data: [],
        isLoading: false,
        error: null
      };
    }
    if (queryKey[0] === 'stockAlerts') {
      return {
        data: [],
        isLoading: false,
        error: null
      };
    }
    if (queryKey[0] === 'customerActivity') {
      return {
        data: { users: 89, orders: 45 },
        isLoading: false,
        error: null
      };
    }
    return {
      data: null,
      isLoading: false,
      error: null
    };
  })
}));

// Mock the hooks
vi.mock("../../hooks/useDashboardMetrics.js", () => ({
  useDashboardMetrics: () => ({
    data: {
      totalSales: 15000,
      totalOrders: 45,
      totalProducts: 120,
      totalCustomers: 89
    },
    isLoading: false,
    error: null,
    refetch: vi.fn()
  })
}));

vi.mock("../../hooks/useProductManagement.jsx", () => ({
  useProductManagement: () => ({
    handleCreate: vi.fn()
  })
}));

vi.mock("../../hooks/useUserManagement.js", () => ({
  default: () => ({
    users: [],
    isLoading: false,
    error: null
  })
}));

vi.mock("../../hooks/useOrderManagement.js", () => ({
  default: () => ({
    orders: [],
    isLoading: false,
    error: null
  })
}));

// Mock the auth context
const mockAuthContext = {
  user: { role: "admin", email: "admin@test.com" },
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn()
};

// Mock the auth context provider
vi.mock("../../utils/auth", () => ({
  useAuth: () => mockAuthContext
}));

// Mock the language hook
vi.mock("../../utils/lang", () => ({
  useLang: () => ({
    t: (key) => {
      // Return appropriate translations for testing
      const translations = {
        dashboard: "dashboard",
        lastUpdated: "lastUpdated",
        refresh: "refresh",
        refreshing: "refreshing",
        totalSales: "Total Sales",
        totalOrders: "Total Orders",
        totalProducts: "Total Products",
        totalCustomers: "Total Customers"
      };
      return translations[key] || key;
    },
    lang: 'en'
  })
}));

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

describe("AdminDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders admin dashboard with title", async () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // The component shows "dashboard" (lowercase) from translation
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it("displays dashboard metrics", async () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // Check for the mocked DashboardMetrics component
    expect(screen.getByTestId("dashboard-metrics")).toBeInTheDocument();
    
    // Check for the metrics text from the mocked component
    expect(screen.getByText(/Total Sales: \$15,000/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Orders: 45/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Products: 120/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Customers: 89/i)).toBeInTheDocument();
  });

  it("displays quick actions section", () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    expect(screen.getByText("Access frequently used admin functions")).toBeInTheDocument();
  });

  it("displays tab navigation", () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Advanced Analytics")).toBeInTheDocument();
    expect(screen.getByText("Business Insights")).toBeInTheDocument();
  });
});
