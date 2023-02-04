# Ecommerce server
Server for ecommerce application, written in Express and TypeScript.

Deployed version: [https://ecommerce-315d8.web.app/](https://ecommerce-315d8.web.app/)

**NOTE:** Due to the server using a free plan, it is possible for the application to be non-responding (or "frozen") for a few minutes if it has not been used by anyone for some time. Please be patient!

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

## Models
### User
```typescript
interface IUser {
    _id: Types.ObjectId,
    username: string,
    password: string,
    products: IProduct[],
    boughtProducts: IProduct[],
    palette: string // this uses string for compatibility with Mongoose, see below for valid values
    light: string // this uses string for compatibility with Mongoose, see below for valid values
}
```
The User model represents each user in the database. The following validations and actions occur when creating or updating a user:

* **username** - the username must be between five and ten English characters, start with an English letter, and contain only alphanumeric characters. Before saving, the UserSchema also checks if the username is already taken, and if that's the case, the validation will fail.

* **password** - the password must be at least six characters. Before saving, the UserSchema will hash the password and insert it in place of the actual password.

* **palette** - by default ``deepPurple`` when the user is created, the palette must be one of the following values when changing it: ``blue``, ``indigo``, ``deepPurple``, ``green``, ``amber``, ``pink``;

* **light** - by default ``light`` when the user is created, the theme must be either ``light`` or ``dark`` when changing it.

The ``products`` property represents the products which the user has created and is by default an empty array. The ``boughtProducts`` property represents the products the user has bought and is by default an empty array.

### Product
```typescript
interface IProduct {
    _id: Types.ObjectId,
    name: string;
    price: number;
    image: string;
    owner: IUser;
    buyers: IUser[];
}
```
The Product model represents each product in the database. The following validations and actions occur when creating or updating a product:

* **name** - the name must be between 5 and 100 characters.
* **price** - the price must be at least $0.01. Before creating the product or modifying the price, the schema will round the price to the second decimal.
* **image** - the image must not be an empty string.

The ``owner`` property represents the creator of the product. The ``buyers`` property represents a list of users that have bought the product, being an empty array by default

#### Deleting
When a product is deleted, all transactions associated with it are deleted and the product is also removed from every user's ``products`` and ``boughtProducts`` properties if it exists in those.

### Transaction
```typescript
interface ITransaction {
    buyer: IUser;
    product: IProduct;
    createdAt: Date;
}
```
The Transaction model allows you to access the date at which a purchase was done

## Middlewares
The middlewares are used to authorize or modify requests. The authorizing middlewares will block any request that does not contain valid credentials. The modification ones will modify the request object with relevant information and only abort requests when it's impossible to proceed further (e.g. the request is related to a non-existant product).

When sending an authorized request, you must attach a JWT to the ``authorization`` header.

### attachLoginStatusToRequest
A modifying middleware, attaches the user to the request object if the JWT provided to it is valid. You should use this or ``authorizeUser`` in every request that identifies the user in some way (e.g. verifying ownership or a purchase), as other middlewares depend on the request object to obtain data about the user.

### authorizeGuest
This middleware blocks requests from logged in users.

### authorizeUser
This middleware blocks requests from guests. If the request is authorized successfuly, the middleware will attach the user to the request. You should use this or ``attachLoginStatusToRequest`` in every request that identifies the user in some way (e.g. verifying ownership or a purchase), as other middlewares depend on the request object to obtain data about the user.

### blacklistToken
This middlewares invalidates a valid JWT and makes it unusable for future authorized requests.

### attachProductToRequest
A modifying middleware, attaches the product to the request. If it does not exist, aborts the request with a 404 error.

### checkIfUserIsTheCreatorOfTheProduct
A modifying middleware, attaches information about whether the user created the product. If the product does not exist, aborts the request with a 404 error.

### authorizeOwner
This middleware blocks requests from users that are the owner (creator) of the product. This middleware will either take the product from the request if combined with ``attachProductToRequest`` or find the product by itself.

This middleware must be combined with one that validates JWTs. Upon success, the middleware will attach the product to the request if it's not attached already.

### checkIfUserHasBoughtTheProduct
A modifying middleware, attaches information about whether the user has bought the product. If the product does not exist, aborts the request with a 404 error.

### authorizeBuyer
This middleware blocks requests from users that cannot buy the product. This middleware will either take the product from the request if combined with ``attachProductToRequest`` or find the product by itself.

This middleware must be combined with one that validates JWTs and one that attaches information about whether the user is the owner of the product. Upon success, the middleware will attach the product to the request if it's not attached already.

## Controllers
### user
The user controllers handle requests that affect the user, such as authentication and configuring some personal settings.

#### Confirming if the user is logged in
To confirm whether the user is logged in or not, send a GET request to to ``/user``. If the user is logged in, the server will respond with a status code of 200 and the user's username, id, palette, and theme.

#### Registering a user
To register a user, send a POST request to ``/user/register`` with the following JSON body:
```json
{
    "username": "someusername",
    "password": "password"
}
```
Make sure that the request does not have any valid JWT attached to it. Upon a successful registration, the server will respond with the user's username, id, palette, and theme, alongside a valid JWT to be used for future authorized requests.

To learn more about what validations are applied to user registration, refer to the User model and its respective documentation.

#### Logging in a user
To log in a user, send a POST request to ``/user/login`` and follow the same directions from ``/user/register``.

#### Logging out a user
To log out a user, send a DELETE request to ``/user/logout`` with a valid JWT attached to the request. This will invalidate the token, making it unusable for future authorized requests.

To learn more about this process, refer to the ``blacklistToken`` middleware

#### Getting a user's transactions
To get a user's transactions (aka a history of purchases), send a GET request to ``/user/transactions``.

Refer to the Transaction model to learn more about it.

#### Changing a user's theme or palette
To change either of those settings, send a PUT request to ``/user/theme`` or ``/user/palette``, depending on what you want to change.

The following JSON must be sent alongside a valid JWT:

```json
{
    "palette": "somepalette", // if sending to /user/palette
    "theme": "sometheme" // if sending to /user/theme
}
```

Refer to the User model to learn more about which values are acceptable

### product
The product controllers handle CRUD operations related to products, as well as the process of buying a product.

#### Getting a product
To get a specific product, send a GET request to ``/product/:id`` where ``:id`` is the product's id. If the product exists, the server will return an object containing the following:

* the product's name, price, id, and image,
* whether the user requesting the product has bought it
* whether the user requesting the product is the owner (creator) of the product
* whether the user requesting the product is logged in

#### Creating a product
To create a product, send an authorized POST request to ``/product/:id`` where ``:id`` is the product's id. Upon a successful creation, the server will return the product's name, price, id, and image.

To learn more about what validations are used when creating the product, refer to the Product model and its respective documentation.

#### Editing a product
To edit a product's name or price, send an authorized PUT request to ``/product/:id`` where ``:id`` is the product's id. Upon a successful edit, the server will return an object containing the product's id.

The following JSON body must be sent alongside a valid JWT:

```json
{
    "name": "somenewname",
    "price": "somenewprice",
}
```
To learn more about what validations are used when editing the product, refer to the Product model and its respective documentation.

#### Deleting a product
To delete a product, send an authorized DELETE request to ``/product/:id`` where ``:id`` is the product's id. Upon a successful deletion, the server will return the deleted product's id.

#### Getting all products (and sorting + paginating)
To get a list of all products, send a GET request to ``/product/all``. Optionally, you can attach query strings to sort and paginate the result. The following queries can be attached to the request's URL:

* ``page``, default 0 (meaning no pagination)
* ``sort`` - ``asc`` or ``desc`` (by default, the server orders the products by the order in which they were inserted in the database)
* ``by`` - a property of the product. Currently, the only sortable ones are ``price`` and ``name``

When pagination is requested, the server will return six items (or less if not applicable) per page. The server returns a list of all (or paginated) products, alongside the total amount of products in the database.

#### Searching products by name (and sorting + paginating)
To get a list of all products whose name contains a specific string, send a GET request to ``/product/search`` and attach a ``name`` query string to the request's URL. The search is case insensitive.

Optionally, you can attach query strings to sort and paginate the result. The following queries can be attached to the request's URL:

* ``page``, default 0 (meaning no pagination)
* ``sort`` - ``asc`` or ``desc`` (by default, the server orders the products by the order in which they were inserted in the database)
* ``by`` - a property of the product. Currently, the only sortable ones are ``price`` and ``name``

When pagination is requested, the server will return six items (or less if not applicable) per page. The server returns a list of all (or paginated) products whose name matches the given name, alongside the total amount of products that match the name.

#### Buying a product
To have a user buy a product, send an authorized POST request to ``/product/:id/buy`` where ``:id`` is the product's id. Upon success, the server will return the product's id.

Refer to the ``authorizeBuyer`` middleware method for more information regarding how the purchase is validated.

#### Verifying ownership
You can send an authorized request to ``/product/:id/isOwner``, where ``:id`` is the product's id. If the user is the owner, the server returns a status code of 200 with the product attached to the response, 404 if the product does not exist, 401 if the user is not logged in, or 403 otherwise.

#### Getting user's products
To retrieve all products created by a specific user, send an authorized GET request to ``/product/own``. All products in the array consist of a price, name, image, and ``_id``. The results can be sorted and paginated (refer to the search products section for more information)

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
#### constructor(message: string, status: number)

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