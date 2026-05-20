import type { AxiosError } from 'axios';
import type { ApiError } from '@/types';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const axiosError = error as AxiosError<ApiError>;
  return axiosError.response?.data?.message ?? fallback;
}
