import { useState, useCallback, useMemo } from 'react';

export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

export interface ValidationRules {
  [key: string]: ValidationRule[];
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface TouchedFields {
  [key: string]: boolean;
}

// Common validation rules
export const validators = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value) => value.trim().length > 0,
    message,
  }),
  
  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    validate: (value) => {
      if (!value.trim()) return true; // Allow empty - use required for that
      try {
        let urlToCheck = value.trim();
        if (!urlToCheck.startsWith('http://') && !urlToCheck.startsWith('https://')) {
          urlToCheck = 'https://' + urlToCheck;
        }
        new URL(urlToCheck);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),
  
  hexColor: (message = 'Please enter a valid hex color'): ValidationRule => ({
    validate: (value) => {
      if (!value.trim()) return true;
      return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value.trim());
    },
    message,
  }),
  
  youtubeUrl: (message = 'Please enter valid YouTube URLs'): ValidationRule => ({
    validate: (value) => {
      if (!value.trim()) return true;
      const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
      return regex.test(value);
    },
    message,
  }),
  
  minLines: (min: number, message?: string): ValidationRule => ({
    validate: (value) => {
      const lines = value.split('\n').filter(l => l.trim()).length;
      return lines >= min;
    },
    message: message || `Please enter at least ${min} line(s)`,
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => value.length <= max,
    message: message || `Maximum ${max} characters allowed`,
  }),
};

export function useValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  const validateField = useCallback((field: string, value: string): string => {
    const fieldRules = rules[field];
    if (!fieldRules) return '';

    for (const rule of fieldRules) {
      if (!rule.validate(value)) {
        return rule.message;
      }
    }
    return '';
  }, [rules]);

  const validate = useCallback((field: string, value: string) => {
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  }, [validateField]);

  const touch = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const validateAll = useCallback((values: { [key: string]: string }): boolean => {
    const newErrors: ValidationErrors = {};
    const newTouched: TouchedFields = {};
    let isValid = true;

    Object.keys(rules).forEach(field => {
      const value = values[field] || '';
      const error = validateField(field, value);
      newErrors[field] = error;
      newTouched[field] = true;
      if (error) isValid = false;
    });

    setErrors(newErrors);
    setTouched(newTouched);
    return isValid;
  }, [rules, validateField]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const getFieldState = useCallback((field: string) => ({
    error: touched[field] ? errors[field] : '',
    hasError: touched[field] && !!errors[field],
    isTouched: !!touched[field],
  }), [errors, touched]);

  return {
    errors,
    touched,
    validate,
    touch,
    validateAll,
    clearErrors,
    getFieldState,
  };
}
