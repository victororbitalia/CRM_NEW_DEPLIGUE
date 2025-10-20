import { ReactNode, forwardRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'defaultValue'> {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  required?: boolean;
  showTime?: boolean;
  format?: string;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({
    className,
    label,
    error,
    helperText,
    placeholder = 'Seleccionar fecha',
    value,
    defaultValue,
    onChange,
    minDate,
    maxDate,
    disabled = false,
    required = false,
    showTime = false,
    format = 'dd/MM/yyyy',
    ...props
  }, ref) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(value || defaultValue || null);
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
      if (value !== undefined) {
        setSelectedDate(value);
      }
    }, [value]);

    useEffect(() => {
      if (selectedDate) {
        const formattedDate = formatDate(selectedDate, format);
        setInputValue(formattedDate);
      } else {
        setInputValue('');
      }
    }, [selectedDate, format]);

    const formatDate = (date: Date, formatString: string): string => {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      return formatString
        .replace('dd', day)
        .replace('MM', month)
        .replace('yyyy', year.toString())
        .replace('HH', hours)
        .replace('mm', minutes);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);

      // Try to parse the input value
      const parsedDate = parseDate(value, format);
      if (parsedDate) {
        setSelectedDate(parsedDate);
        if (onChange) {
          onChange(parsedDate);
        }
      }
    };

    const parseDate = (value: string, formatString: string): Date | null => {
      try {
        // Simple parsing for dd/MM/yyyy format
        if (formatString === 'dd/MM/yyyy') {
          const parts = value.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
            const year = parseInt(parts[2], 10);
            
            const date = new Date(year, month, day);
            if (
              date.getDate() === day &&
              date.getMonth() === month &&
              date.getFullYear() === year
            ) {
              return date;
            }
          }
        }
        return null;
      } catch {
        return null;
      }
    };

    const handleDateSelect = (date: Date) => {
      setSelectedDate(date);
      setIsOpen(false);
      if (onChange) {
        onChange(date);
      }
    };

    const handleClear = () => {
      setSelectedDate(null);
      setInputValue('');
      if (onChange) {
        onChange(null);
      }
    };

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
      }
    };

    const renderCalendar = () => {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(<div key={`empty-${i}`} className="p-2"></div>);
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isSelected = selectedDate && 
          selectedDate.getDate() === day &&
          selectedDate.getMonth() === month &&
          selectedDate.getFullYear() === year;
        
        const isToday = new Date().getDate() === day &&
          new Date().getMonth() === month &&
          new Date().getFullYear() === year;
        
        const isDisabled = (minDate && date < minDate) || (maxDate && date > maxDate);

        days.push(
          <button
            key={day}
            type="button"
            className={cn(
              'p-2 rounded-md text-sm font-medium',
              isSelected && 'bg-primary-600 text-white',
              isToday && !isSelected && 'bg-primary-100 text-primary-700',
              !isSelected && !isToday && 'text-secondary-700 hover:bg-secondary-100',
              isDisabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => !isDisabled && handleDateSelect(date)}
            disabled={isDisabled}
          >
            {day}
          </button>
        );
      }

      return days;
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
      setCurrentMonth(prev => {
        const newMonth = new Date(prev);
        if (direction === 'prev') {
          newMonth.setMonth(prev.getMonth() - 1);
        } else {
          newMonth.setMonth(prev.getMonth() + 1);
        }
        return newMonth;
      });
    };

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <div className="relative">
            <input
              ref={ref}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                'block w-full rounded-lg border border-secondary-300 bg-white py-2 pl-3 pr-10 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
                error && 'border-error-300 focus:border-error-500 focus:ring-error-500',
                disabled && 'bg-secondary-100 cursor-not-allowed opacity-60',
                className
              )}
              onClick={handleToggle}
              {...props}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              {selectedDate && (
                <button
                  type="button"
                  className="mr-1 p-1 text-secondary-400 hover:text-secondary-600"
                  onClick={handleClear}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                className="p-1 text-secondary-400 hover:text-secondary-600"
                onClick={handleToggle}
                disabled={disabled}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {isOpen && (
            <div className="absolute z-20 mt-1 p-3 bg-white border border-secondary-200 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  className="p-1 rounded-md hover:bg-secondary-100"
                  onClick={() => navigateMonth('prev')}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-sm font-medium text-secondary-900">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </div>
                <button
                  type="button"
                  className="p-1 rounded-md hover:bg-secondary-100"
                  onClick={() => navigateMonth('next')}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map(day => (
                  <div key={day} className="p-2 text-center text-xs font-medium text-secondary-500">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>
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

DatePicker.displayName = 'DatePicker';

export default DatePicker;