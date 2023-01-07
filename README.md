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

Make sure to compile the TypeScript code before starting the server or tests.

This application runs on MongoDB.

## ``util``
This folder contains utility functions to make certain tasks easier

### **mapErrors(err: any)**
This function transforms errors in a consistent format across different responses. The error is most likely going to be an array with the errors, a standard error, or a Mongoose ValidationError error. In the event that it's none of those, it will return an array that indicates that the request has failed (most likely). Each element in the array has the following format:

```typescript
const arrayErrorElement = {
    msg: 'some error message'
}
```

## ``test``
This folder contains tests for each functionality of the server

## License
MIT