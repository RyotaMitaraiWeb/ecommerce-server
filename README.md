# Ecommerce server
Server for ecommerce application, written in Express and TypeScript.

## How to run
```bash
# install dependencies
npm install

# start with node
npm run start

# start with nodemon (you need to install nodemon globally or separately within the project)
npm run dev
```

To run tests:
```bash
npm run test
```
Set up the respective environment variables in a dedicated ``.env`` file.

Make sure to compile the TypeScript code before starting the server or tests.

This application runs on MongoDB.

## ``init``
This folder contains functions related to starting the application.

### ``db.ts``
Connects the application to the MongoDB database and configures Mongoose options.

### ``routes.ts``
Configures the routes that the application will be working with.

### ``app.ts``
#### start(app: Express, dbUrl: string): Promise<Express>
This initializes the Express server. The ``dbUrl`` parameter allows you to connect a different database for testing. The function returns the app, which allows you to pass it to ``supertest`` requests when testing.

## ``util``
This folder contains utility functions to make certain tasks easier

### **mapErrors(err: any)**
This function transforms errors in a consistent format across different responses. The error is most likely going to be an array with the errors, a standard error, or a Mongoose ValidationError error. In the event that it's none of those, it will return an array that indicates that the request has failed (most likely). Each element in the array has the following format:

```typescript
const arrayErrorElement = {
    msg: 'some error message'
}
```

### **HttpError**
``constructor(message: string, status: number)``
This class can be used instead of the standard ``Error`` constructor to throw errors. It allows you to define a status code, allowing you to handle different types of errors within a single request without resorting to complex error handling. Note that this does not work with Mongoose validation errors; for controllers that may throw such, you should ensure a "fallback" status code to the response object in case a validation error is thrown.

### **HttpStatus enum**
Provides an easy-to-use interface to access status codes. This only supports status codes that are used at least once within the application; should a different one be needed, it can be added to the enum.

### **IRequest**
```typescript
interface IRequest extends Request {
    user?: IUserState;
    product?: IProduct;
    isOwner?: boolean;
    hasBought?: boolean;
}
```
This interface extends Express's ``Request`` object by giving it additional properties. Each property is optional, allowing you to plug it in any middleware without type errors.

## ``test``
This folder contains tests for each functionality of the server. Each test creates and drops the database, ensuring a clean slate for each test.

## License
MIT