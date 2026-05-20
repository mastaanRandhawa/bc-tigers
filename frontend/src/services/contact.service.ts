import apiClient from '@/lib/api-client';
import type { ContactMessage } from '@/types';

export const contactService = {
  submit: (data: { name: string; email: string; subject: string; message: string }) =>
    apiClient.post<ContactMessage>('/contact', data),
  getAll: () => apiClient.get<ContactMessage[]>('/contact'),
  markRead: (id: string) => apiClient.patch<ContactMessage>(`/contact/${id}/read`),
};
