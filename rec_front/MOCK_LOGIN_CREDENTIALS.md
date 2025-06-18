# 🎭 Mock Login Credentials

Mock mode is now **ACTIVE**! Test the login functionality without a backend.

## ✅ Valid Test Credentials

### Super Admin Access
- **Email:** `admin@example.com`
- **Password:** `changethis`
- **Role:** Super Admin

### Admin Access  
- **Email:** `admin@recruitmentplus.example`
- **Password:** `admin123`
- **Role:** Admin

### Consultant Access
- **Email:** `consultant1@recruitmentplus.example`
- **Password:** `consultant123`
- **Role:** Consultant

### Demo User (Quick Test)
- **Email:** `test@demo.com`
- **Password:** `demo123`
- **Role:** Consultant

## ❌ Error Testing Scenarios

Test various error conditions with these special emails:

### Authentication Errors
- **Invalid Password:** Use any valid email with wrong password
  - Example: `test@demo.com` / `wrongpass` → "Invalid credentials" error

### User Not Found
- **Non-existent Email:** Use any unregistered email
  - Example: `nonexistent@test.com` / `anypassword` → "User not found" error

### Account Issues
- **Disabled Account:** `disabled@user.com` / `anypassword` → "Account disabled" error
- **Rate Limited:** `ratelimit@test.com` / `anypassword` → "Too many attempts" error

### Network/Server Errors
- **Network Error:** `network@error.com` / `anypassword` → Network connection error
- **Server Error:** `server@error.com` / `anypassword` → Internal server error

## 🚀 Features

- **Realistic loading states** (800ms delay)
- **Comprehensive error handling** with specific error types
- **Visual error alerts** that auto-hide after 5 seconds
- **Console logging** for debugging
- **Role-based access** after login

## 🔧 Environment Setup

Mock mode is enabled via:
```bash
NEXT_PUBLIC_USE_MOCK_DATA=true
```

The blue banner at the top indicates mock mode is active.