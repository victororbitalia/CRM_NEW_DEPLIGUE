// Validation utilities for restaurant management

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface RestaurantValidationRules {
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  email: {
    required: boolean;
    pattern: RegExp;
  };
  phone: {
    required: boolean;
    pattern: RegExp;
  };
  address: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  city: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  website?: {
    required: boolean;
    pattern: RegExp;
  };
}

export interface OperatingHoursValidationRules {
  openTime: {
    required: boolean;
    pattern: RegExp;
  };
  closeTime: {
    required: boolean;
    pattern: RegExp;
  };
  timeOrder: {
    validate: (openTime: string, closeTime: string) => boolean;
  };
}

export interface AreaValidationRules {
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  maxCapacity: {
    required: boolean;
    min: number;
    max: number;
  };
}

export interface BusinessRuleValidationRules {
  name: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  ruleType: {
    required: boolean;
    allowedValues: string[];
  };
  conditions: {
    required: boolean;
    validateJSON: boolean;
  };
  actions: {
    required: boolean;
    validateJSON: boolean;
  };
  priority: {
    required: boolean;
    min: number;
    max: number;
  };
}

// Default validation rules
export const restaurantValidationRules: RestaurantValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  phone: {
    required: true,
    pattern: /^[6-9]\d{8}$/,
  },
  address: {
    required: true,
    minLength: 5,
    maxLength: 200,
  },
  city: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  website: {
    required: false,
    pattern: /^https?:\/\/.+/,
  },
};

export const operatingHoursValidationRules: OperatingHoursValidationRules = {
  openTime: {
    required: true,
    pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  closeTime: {
    required: true,
    pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  timeOrder: {
    validate: (openTime: string, closeTime: string): boolean => {
      const [openHour, openMin] = openTime.split(':').map(Number);
      const [closeHour, closeMin] = closeTime.split(':').map(Number);
      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;
      return closeMinutes > openMinutes;
    },
  },
};

export const areaValidationRules: AreaValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  maxCapacity: {
    required: true,
    min: 1,
    max: 500,
  },
};

export const businessRuleValidationRules: BusinessRuleValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  ruleType: {
    required: true,
    allowedValues: [
      'CANCELLATION_POLICY',
      'NO_SHOW_POLICY',
      'BOOKING_LIMITS',
      'RESERVATION_DURATION',
      'PAYMENT_POLICY',
      'CUSTOM',
    ],
  },
  conditions: {
    required: true,
    validateJSON: true,
  },
  actions: {
    required: true,
    validateJSON: true,
  },
  priority: {
    required: true,
    min: 0,
    max: 100,
  },
};

// Validation functions
export const validateRestaurant = (
  data: Record<string, any>,
  rules: RestaurantValidationRules = restaurantValidationRules
): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validate name
  if (rules.name.required && !data.name?.trim()) {
    errors.name = 'El nombre del restaurante es obligatorio';
  } else if (data.name && data.name.length < rules.name.minLength) {
    errors.name = `El nombre debe tener al menos ${rules.name.minLength} caracteres`;
  } else if (data.name && data.name.length > rules.name.maxLength) {
    errors.name = `El nombre no puede tener más de ${rules.name.maxLength} caracteres`;
  }

  // Validate email
  if (rules.email.required && !data.email?.trim()) {
    errors.email = 'El email es obligatorio';
  } else if (data.email && !rules.email.pattern.test(data.email)) {
    errors.email = 'El formato del email no es válido';
  }

  // Validate phone
  if (rules.phone.required && !data.phone?.trim()) {
    errors.phone = 'El teléfono es obligatorio';
  } else if (data.phone && !rules.phone.pattern.test(data.phone.replace(/\s/g, ''))) {
    errors.phone = 'El formato del teléfono no es válido (debe empezar con 6-9 y tener 9 dígitos)';
  }

  // Validate address
  if (rules.address.required && !data.address?.trim()) {
    errors.address = 'La dirección es obligatoria';
  } else if (data.address && data.address.length < rules.address.minLength) {
    errors.address = `La dirección debe tener al menos ${rules.address.minLength} caracteres`;
  } else if (data.address && data.address.length > rules.address.maxLength) {
    errors.address = `La dirección no puede tener más de ${rules.address.maxLength} caracteres`;
  }

  // Validate city
  if (rules.city.required && !data.city?.trim()) {
    errors.city = 'La ciudad es obligatoria';
  } else if (data.city && data.city.length < rules.city.minLength) {
    errors.city = `La ciudad debe tener al menos ${rules.city.minLength} caracteres`;
  } else if (data.city && data.city.length > rules.city.maxLength) {
    errors.city = `La ciudad no puede tener más de ${rules.city.maxLength} caracteres`;
  }

  // Validate website (optional)
  if (rules.website && data.website && data.website.trim()) {
    if (!rules.website.pattern.test(data.website)) {
      errors.website = 'El formato del sitio web no es válido (debe empezar con http:// o https://)';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateOperatingHours = (
  data: Record<string, any>,
  rules: OperatingHoursValidationRules = operatingHoursValidationRules
): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validate open time
  if (!data.isClosed) {
    if (rules.openTime.required && !data.openTime?.trim()) {
      errors.openTime = 'La hora de apertura es obligatoria';
    } else if (data.openTime && !rules.openTime.pattern.test(data.openTime)) {
      errors.openTime = 'El formato de la hora de apertura no es válido (HH:MM)';
    }

    // Validate close time
    if (rules.closeTime.required && !data.closeTime?.trim()) {
      errors.closeTime = 'La hora de cierre es obligatoria';
    } else if (data.closeTime && !rules.closeTime.pattern.test(data.closeTime)) {
      errors.closeTime = 'El formato de la hora de cierre no es válido (HH:MM)';
    }

    // Validate time order
    if (data.openTime && data.closeTime && 
        rules.openTime.pattern.test(data.openTime) && 
        rules.closeTime.pattern.test(data.closeTime)) {
      if (!rules.timeOrder.validate(data.openTime, data.closeTime)) {
        errors.timeOrder = 'La hora de cierre debe ser posterior a la hora de apertura';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateArea = (
  data: Record<string, any>,
  rules: AreaValidationRules = areaValidationRules
): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validate name
  if (rules.name.required && !data.name?.trim()) {
    errors.name = 'El nombre del área es obligatorio';
  } else if (data.name && data.name.length < rules.name.minLength) {
    errors.name = `El nombre debe tener al menos ${rules.name.minLength} caracteres`;
  } else if (data.name && data.name.length > rules.name.maxLength) {
    errors.name = `El nombre no puede tener más de ${rules.name.maxLength} caracteres`;
  }

  // Validate max capacity
  if (rules.maxCapacity.required && !data.maxCapacity) {
    errors.maxCapacity = 'La capacidad máxima es obligatoria';
  } else if (data.maxCapacity) {
    const capacity = Number(data.maxCapacity);
    if (isNaN(capacity)) {
      errors.maxCapacity = 'La capacidad máxima debe ser un número válido';
    } else if (capacity < rules.maxCapacity.min) {
      errors.maxCapacity = `La capacidad máxima debe ser al menos ${rules.maxCapacity.min}`;
    } else if (capacity > rules.maxCapacity.max) {
      errors.maxCapacity = `La capacidad máxima no puede ser mayor de ${rules.maxCapacity.max}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateBusinessRule = (
  data: Record<string, any>,
  rules: BusinessRuleValidationRules = businessRuleValidationRules
): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validate name
  if (rules.name.required && !data.name?.trim()) {
    errors.name = 'El nombre de la regla es obligatorio';
  } else if (data.name && data.name.length < rules.name.minLength) {
    errors.name = `El nombre debe tener al menos ${rules.name.minLength} caracteres`;
  } else if (data.name && data.name.length > rules.name.maxLength) {
    errors.name = `El nombre no puede tener más de ${rules.name.maxLength} caracteres`;
  }

  // Validate rule type
  if (rules.ruleType.required && !data.ruleType?.trim()) {
    errors.ruleType = 'El tipo de regla es obligatorio';
  } else if (data.ruleType && !rules.ruleType.allowedValues.includes(data.ruleType)) {
    errors.ruleType = `El tipo de regla debe ser uno de: ${rules.ruleType.allowedValues.join(', ')}`;
  }

  // Validate conditions (JSON)
  if (rules.conditions.required && !data.conditions?.trim()) {
    errors.conditions = 'Las condiciones son obligatorias';
  } else if (data.conditions && rules.conditions.validateJSON) {
    try {
      JSON.parse(data.conditions);
    } catch {
      errors.conditions = 'Las condiciones deben ser un JSON válido';
    }
  }

  // Validate actions (JSON)
  if (rules.actions.required && !data.actions?.trim()) {
    errors.actions = 'Las acciones son obligatorias';
  } else if (data.actions && rules.actions.validateJSON) {
    try {
      JSON.parse(data.actions);
    } catch {
      errors.actions = 'Las acciones deben ser un JSON válido';
    }
  }

  // Validate priority
  if (rules.priority.required && !data.priority) {
    errors.priority = 'La prioridad es obligatoria';
  } else if (data.priority) {
    const priority = Number(data.priority);
    if (isNaN(priority)) {
      errors.priority = 'La prioridad debe ser un número válido';
    } else if (priority < rules.priority.min) {
      errors.priority = `La prioridad debe ser al menos ${rules.priority.min}`;
    } else if (priority > rules.priority.max) {
      errors.priority = `La prioridad no puede ser mayor de ${rules.priority.max}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// Error handling utilities
export class ValidationError extends Error {
  public errors: Record<string, string>;

  constructor(message: string, errors: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export const handleValidationError = (
  validation: ValidationResult,
  customMessage?: string
): void => {
  if (!validation.isValid) {
    throw new ValidationError(
      customMessage || 'Error de validación',
      validation.errors
    );
  }
};

// Async error handling for API calls
export const handleApiError = (error: any): string => {
  if (error instanceof ValidationError) {
    return Object.values(error.errors).join(', ');
  }

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const { data } = error.response;
    return data.error || data.message || 'Error del servidor';
  } else if (error.request) {
    // The request was made but no response was received
    return 'Error de conexión. Por favor, verifica tu conexión a internet.';
  } else {
    // Something happened in setting up the request that triggered an Error
    return error.message || 'Error desconocido';
  }
};