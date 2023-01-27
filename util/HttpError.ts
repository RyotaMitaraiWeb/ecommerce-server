/**
 * This class can be used in place of the standard ``Error`` constructor to throw errors.
 * It allows you to specify the status code of the error, allowing you to 
 * handle different types of errors within the same request
 * without resorting to complex error handling.
 * 
 * **Note:** this class cannot be used with Mongoose's built-in validations. For controllers
 * that may throw a validation error, you need to provide a "fallback" status code to the
 * response object when handling a possible error
 */
export class HttpError extends Error {
    constructor(message: string, status: number) {
        super(message)

        this.status = status;
        this.name = 'HttpError';
    }

    status: number;
    name: string;
}