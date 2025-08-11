import { format, formatDistanceToNow, isToday, parseISO } from 'date-fns';

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM dd, yyyy');
};

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm');
};

export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const isToday = (date: string | Date): boolean => {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  } catch (error) {
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
  switch (status) {
    case 'waiting':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'checked_in':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'in_service':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'completed':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'held':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'expired':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getPaymentStatusColor = (status: string): string => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'pay_at_clinic':
      return 'bg-blue-100 text-blue-800';
    case 'refunded':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};