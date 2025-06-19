// src/hooks/useFormValidation.ts
import { useState, useCallback } from 'react';

type ValidationRule<T> = (value: unknown, allValues: T) => string | undefined;

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T>[];
};

interface UseFormValidationResult<T> {
  values: T;
  errors: Record<keyof T, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setFieldValue: (field: keyof T, value: T[keyof T]) => void;
  validate: () => boolean;
  touched: () => Record<keyof T, boolean>;
  reset: (newValues?: T) => void;
  setErrors: React.Dispatch<React.SetStateAction<Record<keyof T, string>>>;
}

export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  validationRules: ValidationRules<T>
): UseFormValidationResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string>>(() => {
    const initialErrors = {} as Record<keyof T, string>;
    (Object.keys(initialValues) as Array<keyof T>).forEach(key => {
      initialErrors[key] = '';
    });
    return initialErrors;
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const fieldName = name as keyof T;
    
    // Handle checkbox inputs
    const fieldValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : value;
    
    setValues(prev => ({
      ...prev,
      [fieldName]: fieldValue,
    }));
    
    // Clear error when user types
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: '',
      }));
    }
  }, [errors]);

  const setFieldValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when value is set programmatically
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  }, [errors]);

  const validate = useCallback(() => {
    const newErrors = {} as Record<keyof T, string>;
    let isValid = true;
    
    (Object.keys(validationRules) as Array<keyof T>).forEach(field => {
      const fieldRules = validationRules[field] || [];
      
      for (const rule of fieldRules) {
        const errorMessage = rule(values[field], values);
        if (errorMessage) {
          newErrors[field] = errorMessage;
          isValid = false;
          break;
        } else {
          newErrors[field] = '';
        }
      }
    });
    
    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);

  const reset = useCallback((newValues: T = initialValues) => {
    setValues(newValues);
    
    const resetErrors = {} as Record<keyof T, string>;
    (Object.keys(newValues) as Array<keyof T>).forEach(key => {
      resetErrors[key] = '';
    });
    setErrors(resetErrors);
  }, [initialValues]);

  return {
    values,
    errors,
    handleChange,
    setFieldValue,
    validate,
    touched: () => {
      const touchedFields = {} as Record<keyof T, boolean>;
      (Object.keys(values) as Array<keyof T>).forEach(key => {
        touchedFields[key] = !!values[key];
      });
      return touchedFields;
    },
    reset,
    setErrors,
  };
}

// Common validation rules
export const required = (fieldName: string) => 
  (value: unknown) => {
    if (value === undefined || value === null || value === '') {
      return `${fieldName} is required`;
    }
    return undefined;
  };

export const minLength = (fieldName: string, min: number) => 
  (value: string) => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return undefined;
  };

export const maxLength = (fieldName: string, max: number) => 
  (value: string) => {
    if (value && value.length > max) {
      return `${fieldName} must be no more than ${max} characters`;
    }
    return undefined;
  };

export const email = () => 
  (value: string) => {
    if (value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
      return 'Invalid email address';
    }
    return undefined;
  };

export const matchField = <T extends Record<string, unknown>>(fieldName: string, matchFieldName: keyof T, fieldLabel: string) => 
  (value: string, allValues: T) => {
    if (value !== allValues[matchFieldName]) {
      return `${fieldLabel} does not match`;
    }
    return undefined;
  };

export const numeric = (fieldName: string) => 
  (value: string) => {
    if (value && !/^\d+$/.test(value)) {
      return `${fieldName} must be a number`;
    }
    return undefined;
  };

export const phoneNumber = () => 
  (value: string) => {
    if (value && !/^\+?[\d\s-()]{7,}$/.test(value)) {
      return 'Invalid phone number';
    }
    return undefined;
  };