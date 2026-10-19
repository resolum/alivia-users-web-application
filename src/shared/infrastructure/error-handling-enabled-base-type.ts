/**
 * Provides reusable HTTP error translation for infrastructure services.
 *
 * @remarks
 * This type is intended for `*-api` endpoint clients that integrate with
 * external systems from the infrastructure layer.
 */
export abstract class ErrorHandlingEnabledBaseType {
  /**
   * Creates an operation-specific HTTP error handler.
   * @param operation - Name of the failed operation.
   * @returns Function that transforms an HTTP error into a rejected promise.
   */
  protected handleError(operation: string) {
    return (error: unknown): never => {
      let errorMessage = operation;
      if (error instanceof Response) {
        if (error.status === 404) {
          errorMessage = `${operation}: Resource not found`;
        } else {
          errorMessage = `${operation}: ${error.status || 'Unexpected error'}`;
        }
      } else if (error instanceof TypeError) {
        // Network errors produce TypeError in fetch
        errorMessage = `${operation}: ${error.message}`;
      }
      throw new Error(errorMessage);
    };
  }
}