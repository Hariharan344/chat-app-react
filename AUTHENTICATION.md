# Authentication System

This document explains how the authentication system works in the Chat App.

## Overview

The authentication system has been updated to work with your backend API. It stores authentication tokens and automatically includes them with every API request.

## Components

### 1. Authentication Types (`src/types/chat.ts`)

```typescript
export interface AuthRequest {
  mail: string;
  password: string;
}

export interface AuthResponse {
  accesstoken: string;
  refreshtoken: string;
  userName: string;
  userId: string;
  role: string;
}
```

### 2. HTTP Client (`src/services/httpClient.ts`)

The HTTP client automatically:
- Stores authentication tokens in localStorage
- Adds `Authorization: Bearer <token>` header to all requests
- Handles token refresh automatically when tokens expire
- Provides methods for GET, POST, PUT, DELETE requests

### 3. Auth Service (`src/services/authService.ts`)

Provides methods for:
- `login(mail, password)` - Login with backend API
- `logout()` - Clear authentication data
- `getCurrentUser()` - Get current user information
- `isLoggedIn()` - Check if user is authenticated
- `refreshToken()` - Refresh access token

### 4. API Service (`src/services/api.ts`)

All API calls now automatically include authentication headers:
- `getUsers()` - Get all users (authenticated)
- `getChatLists(userId)` - Get chat lists (authenticated)
- `getChatMessages(userId, otherUserId)` - Get chat messages (authenticated)

### 5. WebSocket Service (`src/services/websocket.ts`)

WebSocket connection now includes authentication:
- Sends `Authorization: Bearer <token>` header when connecting
- Uses current user ID from authentication data

## Usage

### Login Process

1. User enters email and password in the login form
2. Frontend calls `/auth/login` API endpoint
3. Backend returns `AuthResponse` with tokens and user info
4. Frontend stores tokens in localStorage
5. All subsequent API calls include the access token

### Automatic Token Management

- Access tokens are automatically included in all API requests
- When a token expires (401 response), the system automatically:
  1. Tries to refresh the token using the refresh token
  2. Retries the original request with the new token
  3. If refresh fails, redirects user to login

### API Request Example

```typescript
// This automatically includes the Authorization header
const users = await apiService.getUsers();

// Equivalent to:
// fetch('/user', {
//   headers: {
//     'Authorization': 'Bearer <access_token>'
//   }
// })
```

### WebSocket Connection

```typescript
// WebSocket connection includes authentication
await webSocketService.connect(userId);
// Sends Authorization header with the connection
```

## Backend Integration

Your backend should:

1. **Login Endpoint** (`POST /auth/login`):
   ```json
   Request: { "mail": "user@example.com", "password": "pass" }
   Response: {
     "status": true,
     "message": "Login Successful",
     "data": {
       "accesstoken": "jwt_token_here",
       "refreshtoken": "refresh_token_here",
       "userName": "User Name",
       "userId": "user_id",
       "role": "USER"
     }
   }
   ```

2. **Refresh Token Endpoint** (`POST /auth/refresh`):
   ```json
   Request: "refresh_token_string"
   Response: {
     "status": true,
     "message": "Refresh Token Successful",
     "data": {
       "accesstoken": "new_jwt_token",
       "refreshtoken": "new_refresh_token",
       "userName": "User Name",
       "userId": "user_id",
       "role": "USER"
     }
   }
   ```

3. **Protected Endpoints**: All other endpoints should validate the `Authorization: Bearer <token>` header

4. **WebSocket Authentication**: WebSocket connection should validate the `Authorization` header in the connection headers

## Storage

Authentication data is stored in localStorage:
- `authData`: Contains the complete `AuthResponse` object

## Security Notes

- Tokens are stored in localStorage (consider httpOnly cookies for production)
- Access tokens should have short expiration times
- Refresh tokens should have longer expiration times
- Always use HTTPS in production
- Consider implementing token blacklisting on logout

## Error Handling

The system handles various authentication errors:
- Invalid credentials during login
- Expired access tokens (automatic refresh)
- Failed token refresh (redirect to login)
- Network errors during authentication

## Testing

To test the authentication system:

1. Start your backend server
2. Use the login form with valid credentials
3. Check browser's localStorage for stored tokens
4. Verify that API calls include Authorization headers
5. Test token refresh by waiting for token expiration