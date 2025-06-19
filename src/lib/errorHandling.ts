import { PostgrestError } from '@supabase/supabase-js';

/**
 * Extracts a user-friendly error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  // Handle Supabase PostgrestError
  if (isPostgrestError(error)) {
    return handlePostgrestError(error);
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Default fallback
  return 'An unexpected error occurred';
}

/**
 * Type guard for PostgrestError
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' && 
    error !== null && 
    'code' in error && 
    'message' in error &&
    'details' in error
  );
}

/**
 * Handles Supabase PostgrestError and returns user-friendly messages
 */
function handlePostgrestError(error: PostgrestError): string {
  const { code, message, details } = error;
  
  // Handle unique constraint violations
  if (code === '23505') {
    if (message.includes('profiles_username_key')) {
      return 'This username is already taken. Please choose another.';
    }
    if (message.includes('email')) {
      return 'This email is already registered.';
    }
    return 'A record with this information already exists.';
  }
  
  // Handle foreign key violations
  if (code === '23503') {
    return 'This operation cannot be completed because the record is referenced by another item.';
  }
  
  // Handle not-null constraint violations
  if (code === '23502') {
    const field = details.match(/column "([^"]+)"/)?.[1] || 'field';
    return `The ${field} is required.`;
  }
  
  // Handle check constraint violations
  if (code === '23514') {
    return 'The provided value does not meet the required conditions.';
  }
  
  // Handle invalid input syntax
  if (code === '22P02') {
    return 'Invalid input format.';
  }
  
  // JWT errors
  if (message.includes('JWT')) {
    return 'Your session has expired. Please log in again.';
  }
  
  // RLS policy violations
  if (code === '42501') {
    return 'You do not have permission to perform this action.';
  }
  
  // Return the original message if we don't have a specific handler
  return message;
}

/**
 * Formats validation errors for form display
 */
export function formatValidationErrors(errors: Record<string, string>): string {
  const errorMessages = Object.values(errors).filter(Boolean);
  if (errorMessages.length === 0) return '';
  
  if (errorMessages.length === 1) {
    return errorMessages[0];
  }
  
  return `Please fix the following errors:\n- ${errorMessages.join('\n- ')}`;
}