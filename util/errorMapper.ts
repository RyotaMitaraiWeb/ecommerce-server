/**
 * This function transforms errors in a consistent format across different responses.
 * The error is most likely going to be an array with the errors, a standard error, or 
 * a Mongoose ValidationError error. In the event that it's none of those, it will return an array
 * that indicates that the request has failed (most likely).
 * Each element in the array has the format ``{ msg: 'some error message' }``
 */

export function mapErrors(err: any) {
    if (Array.isArray(err)) {
        return err;
    } else if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors);
        return errors.map(function (e: any) {
            return ({ msg: e.message })
        });
    } else if (typeof err.message === 'string') {
        return [{ msg: err.message }];
    } else {
        return [{ msg: 'Request failed' }];
    }
}