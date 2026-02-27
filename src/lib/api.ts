const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function getAccessToken(): Promise<string | null> {
  return localStorage.getItem('accessToken');
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.data?.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
      return data.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Token expired — try refresh
  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  const data = await res.json();

  if (!res.ok) {
    // Surface Zod validation detail messages when available
    const message =
      (data.details && Array.isArray(data.details) && data.details.length > 0
        ? data.details.map((d: string) => d.replace(/^[^:]+:\s*/, '')).join(' · ')
        : null) ||
      data.error ||
      'Something went wrong';
    throw new ApiError(message, res.status, data.code);
  }

  return data;
}

// File upload helper (no Content-Type header — browser sets boundary)
async function uploadFiles<T>(
  endpoint: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(data.error || 'Upload failed', res.status, data.code);
  }
  return data;
}

/* ─── Auth ─── */
export const authApi = {
  register: (body: { email: string; password: string; fullName: string; phone?: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  getMe: () => request('/auth/me'),

  verifyEmail: (token: string) =>
    request('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),

  forgotPassword: (email: string) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (token: string, password: string) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
};

/* ─── Products ─── */
export const productsApi = {
  list: (params?: Record<string, string | number | undefined>) => {
    const filtered: Record<string, string> = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) filtered[k] = String(v);
      }
    }
    const qs = Object.keys(filtered).length ? '?' + new URLSearchParams(filtered).toString() : '';
    return request(`/products${qs}`);
  },

  // Alias used by components
  getAll: (params?: Record<string, string | number | undefined>) =>
    productsApi.list(params),

  getBySlug: (slug: string) => request(`/products/${slug}`),

  getFeatured: () => request('/products/featured'),

  getCategoryCounts: () => request('/products/category-counts'),

  getCategories: () => request('/products/categories'),

  getBrands: () => request('/products/brands'),

  searchAutocomplete: (q: string) => request(`/products/search/autocomplete?q=${encodeURIComponent(q)}`),

  getRelated: (slug: string) => request(`/products/${slug}/related`),
};

/* ─── Cart ─── */
export const cartApi = {
  get: () => request('/cart'),

  addItem: (productId: string, quantity: number, variantId?: string) =>
    request('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, variantId }),
    }),

  updateItem: (itemId: string, quantity: number) =>
    request(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),

  removeItem: (itemId: string) =>
    request(`/cart/items/${itemId}`, { method: 'DELETE' }),

  clear: () => request('/cart', { method: 'DELETE' }),
};

/* ─── Orders ─── */
export const ordersApi = {
  create: (body: { addressId: string; paymentMethod: string; couponCode?: string; notes?: string }) =>
    request('/orders', { method: 'POST', body: JSON.stringify(body) }),

  createGuest: (body: {
    contact: { name: string; email: string; phone: string };
    address: { addressLine1: string; addressLine2?: string; city: string; state: string; pincode: string };
    items: { productId: string; variantId?: string; quantity: number }[];
    paymentMethod: string;
    couponCode?: string;
    notes?: string;
  }) => request('/orders/guest', { method: 'POST', body: JSON.stringify(body) }),

  // Razorpay Magic Checkout (1CC) — no address needed upfront
  razorpayCheckout: (body: { couponCode?: string; notes?: string }) =>
    request('/orders/razorpay-checkout', { method: 'POST', body: JSON.stringify(body) }),

  guestRazorpayCheckout: (body: {
    items: { productId: string; variantId?: string; quantity: number }[];
    couponCode?: string;
    notes?: string;
  }) => request('/orders/guest/razorpay-checkout', { method: 'POST', body: JSON.stringify(body) }),

  verify1CCPayment: (body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    request('/orders/verify-1cc-payment', { method: 'POST', body: JSON.stringify(body) }),

  verifyGuest1CCPayment: (body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    request('/orders/guest/verify-1cc-payment', { method: 'POST', body: JSON.stringify(body) }),

  verifyGuestPayment: (body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    request('/orders/guest/verify-payment', { method: 'POST', body: JSON.stringify(body) }),

  verifyPayment: (body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    request('/orders/verify-payment', { method: 'POST', body: JSON.stringify(body) }),

  validateCoupon: (couponCode: string, subtotal: number) =>
    request('/orders/validate-coupon', { method: 'POST', body: JSON.stringify({ couponCode, subtotal }) }),

  applyCoupon: (couponCode: string, subtotal?: number) =>
    request('/orders/validate-coupon', { method: 'POST', body: JSON.stringify({ couponCode, subtotal }) }),

  getAll: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/orders${qs}`);
  },

  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/orders${qs}`);
  },

  getById: (id: string) => request(`/orders/${id}`),

  cancel: (id: string) => request(`/orders/${id}/cancel`, { method: 'PUT' }),

  track: (orderNumber: string, email: string) =>
    request(`/orders/track/${encodeURIComponent(orderNumber)}?email=${encodeURIComponent(email)}`),
};

/* ─── User ─── */
export const userApi = {
  getProfile: () => request('/users/profile'),

  updateProfile: (body: { fullName?: string; phone?: string }) =>
    request('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  getAddresses: () => request('/users/addresses'),

  addAddress: (body: Record<string, unknown>) =>
    request('/users/addresses', { method: 'POST', body: JSON.stringify(body) }),

  updateAddress: (id: string, body: Record<string, unknown>) =>
    request(`/users/addresses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteAddress: (id: string) =>
    request(`/users/addresses/${id}`, { method: 'DELETE' }),

  getWishlist: () => request('/users/wishlist'),

  addToWishlist: (productId: string) =>
    request(`/users/wishlist/${productId}`, { method: 'POST' }),

  removeFromWishlist: (productId: string) =>
    request(`/users/wishlist/${productId}`, { method: 'DELETE' }),
};

/* ─── Blog ─── */
export const blogApi = {
  getAll: (params?: Record<string, string | undefined>) => {
    const filtered = params
      ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][])
      : undefined;
    const qs = filtered && Object.keys(filtered).length ? '?' + new URLSearchParams(filtered).toString() : '';
    return request(`/blog${qs}`);
  },

  list: (params?: Record<string, string | undefined>) => {
    const filtered = params
      ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][])
      : undefined;
    const qs = filtered && Object.keys(filtered).length ? '?' + new URLSearchParams(filtered).toString() : '';
    return request(`/blog${qs}`);
  },

  getBySlug: (slug: string) => request(`/blog/${slug}`),

  getCategories: () => request('/blog/categories'),
};

/* ─── Contact ─── */
export const contactApi = {
  submit: (body: { name: string; email: string; subject: string; message: string }) =>
    request('/contact', { method: 'POST', body: JSON.stringify(body) }),
};

/* ─── Newsletter ─── */
export const newsletterApi = {
  subscribe: (email: string) =>
    request('/admin/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }) }),
};

/* ─── Admin ─── */
export const adminApi = {
  // Dashboard
  getDashboard: () => request('/admin/dashboard'),

  // Orders
  getOrders: (params?: Record<string, string | number | undefined>) => {
    const filtered: Record<string, string> = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && String(v) !== '') filtered[k] = String(v);
      }
    }
    const qs = Object.keys(filtered).length ? '?' + new URLSearchParams(filtered).toString() : '';
    return request(`/admin/orders${qs}`);
  },

  updateOrderStatus: (id: string, orderStatus: string, trackingNumber?: string) =>
    request(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ orderStatus, ...(trackingNumber ? { trackingNumber } : {}) }),
    }),

  // Customers
  getCustomers: (params?: Record<string, string | number | undefined>) => {
    const filtered: Record<string, string> = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && String(v) !== '') filtered[k] = String(v);
      }
    }
    const qs = Object.keys(filtered).length ? '?' + new URLSearchParams(filtered).toString() : '';
    return request(`/admin/customers${qs}`);
  },

  // Products (admin CRUD)
  createProduct: (body: Record<string, unknown>) =>
    request('/products', { method: 'POST', body: JSON.stringify(body) }),

  updateProduct: (id: string, body: Record<string, unknown>) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteProduct: (id: string) =>
    request(`/products/${id}`, { method: 'DELETE' }),

  uploadImages: (id: string, formData: FormData) =>
    uploadFiles(`/products/${id}/images`, formData),

  deleteImage: (id: string, imageId: string) =>
    request(`/products/${id}/images/${imageId}`, { method: 'DELETE' }),

  setPrimaryImage: (id: string, imageId: string) =>
    request(`/products/${id}/images/${imageId}/primary`, { method: 'PUT' }),

  autofill: (productName: string) =>
    request('/products/autofill', { method: 'POST', body: JSON.stringify({ productName }) }),

  // Categories (dynamic DB-driven)
  getCategories: () => request('/admin/categories'),
  createCategory: (body: Record<string, unknown>) =>
    request('/admin/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id: string, body: Record<string, unknown>) =>
    request(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategory: (id: string) =>
    request(`/admin/categories/${id}`, { method: 'DELETE' }),

  // Coupons
  getCoupons: () => request('/admin/coupons'),
  createCoupon: (body: Record<string, unknown>) =>
    request('/admin/coupons', { method: 'POST', body: JSON.stringify(body) }),
  toggleCoupon: (id: string) =>
    request(`/admin/coupons/${id}/toggle`, { method: 'PUT' }),
  deleteCoupon: (id: string) =>
    request(`/admin/coupons/${id}`, { method: 'DELETE' }),

  // Blog (admin)
  getBlogPosts: () => request('/blog/admin/all'),
  createBlogPost: (body: Record<string, unknown>) =>
    request('/blog/admin', { method: 'POST', body: JSON.stringify(body) }),
  updateBlogPost: (id: string, body: Record<string, unknown>) =>
    request(`/blog/admin/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBlogPost: (id: string) =>
    request(`/blog/admin/${id}`, { method: 'DELETE' }),

  // Visitor analytics
  getVisitorStats: (days = 30) => request(`/admin/visitors?days=${days}`),
};

/* ─── Visitor Tracking ─── */
export const visitorApi = {
  track: (page: string, sessionId: string, referrer?: string) =>
    request('/visitors/track', {
      method: 'POST',
      body: JSON.stringify({ page, sessionId, referrer }),
    }).catch(() => {}), // silently fail
};

export { ApiError, uploadFiles };
export type { ApiResponse };
