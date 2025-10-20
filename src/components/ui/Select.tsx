import { ReactNode, forwardRef, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  onSearch?: (query: string) => void;
  onChange?: (value: string | number) => void;
  value?: string | number;
  defaultValue?: string | number;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    label,
    options,
    error,
    helperText,
    placeholder = 'Seleccionar una opción',
    searchable = false,
    clearable = false,
    loading = false,
    onSearch,
    onChange,
    value,
    defaultValue,
    disabled,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedValue, setSelectedValue] = useState<string | number | undefined>(value || defaultValue);
    const selectRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(value);
      }
    }, [value]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
        if (!isOpen && searchable && inputRef.current) {
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      }
    };

    const handleSelectOption = (optionValue: string | number) => {
      setSelectedValue(optionValue);
      setIsOpen(false);
      setSearchQuery('');
      if (onChange) {
        onChange(optionValue);
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedValue(undefined);
      if (onChange) {
        onChange('');
      }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);
      if (onSearch) {
        onSearch(query);
      }
    };

    const filteredOptions = searchable
      ? options.filter(option =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

    const selectedOption = options.find(option => option.value === selectedValue);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {label}
          </label>
        )}
        <div ref={selectRef} className="relative">
          <button
            type="button"
            className={cn(
              'relative w-full cursor-default rounded-lg border border-secondary-300 bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm',
              error && 'border-error-300 focus:border-error-500 focus:ring-error-500',
              disabled && 'bg-secondary-100 cursor-not-allowed opacity-60',
              className
            )}
            onClick={handleToggle}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-labelledby="listbox-label"
          >
            <span className="flex items-center">
              {selectedOption?.icon && (
                <span className="mr-2 flex-shrink-0">{selectedOption.icon}</span>
              )}
              <span className={cn('block truncate', !selectedValue && 'text-secondary-400')}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-secondary-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className={cn('h-5 w-5 text-secondary-400 transition-transform', isOpen && 'rotate-180')}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </span>
            {clearable && selectedValue && !disabled && (
              <button
                type="button"
                className="absolute inset-y-0 right-8 flex items-center pr-2 text-secondary-400 hover:text-secondary-600"
                onClick={handleClear}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base text-gray-900 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {searchable && (
                <div className="px-3 py-2">
                  <input
                    ref={inputRef}
                    type="text"
                    className="block w-full rounded-md border-secondary-300 shadow-sm text-gray-900 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              {filteredOptions.length === 0 ? (
                <div className="relative cursor-default select-none py-2 px-3 text-secondary-500">
                  No hay resultados
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <li
                    key={option.value}
                    className={cn(
                      'relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-primary-50 hover:text-primary-900',
                      option.value === selectedValue && 'bg-primary-100 text-primary-900',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => !option.disabled && handleSelectOption(option.value)}
                  >
                    <div className="flex items-center">
                      {option.icon && (
                        <span className="mr-2 flex-shrink-0">{option.icon}</span>
                      )}
                      <span className={cn('block truncate', option.value === selectedValue && 'font-semibold')}>
                        {option.label}
                      </span>
                    </div>
                    {option.value === selectedValue && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </li>
                ))
              )}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-error-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-secondary-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;