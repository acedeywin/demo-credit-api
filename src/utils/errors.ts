
export class ApplicationError extends Error {
    public code: number ;
    constructor(code: number, message: string, ...args: any) {
      super(...args);
      this.code = code;
      this.message = message;
    }
}

export class BadRequestError extends ApplicationError {
    constructor(message: string, ...args: any) {
      super(400, message, ...args);
    }
  }
  
  export class UnauthorizedError extends ApplicationError {
    constructor(message: string) {
      super(401, message);
    }
  }
  
  export class ForbiddenError extends ApplicationError {
    constructor(message: string, ...args: any) {
      super(403, message, args);
    }
  }
  
  export class NotFoundError extends ApplicationError {
    constructor(message: string) {
      super(404, message, arguments);
    }
  }
  
  export class MissingFieldError extends BadRequestError {
    constructor(fieldName: string, ...args: any) {
      super(`${fieldName} is required`, args);
    }
  }
  
  export class InternalError extends ApplicationError {
    constructor(message: string) {
      super(500, message, arguments);
    }
  }