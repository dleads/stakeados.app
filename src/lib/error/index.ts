// Main error handling exports

export {
  StakeadosError,
  ErrorHandler,
  errorHandler,
  handleError,
  createError,
  withErrorHandling,
  withRetry,
  ERROR_CODES,
} from './errorHandler';

export {
  Web3ErrorHandler,
  WEB3_ERROR_CODES,
  handleWeb3Error,
  getWeb3RecoverySuggestions,
  withWeb3ErrorHandling,
} from './web3ErrorHandler';

export {
  ApiErrorHandler,
  apiRequest,
  handleSupabaseError,
} from './apiErrorHandler';

// export { useErrorRecovery } from '../hooks/useErrorRecovery'; // Hook no disponible

export type { ErrorContext } from './errorHandler';

export type { Web3ErrorContext } from './web3ErrorHandler';

export type { ApiErrorContext } from './apiErrorHandler';
