import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface FieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  className?: string;
}

interface TextInputFieldProps<T extends FieldValues> extends FieldProps<T> {
  type?: string;
  placeholder?: string;
}

export function TextInputField<T extends FieldValues>({
  control,
  name,
  label,
  type = 'text',
  placeholder,
  className,
}: TextInputFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={cn('space-y-1.5', className)}>
          <Label htmlFor={name}>{label}</Label>
          <Input id={name} type={type} placeholder={placeholder} {...field} value={field.value ?? ''} />
          {fieldState.error && <p className="text-xs text-red-500">{fieldState.error.message}</p>}
        </div>
      )}
    />
  );
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  className,
}: TextInputFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={cn('space-y-1.5', className)}>
          <Label htmlFor={name}>{label}</Label>
          <Textarea id={name} placeholder={placeholder} {...field} value={field.value ?? ''} />
          {fieldState.error && <p className="text-xs text-red-500">{fieldState.error.message}</p>}
        </div>
      )}
    />
  );
}

interface SelectFieldProps<T extends FieldValues> extends FieldProps<T> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = 'Select...',
  className,
}: SelectFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={cn('space-y-1.5', className)}>
          <Label>{label}</Label>
          <Select value={field.value ?? ''} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldState.error && <p className="text-xs text-red-500">{fieldState.error.message}</p>}
        </div>
      )}
    />
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{message}</div>
  );
}
