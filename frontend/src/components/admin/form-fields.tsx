import { useState } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
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
  disabled?: boolean;
}

export function TextInputField<T extends FieldValues>({
  control,
  name,
  label,
  type = 'text',
  placeholder,
  className,
  disabled,
}: TextInputFieldProps<T>) {
  const InputComponent = type === 'password' ? PasswordInput : Input;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className={cn('space-y-1.5', className)}>
          <Label htmlFor={name}>{label}</Label>
          <InputComponent
            id={name}
            {...(type === 'password' ? {} : { type })}
            placeholder={placeholder}
            disabled={disabled}
            {...field}
            value={field.value ?? ''}
          />
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
          <Select
            value={field.value ?? ''}
            onValueChange={field.onChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options
                .filter((opt) => opt.value !== '')
                .map((opt) => (
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

interface SearchableSelectFieldProps<T extends FieldValues> extends FieldProps<T> {
  options: { value: string; label: string; description?: string }[];
  placeholder?: string;
}

export function SearchableSelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = 'Search...',
  className,
}: SearchableSelectFieldProps<T>) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected = options.find((opt) => opt.value === field.value);
        const filtered = options.filter((opt) => {
          const haystack = `${opt.label} ${opt.description ?? ''}`.toLowerCase();
          return haystack.includes(query.toLowerCase());
        });

        return (
          <div className={cn('space-y-1.5 relative', className)}>
            <Label htmlFor={name}>{label}</Label>
            <Input
              id={name}
              placeholder={selected ? selected.label : placeholder}
              value={open ? query : (selected?.label ?? '')}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
            />
            {open && filtered.length > 0 && (
              <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-popover shadow-md">
                {filtered.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        field.onChange(opt.value);
                        setQuery('');
                        setOpen(false);
                      }}
                    >
                      <span className="font-medium">{opt.label}</span>
                      {opt.description && (
                        <span className="block text-xs text-muted-foreground">{opt.description}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {fieldState.error && <p className="text-xs text-red-500">{fieldState.error.message}</p>}
          </div>
        );
      }}
    />
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{message}</div>
  );
}
