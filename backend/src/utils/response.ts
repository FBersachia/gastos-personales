export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any[];
  };
}

export function successResponse<T>(data: T, pagination?: any): SuccessResponse<T> {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return response;
}

export function errorResponse(
  message: string,
  code?: string,
  details?: any[]
): ErrorResponse {
  return {
    success: false,
    error: {
      message,
      code,
      details,
    },
  };
}
