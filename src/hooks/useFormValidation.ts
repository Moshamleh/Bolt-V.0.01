import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  min?: number;
  max?: number;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface FormValidationHook {
  errors: ValidationErrors;
  isValid: boolean;
  validateField: (name: string, value: any) => string | null;
  validateForm: (data: Record<string, any>) => boolean;
  clearError: (name: string) => void;
  clearAllErrors: () => void;
  setError: (name: string, error: string) => void;
}

export const useFormValidation = (rules: ValidationRules): FormValidationHook => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = useCallback((name: string, value: any): string | null => {
    const rule = rules[name];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return 'This field is required';
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && !value.trim())) {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      // Min length validation
      if (rule.minLength && value.length < rule.minLength) {
        return `Must be at least ${rule.minLength} characters`;
      }

      // Max length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        return `Must be no more than ${rule.maxLength} characters`;
      }

      // Email validation
      if (rule.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
      }

      // Phone validation
      if (rule.phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          return 'Please enter a valid phone number';
        }
      }

      // URL validation
      if (rule.url) {
        try {
          new URL(value);
        } catch {
          return 'Please enter a valid URL';
        }
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        return 'Please enter a valid format';
      }
    }

    // Number validations
    if (typeof value === 'number' || !isNaN(Number(value))) {
      const numValue = Number(value);
      
      if (rule.min !== undefined && numValue < rule.min) {
        return `Must be at least ${rule.min}`;
      }

      if (rule.max !== undefined && numValue > rule.max) {
        return `Must be no more than ${rule.max}`;
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [rules]);

  const validateForm = useCallback((data: Record<string, any>): boolean => {
    const newErrors: ValidationErrors = {};
    let isFormValid = true;

    Object.keys(rules).forEach(fieldName => {
      const error = validateField(fieldName, data[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isFormValid = false;
      }
    });

    setErrors(newErrors);
    return isFormValid;
  }, [rules, validateField]);

  const clearError = useCallback((name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const isValid = Object.keys(errors).length === 0;

  return {
    errors,
    isValid,
    validateField,
    validateForm,
    clearError,
    clearAllErrors,
    setError
  };
};