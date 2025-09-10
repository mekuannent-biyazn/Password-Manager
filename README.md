# Authentication & Access

- Most routes are protected with JWT-based authentication (protect middleware).
- Admin routes require elevated privileges (admin middleware).
- User sessions are managed securely with OTP verification during registration.

# Admin Routes (adminRoute.js)

## These routes are restricted to Admin users only.

1. **GET** `/api/admin/users`

- **Action**: Fetch all registered users.
- **Access**: Admin only.

2. **GET** `/api/admin/items`

- **Action**: Fetch all saved password vault items from all users.
- **Access**: Admin only.

3. **POST** `/api/admin/set-role`

- **Action**: Change a user’s role (e.g., user → admin).
- **Response Example:**

`````json
{
"userId": "68c145fb822a18392b50c981",
"role": "admin"
}```

- **Access**: Admin only.

4. **DELETE** `/api/admin/users/:userId`

- **Action**: Delete a particular user by ID.
- **Access**: Admin only.

# Authentication & User Routes (authRoute.js)

## These routes handle user registration, login, logout, and verification.

1. **POST** `/api/users/register`

- **Action**: Register a new user.
- **Response Example:**
  ````json
  {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPass123",
  "confirmPassword":"StrongPass123"
  }```
`````

`````

2. **POST** `/api/users/login`

- **Action**: Authenticate a user and return a JWT token.
- **Response Example:**
  ```json
  {
    "email": "john@example.com",
    "password": "StrongPass123"
  }
  ```

````
3. **POST** `/api/users/logout`

- **Action**: Log the user out (invalidate session/token).
- **Access**: Authenticated users only

4. **POST** `/api/users/change-password`

- **Action**: Allow users to update their password.
- **Response Example:**
  ```json
  {
  "oldPassword": "OldPass123",
  "newPassword": "NewStrongPass456"
  }```
- **Access**: Authenticated users only

5. **GET** `/api/users/me`

- **Action**: Retrieve profile info of the logged-in user.
- **Access**: Authenticated users only

6. **POST** `/api/users/verify-otp`

- **Action**: Verify OTP sent to user’s email during registration.
- **Response Example:**
  ```json
  {
  "email": "mekuannent@gmail.com",
  "otp": "123456"
  }```

7. **POST** `/api/users/resend-otp`

- **Action**: Resend OTP if it expired or not received.
- **Response Example:**
  ```json
  {
  "email": "mekuannent@gmail.com"
  }```

# Password Vault Routes (passwordRoute.js)

## These routes allow users to securely manage their password vault.

- # All routes require authentication.

1. **POST** `/api/password/`

- **Action**: Create and save a new password vault item.

2. **GET** `/api/password/`

- **Action**: Get all vault items of the logged-in user.

3. **GET** `/api/password/export`

- **Action**: Export all vault items of the logged-in user.

4. **GET** `/api/password/:id`

- **Action**: Retrieve a specific vault item by ID.
- **Query Parameters**:
- reveal=false (default) → password will be hiden .
- **Access**: Authenticated users only (can only fetch their own vault items).
- **Response Example:**
  ```json
  {
  "id": "68c14640822a18392b50c985",
  "title": "facebook",
  "username": "genico@fb",
  "url": "",
  "notes": "this is the password for facebook created at fitst time",
  "folder": "facebook",
  "createdAt": "2025-09-10T09:34:56.212Z",
  "updatedAt": "2025-09-10T19:57:54.917Z"
  }```

5. **GET** `/api/password/:id?reveal=true`

- **Action**: Retrieve a specific vault item by ID including the decrypted password.
- **Query Parameters**:
- reveal=true → returns the real decrypted password.
- **Access**: Authenticated users only.
- **Response Example:**
  ```json
  {
    "id": "68c14640822a18392b50c985",
    "title": "facebook",
    "username": "genico@fb",
    "url": "",
    "notes": "this is the password for facebook created at fitst time",
    "folder": "facebook",
    "createdAt": "2025-09-10T09:34:56.212Z",
    "updatedAt": "2025-09-10T19:57:54.917Z",
    "password": "212121"
  }
````

6. **PATCH** `/api/password/:id`

- **Action**: Update a specific vault item by ID.

7. **DELETE** `/api/password/:id`

- **Action**: Delete a specific vault item by ID.

# Admin Extended Password Management

## Admins can manage all users’ vault items:

1. **GET** `/api/password/admin/all`

- **Action**: Retrieve all vault items from all users.

2. **PUT** `/api/password/admin/:id`

   - **Action**: Update any vault item by ID.

3. **DELETE** `/api/password/admin/:id`
   - **Action**: Delete any vault item by ID.
`````
