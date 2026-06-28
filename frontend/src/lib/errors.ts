import type { AxiosError } from 'axios';
import type { ApiError } from '@/types';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const axiosError = error as AxiosError<ApiError>;
  const message = axiosError.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string' && message.length > 0) return message;
  return fallback;
}
