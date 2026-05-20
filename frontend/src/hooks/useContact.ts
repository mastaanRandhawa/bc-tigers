import { useMutation } from '@tanstack/react-query';
import { contactService } from '@/services/contact.service';

export function useSubmitContact() {
  return useMutation({
    mutationFn: (data: { name: string; email: string; subject: string; message: string }) =>
      contactService.submit(data),
  });
}
