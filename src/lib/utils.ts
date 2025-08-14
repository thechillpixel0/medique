import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const formatDate = (date: string | Date): string => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const formatTime = (date: string | Date): string => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'HH:mm');
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
};

export const formatRelativeTime = (date: string | Date): string => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid time';
  }
};

export const isToday = (date: string | Date): boolean => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error checking if date is today:', error);
    return false;
  }
};

export const generateUID = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `CLN1-${timestamp}${randomStr}`.toUpperCase();
};

export const estimateWaitTime = (position: number, avgServiceTime: number = 10): number => {
  return Math.max(0, position * avgServiceTime);
};

export const getStatusColor = (status: string): string => {
  const statusColors = {
    'waiting': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'checked_in': 'bg-blue-100 text-blue-800 border-blue-200',
    'in_service': 'bg-green-100 text-green-800 border-green-200',
    'completed': 'bg-gray-100 text-gray-800 border-gray-200',
    'held': 'bg-orange-100 text-orange-800 border-orange-200',
    'expired': 'bg-red-100 text-red-800 border-red-200',
  };
  
  return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getPaymentStatusColor = (status: string): string => {
  const paymentColors = {
    'paid': 'bg-green-100 text-green-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'pay_at_clinic': 'bg-blue-100 text-blue-800',
    'refunded': 'bg-red-100 text-red-800',
  };
  
  return paymentColors[status as keyof typeof paymentColors] || 'bg-gray-100 text-gray-800';
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const result = document.execCommand('copy');
      textArea.remove();
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const downloadFile = (data: string, filename: string, type: string = 'text/plain') => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `₹${amount.toFixed(2)}`;
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const generateRandomColor = (): string => {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};