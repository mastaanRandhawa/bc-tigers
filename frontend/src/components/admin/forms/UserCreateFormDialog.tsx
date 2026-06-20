import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FormDialog from '@/components/admin/FormDialog';
import { TextInputField, FormError } from '@/components/admin/form-fields';
import { userCreateSchema, type UserCreateFormValues } from '@/lib/schemas/admin';
import { useCreateUser } from '@/hooks/useUsers';
import { getApiErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';

interface UserCreateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserCreateFormDialog({ open, onOpenChange }: UserCreateFormDialogProps) {
  const createMutation = useCreateUser();

  const form = useForm<UserCreateFormValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone: '',
      });
    }
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
      });
      toast.success('User created.');
      onOpenChange(false);
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) });
    }
  });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add User"
      description="Create a new administrator account."
      onSubmit={onSubmit}
      isSubmitting={createMutation.isPending}
      submitLabel="Create user"
    >
      <FormError message={form.formState.errors.root?.message} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextInputField control={form.control} name="first_name" label="First name" />
        <TextInputField control={form.control} name="last_name" label="Last name" />
      </div>
      <TextInputField control={form.control} name="email" label="Email" type="email" />
      <TextInputField control={form.control} name="password" label="Password" type="password" />
      <TextInputField control={form.control} name="phone" label="Phone" />
    </FormDialog>
  );
}
