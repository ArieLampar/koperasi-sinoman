import * as React from 'react'
import { useFormContext } from 'react-hook-form'
import { CalendarIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, parseCurrency } from '@/lib/form-validation'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from './form'
import { Input, PasswordInput, SearchInput } from './input'
import { Textarea } from './textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SearchableSelect, type Option } from './select'
import { Checkbox } from './checkbox'
import { RadioGroup, RadioGroupItem } from './radio-group'
import { Switch } from './switch'
import { Button } from './button'

// Base form field props
interface BaseFormFieldProps {
  name: string
  label?: string
  description?: string
  required?: boolean
  className?: string
}

// Text Input Field
export interface TextFieldProps extends BaseFormFieldProps {
  placeholder?: string
  type?: 'text' | 'email' | 'tel' | 'url'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  clearable?: boolean
}

export const TextField: React.FC<TextFieldProps> = ({
  name,
  label,
  description,
  required,
  placeholder,
  type = 'text',
  leftIcon,
  rightIcon,
  clearable,
  className,
}) => {
  const { setValue, watch } = useFormContext()
  const value = watch(name)

  const handleClear = () => {
    setValue(name, '')
  }

  return (
    <FormField name={name}>
      {({ field, error }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel required={required}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <Input
              {...field}
              type={type}
              placeholder={placeholder}
              leftIcon={leftIcon}
              rightIcon={rightIcon}
              clearable={clearable}
              onClear={handleClear}
              error={!!error}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    </FormField>
  )
}

// Password Field
export interface PasswordFieldProps extends BaseFormFieldProps {
  placeholder?: string
  showToggle?: boolean
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  name,
  label,
  description,
  required,
  placeholder,
  showToggle = true,
  className,
}) => {
  return (
    <FormField name={name}>
      {({ field, error }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel required={required}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <PasswordInput
              {...field}
              placeholder={placeholder}
              showToggle={showToggle}
              error={!!error}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    </FormField>
  )
}

// Search Field
export interface SearchFieldProps extends BaseFormFieldProps {
  placeholder?: string
}

export const SearchField: React.FC<SearchFieldProps> = ({
  name,
  label,
  description,
  placeholder = 'Search...',
  className,
}) => {
  const { setValue } = useFormContext()

  const handleClear = () => {
    setValue(name, '')
  }

  return (
    <FormField name={name}>
      {({ field, error }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <SearchInput
              {...field}
              placeholder={placeholder}
              onClear={handleClear}
              error={!!error}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    </FormField>
  )
}

// Textarea Field
export interface TextareaFieldProps extends BaseFormFieldProps {
  placeholder?: string
  rows?: number
  maxLength?: number
  showCount?: boolean
  autoResize?: boolean
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  name,
  label,
  description,
  required,
  placeholder,
  rows,
  maxLength,
  showCount = false,
  autoResize = false,
  className,
}) => {
  return (
    <FormField name={name}>
      {({ field, error }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel required={required}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <Textarea
              {...field}
              placeholder={placeholder}
              rows={rows}
              maxLength={maxLength}
              showCount={showCount}
              autoResize={autoResize}
              error={!!error}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    </FormField>
  )
}

// Select Field
export interface SelectFieldProps extends BaseFormFieldProps {
  placeholder?: string
  options: Option[]
  searchable?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
}

export const SelectField: React.FC<SelectFieldProps> = ({
  name,
  label,
  description,
  required,
  placeholder = 'Select an option...',
  options,
  searchable = false,
  searchPlaceholder = 'Search options...',
  emptyMessage = 'No options found.',
  className,
}) => {
  if (searchable) {
    return (
      <FormField name={name}>
        {({ field, error }) => (
          <FormItem className={className}>
            {label && (
              <FormLabel required={required}>
                {label}
              </FormLabel>
            )}
            <FormControl>
              <SearchableSelect
                options={options}
                value={field.value}
                onValueChange={field.onChange}
                placeholder={placeholder}
                searchPlaceholder={searchPlaceholder}
                emptyMessage={emptyMessage}
                error={!!error}
              />
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      </FormField>
    )
  }

  return (
    <FormField name={name}>
      {({ field, error }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel required={required}>
              {label}
            </FormLabel>
          )}
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger error={!!error}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    </FormField>
  )
}

// Currency Field
export interface CurrencyFieldProps extends BaseFormFieldProps {
  placeholder?: string
  min?: number
  max?: number
}

export const CurrencyField: React.FC<CurrencyFieldProps> = ({
  name,
  label,
  description,
  required,
  placeholder = '0',
  min = 0,
  max,
  className,
}) => {
  const { setValue, watch } = useFormContext()
  const value = watch(name)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseCurrency(e.target.value)
    if (max && numericValue > max) return
    if (numericValue < min) return
    setValue(name, numericValue)
  }

  const displayValue = value ? formatCurrency(value).replace('Rp', '').trim() : ''

  return (
    <FormField name={name}>
      {({ error }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel required={required}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                Rp
              </span>
              <Input
                type="text"
                value={displayValue}
                onChange={handleChange}
                placeholder={placeholder}
                className="pl-10"
                error={!!error}
              />
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    </FormField>
  )
}

// Checkbox Field
export interface CheckboxFieldProps extends BaseFormFieldProps {
  labelPosition?: 'left' | 'right'
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  name,
  label,
  description,
  labelPosition = 'right',
  className,
}) => {
  return (
    <FormField name={name}>
      {({ field, error }) => (
        <FormItem className={cn('flex flex-row items-start space-x-3 space-y-0', className)}>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              error={!!error}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            {label && <FormLabel>{label}</FormLabel>}
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormMessage />
        </FormItem>
      )}
    </FormField>
  )
}

// Radio Group Field
export interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface RadioGroupFieldProps extends BaseFormFieldProps {
  options: RadioOption[]
  orientation?: 'horizontal' | 'vertical'
}

export const RadioGroupField: React.FC<RadioGroupFieldProps> = ({
  name,
  label,
  description,
  required,
  options,
  orientation = 'vertical',
  className,
}) => {
  return (
    <FormField name={name}>
      {({ field, error }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel required={required}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className={cn(
                orientation === 'horizontal' && 'flex space-x-4'
              )}
            >
              {options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={`${name}-${option.value}`}
                    disabled={option.disabled}
                    error={!!error}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={`${name}-${option.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option.label}
                    </label>
                    {option.description && (
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    </FormField>
  )
}

// Switch Field
export interface SwitchFieldProps extends BaseFormFieldProps {
  labelPosition?: 'left' | 'right'
}

export const SwitchField: React.FC<SwitchFieldProps> = ({
  name,
  label,
  description,
  labelPosition = 'right',
  className,
}) => {
  return (
    <FormField name={name}>
      {({ field, error }) => (
        <FormItem className={cn('flex flex-row items-center justify-between rounded-lg border p-4', className)}>
          <div className="space-y-0.5">
            {label && <FormLabel className="text-base">{label}</FormLabel>}
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              error={!!error}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    </FormField>
  )
}

// Date Field (basic implementation - would need date picker component)
export interface DateFieldProps extends BaseFormFieldProps {
  placeholder?: string
  min?: string
  max?: string
}

export const DateField: React.FC<DateFieldProps> = ({
  name,
  label,
  description,
  required,
  placeholder,
  min,
  max,
  className,
}) => {
  return (
    <FormField name={name}>
      {({ field, error }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel required={required}>
              {label}
            </FormLabel>
          )}
          <FormControl>
            <Input
              {...field}
              type="date"
              placeholder={placeholder}
              min={min}
              max={max}
              error={!!error}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    </FormField>
  )
}