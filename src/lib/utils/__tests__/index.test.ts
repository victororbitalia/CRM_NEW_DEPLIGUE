import {
  cn,
  formatDate,
  formatTime,
  isValidEmail,
  isValidPhone,
  generateId,
  getTimeDifference,
  isWithinOperatingHours,
  debounce,
  formatCurrency,
  getStatusColor,
  getStatusText,
  getLocationText,
  getRoleText,
} from '../index'

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
    })

    it('should handle conditional classes', () => {
      expect(cn('px-4', false && 'py-2', 'bg-red-500')).toBe('px-4 bg-red-500')
    })

    it('should handle undefined values', () => {
      expect(cn('px-4', undefined, 'py-2')).toBe('px-4 py-2')
    })
  })

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const date = '2023-12-01'
      expect(formatDate(date)).toBe('01/12/2023')
    })

    it('should format Date object correctly', () => {
      const date = new Date(2023, 11, 1) // December 1, 2023
      expect(formatDate(date)).toBe('01/12/2023')
    })

    it('should accept custom options', () => {
      const date = '2023-12-01'
      expect(formatDate(date, { year: '2-digit' })).toMatch('/23')
    })
  })

  describe('formatTime', () => {
    it('should format 24-hour time to 12-hour format', () => {
      expect(formatTime('14:30')).toBe('2:30 PM')
    })

    it('should handle morning times', () => {
      expect(formatTime('09:15')).toBe('9:15 AM')
    })

    it('should handle midnight', () => {
      expect(formatTime('00:00')).toBe('12:00 AM')
    })

    it('should handle noon', () => {
      expect(formatTime('12:00')).toBe('12:00 PM')
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('test@example')).toBe(false)
      expect(isValidEmail('test@.com')).toBe(false)
      expect(isValidEmail('test@example.')).toBe(false)
      expect(isValidEmail('testexample.com')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('should validate correct Spanish phone numbers', () => {
      expect(isValidPhone('600123456')).toBe(true)
      expect(isValidPhone('+34600123456')).toBe(true)
      expect(isValidPhone('0034600123456')).toBe(true)
      expect(isValidPhone('700123456')).toBe(true)
      expect(isValidPhone('800123456')).toBe(true)
      expect(isValidPhone('900123456')).toBe(true)
    })

    it('should validate phone numbers with spaces', () => {
      expect(isValidPhone('600 123 456')).toBe(true)
      expect(isValidPhone('+34 600 123 456')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('500123456')).toBe(false)
      expect(isValidPhone('12345678')).toBe(false)
      expect(isValidPhone('60012345')).toBe(false)
      expect(isValidPhone('6001234567')).toBe(false)
      expect(isValidPhone('')).toBe(false)
    })
  })

  describe('generateId', () => {
    it('should generate a unique ID', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('should generate a string ID', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
    })

    it('should generate a reasonable length ID', () => {
      const id = generateId()
      expect(id.length).toBeGreaterThan(10)
      expect(id.length).toBeLessThan(30)
    })
  })

  describe('getTimeDifference', () => {
    it('should calculate time difference correctly', () => {
      expect(getTimeDifference('09:00', '10:30')).toBe(90)
      expect(getTimeDifference('14:00', '16:00')).toBe(120)
    })

    it('should handle same time', () => {
      expect(getTimeDifference('12:00', '12:00')).toBe(0)
    })

    it('should handle negative difference', () => {
      expect(getTimeDifference('16:00', '14:00')).toBe(-120)
    })
  })

  describe('isWithinOperatingHours', () => {
    it('should check if time is within operating hours', () => {
      expect(isWithinOperatingHours('10:00', '09:00', '22:00')).toBe(true)
      expect(isWithinOperatingHours('09:00', '09:00', '22:00')).toBe(true)
      expect(isWithinOperatingHours('22:00', '09:00', '22:00')).toBe(true)
    })

    it('should check if time is outside operating hours', () => {
      expect(isWithinOperatingHours('08:59', '09:00', '22:00')).toBe(false)
      expect(isWithinOperatingHours('22:01', '09:00', '22:00')).toBe(false)
    })
  })

  describe('debounce', () => {
    jest.useFakeTimers()

    it('should delay function execution', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should cancel previous call if called again within delay', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      jest.advanceTimersByTime(50)
      debouncedFn()
      jest.advanceTimersByTime(50)

      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(50)
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    afterEach(() => {
      jest.clearAllTimers()
    })
  })

  describe('formatCurrency', () => {
    it('should format currency in EUR', () => {
      expect(formatCurrency(100)).toBe('100,00 €')
      expect(formatCurrency(0)).toBe('0,00 €')
      expect(formatCurrency(1234.56)).toBe('1.234,56 €')
    })
  })

  describe('getStatusColor', () => {
    it('should return correct color for reservation statuses', () => {
      expect(getStatusColor('CONFIRMED')).toBe('success')
      expect(getStatusColor('PENDING')).toBe('warning')
      expect(getStatusColor('CANCELLED')).toBe('error')
      expect(getStatusColor('NO_SHOW')).toBe('error')
      expect(getStatusColor('SEATED')).toBe('secondary')
      expect(getStatusColor('COMPLETED')).toBe('secondary')
    })

    it('should return correct color for table statuses', () => {
      expect(getStatusColor('AVAILABLE')).toBe('success')
      expect(getStatusColor('OCCUPIED')).toBe('secondary')
      expect(getStatusColor('RESERVED')).toBe('secondary')
      expect(getStatusColor('MAINTENANCE')).toBe('error')
    })

    it('should return secondary for unknown status', () => {
      expect(getStatusColor('UNKNOWN')).toBe('secondary')
    })
  })

  describe('getStatusText', () => {
    it('should return Spanish text for reservation statuses', () => {
      expect(getStatusText('CONFIRMED')).toBe('Confirmada')
      expect(getStatusText('PENDING')).toBe('Pendiente')
      expect(getStatusText('CANCELLED')).toBe('Cancelada')
      expect(getStatusText('NO_SHOW')).toBe('No presentado')
      expect(getStatusText('SEATED')).toBe('Sentado')
      expect(getStatusText('COMPLETED')).toBe('Completada')
    })

    it('should return Spanish text for table statuses', () => {
      expect(getStatusText('AVAILABLE')).toBe('Disponible')
      expect(getStatusText('OCCUPIED')).toBe('Ocupada')
      expect(getStatusText('RESERVED')).toBe('Reservada')
      expect(getStatusText('MAINTENANCE')).toBe('Mantenimiento')
    })

    it('should return original text for unknown status', () => {
      expect(getStatusText('UNKNOWN')).toBe('UNKNOWN')
    })
  })

  describe('getLocationText', () => {
    it('should return Spanish text for locations', () => {
      expect(getLocationText('INTERIOR')).toBe('Interior')
      expect(getLocationText('EXTERIOR')).toBe('Exterior')
      expect(getLocationText('TERRACE')).toBe('Terraza')
      expect(getLocationText('PRIVATE')).toBe('Privado')
    })

    it('should return original text for unknown location', () => {
      expect(getLocationText('UNKNOWN')).toBe('UNKNOWN')
    })
  })

  describe('getRoleText', () => {
    it('should return Spanish text for roles', () => {
      expect(getRoleText('ADMIN')).toBe('Administrador')
      expect(getRoleText('MANAGER')).toBe('Gerente')
      expect(getRoleText('STAFF')).toBe('Personal')
    })

    it('should return original text for unknown role', () => {
      expect(getRoleText('UNKNOWN')).toBe('UNKNOWN')
    })
  })
})