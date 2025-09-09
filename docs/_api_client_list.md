# API Client List - Dự án Trạm Game

## Tổng quan
Danh sách tất cả API endpoints mà client applications (Desktop Client & Web Portal) cần sử dụng, được tổ chức theo modules và use cases.

## Base URL
- **Development**: http://localhost:3000/api/v1
- **Production**: https://api.tramgame.com/api/v1

## 1. Authentication Module

### 1.1 User Authentication
```
POST /auth/login
- Body: { username, password }
- Response: { token, user, expires_in }
- Used by: Desktop Client, Web Portal

POST /auth/logout  
- Headers: Authorization: Bearer {token}
- Response: { success }
- Used by: Desktop Client, Web Portal

POST /auth/refresh
- Body: { refresh_token }
- Response: { token, expires_in }
- Used by: Desktop Client, Web Portal

GET /auth/me
- Headers: Authorization: Bearer {token}
- Response: { user }
- Used by: Desktop Client, Web Portal
```

### 1.2 User Registration
```
POST /auth/register
- Body: { username, password, email? }
- Response: { user, token }
- Used by: Web Portal

POST /auth/verify-email
- Body: { token }
- Response: { success }
- Used by: Web Portal

POST /auth/forgot-password
- Body: { email }
- Response: { success }
- Used by: Web Portal

POST /auth/reset-password
- Body: { token, new_password }
- Response: { success }
- Used by: Web Portal
```

## 2. User Management Module

### 2.1 Profile Management
```
GET /users/profile
- Headers: Authorization: Bearer {token}
- Response: { user }
- Used by: Desktop Client, Web Portal

PUT /users/profile
- Headers: Authorization: Bearer {token}
- Body: { display_name?, avatar_url?, frame_id? }
- Response: { user }
- Used by: Desktop Client, Web Portal

PUT /users/change-password
- Headers: Authorization: Bearer {token}
- Body: { current_password, new_password }
- Response: { success }
- Used by: Desktop Client, Web Portal
```

### 2.2 Balance & Points
```
GET /users/balance
- Headers: Authorization: Bearer {token}
- Response: { balance, points }
- Used by: Desktop Client, Web Portal

GET /users/transactions
- Headers: Authorization: Bearer {token}
- Query: ?page=1&limit=20&type=payment
- Response: { transactions, pagination }
- Used by: Desktop Client, Web Portal
```

## 3. Payment Module

### 3.1 Payment Processing
```
POST /payments/transfer_content
- Headers: Authorization: Bearer {token}
- Body: {  }
- Response: { bank number, bank name,account_name, transfer_content }
- Used by: Desktop Client

GET /payments/status/{username}
- Headers: Authorization: Bearer {token}
- Response: { status, transaction }
- Used by: Desktop Client

POST /payments/webhook
- Headers: Authorization: Bearer {sepay_token}
- Body: SePay webhook payload
- Response: { success }
- Used by: SePay Service (Internal)
```

### 3.2 Points Conversion
```
POST /payments/convert-points
- Headers: Authorization: Bearer {token}
- Body: { points_amount }
- Response: { transaction }
- Used by: Desktop Client
```

## 4. VIP Module

### 4.1 VIP Packages
```
GET /vip/packages
- Response: { packages }
- Used by: Desktop Client

GET /vip/packages/{id}
- Response: { package }
- Used by: Desktop Client
```

### 4.2 VIP Subscription
```
POST /vip/purchase
- Headers: Authorization: Bearer {token}
- Body: { package_id }
- Response: { transaction, vip_status }
- Used by: Desktop Client

GET /vip/status
- Headers: Authorization: Bearer {token}
- Response: { vip_status, expiry, package }
- Used by: Desktop Client

GET /vip/history
- Headers: Authorization: Bearer {token}
- Query: ?page=1&limit=20
- Response: { history, pagination }
- Used by: Desktop Client
```

## 5. Game Module

### 5.1 Game Catalog
```
GET /games
- Query: ?page=1&limit=20&search=&category=&requires_vip=&is_free=&cached=true
- Response: { data, pagination }
- Used by: Desktop Client, Web Portal

Response summary (each item):
{
  "app_id": 570,                       // Steam appid (number or string)
  "name": "Dota 2",                    // từ Steam khi có
  "short_description": "...",
  "header_image": "https://...",
  "release_date": "2013-07-09",
  "developers": ["Valve"],
  "publishers": ["Valve"],
  "genres": ["Action","MOBA"],
  "is_free": true,                     // business flag from DB
  "requires_vip": false,               // business flag from DB
  "metacritic": { "score": 90, "url": "..." }, // optional
  "translation": { /* optional local translations */ },
  "steam_data_cached_at": "2025-09-09T12:00:00Z",
  "cached": true                        // true when returned from cache
}

Notes:
- Server joins DB (which only stores app_id + internal flags) with Steam API results.
- Prefer cached Steam responses. Include steam_data_cached_at and steam_available so clients can show degraded UI.
- If Steam call fails and no cache: return minimal item { app_id, is_free, requires_vip, steam_available:false } and optionally an item-level error in details.
- Pagination uses the global pagination format in this doc.

GET /games/{app_id}
- Response: { game }
- Detailed schema includes fields above plus:
{
  "app_id": 570,
  "name": "...",
  "full_description": "...",
  "detailed_release_date": { "date":"2013-07-09", "coming_soon": false },
  "system_requirements": { "windows": "...", "mac": "...", "linux": "..." },
  "screenshots": [ { "id": ..., "path_thumbnail": "...", "path_full": "..." } ],
  "movies": [ { "id": ..., "mp4": { "480": "...", "max": "..." }, "thumbnail": "..." } ],
  "developers": [...],
  "publishers": [...],
  "genres": [...],
  "achievements": { "total": 123, "highlighted": [...] },
  "price_overview": { "currency":"USD","initial":1999,"final":999,"discount_percent":50 },
  "store_url": "https://store.steampowered.com/app/570",
  "steam_raw": { /* raw appdetails response, optional */ },
  "steam_data_cached_at": "2025-09-09T12:00:00Z",
  "steam_available": true,
  "download_permissions": { "has_access": true, "reason": null } // if relevant
}

Caching & behaviour
- Default TTL for Steam cache: configurable (suggest 6 hours).
- Provide ?cached=true to force only cached data (no live Steam call).
- On Steam rate-limit / error: return cached data if present; otherwise return minimal metadata and steam_available:false.
- Log steam fetch time and expose steam_data_cached_at so clients can show "stale" indicator.

Client guidance
- Treat steam_available=false as display-only fallback (show "Thông tin tạm thời không có").
- Use cached flag to avoid triggering frequent Steam requests
```

### 5.2 Game Search & Filter
```
GET /games/search
- Query: ?q=search_term
- Response: { name, _id }
- Used by: Desktop Client, Web Portal
```
## 6. Download Module

### 6.1 Download Management
```
GET /downloads/{app_id}/check-access
- Headers: Authorization: Bearer {token}
- Response: { has_access, reason? }
- Used by: Desktop Client

POST /downloads/{app_id}/generate-url
- Headers: Authorization: Bearer {token}
- Response: { download_url, expires_at }
- Used by: Desktop Client

GET /downloads/{app_id}/manifest
- Headers: Authorization: Bearer {token}
- Response: File stream (.manifest)
- Used by: Desktop Client

GET /downloads/{app_id}/lua
- Headers: Authorization: Bearer {token}
- Response: File stream (.lua)
- Used by: Desktop Client
```

### 6.2 Download History
```
GET /downloads/history
- Headers: Authorization: Bearer {token}
- Query: ?page=1&limit=20
- Response: { downloads, pagination }
- Used by: Desktop Client

POST /downloads/{app_id}/log
- Headers: Authorization: Bearer {token}
- Body: { status, file_size?, error? }
- Response: { success }
- Used by: Desktop Client
```

## 7. User Library Module

### 7.1 Library Management
```
GET /library
- Headers: Authorization: Bearer {token}
- Query: ?page=1&limit=20
- Response: { _id, name }
- Used by: Desktop Client

POST /library/{app_id}/add
- Headers: Authorization: Bearer {token}
- Response: { success }
- Used by: Desktop Client

DELETE /library/{app_id}
- Headers: Authorization: Bearer {token}
- Response: { success }
- Used by: Desktop Client
```

## 8. Review Module

### 8.1 Game Reviews
loại bỏ
## 9. Gift Code Module

### 9.1 Gift Code Redemption
```
POST /giftcodes/redeem
- Headers: Authorization: Bearer {token}
- Body: { code }
- Response: { reward, transaction? }
- Used by: Desktop Client, Web Portal

GET /giftcodes/history
- Headers: Authorization: Bearer {token}
- Query: ?page=1&limit=20
- Response: { redemptions, pagination }
- Used by: Desktop Client, Web Portal
```

## 10. Notification Module

### 10.1 User Notifications
```
GET /notifications
- Headers: Authorization: Bearer {token}
- Query: ?page=1&limit=20&read=false
- Response: { notifications, pagination }
- Used by: Desktop Client, Web Portal

PUT /notifications/{id}/read
- Headers: Authorization: Bearer {token}
- Response: { success }
- Used by: Desktop Client, Web Portal

PUT /notifications/mark-all-read
- Headers: Authorization: Bearer {token}
- Response: { success }
- Used by: Desktop Client, Web Portal

DELETE /notifications/{id}
- Headers: Authorization: Bearer {token}
- Response: { success }
- Used by: Desktop Client, Web Portal
```

## 11. Translation Module

### 11.1 Translation Management
```
GET /translations/{app_id}
- Response: { translations }
- Used by: Desktop Client, Web Portal

GET /translations/{app_id}/download
- Headers: Authorization: Bearer {token}
- Response: File stream
- Used by: Desktop Client

GET /translations/authors
- Response: { authors }
- Used by: Desktop Client, Web Portal
```

## 12. Admin Module (Web Portal Only)

### 12.1 User Management
```
GET /admin/users
- Headers: Authorization: Bearer {admin_token}
- Query: ?page=1&limit=20&search=&status=&role=
- Response: { users, pagination }
- Used by: Web Portal (Admin)

PUT /admin/users/{id}/status
- Headers: Authorization: Bearer {admin_token}
- Body: { status, reason? }
- Response: { success }
- Used by: Web Portal (Admin)

PUT /admin/users/{id}/role
- Headers: Authorization: Bearer {admin_token}
- Body: { role }
- Response: { success }
- Used by: Web Portal (Admin)
```

### 12.2 Game Management
```
POST /admin/games
- Headers: Authorization: Bearer {admin_token}
- Body: { app_id, name, is_free?, requires_vip? }
- Response: { game }
- Used by: Web Portal (Admin)

PUT /admin/games/{app_id}
- Headers: Authorization: Bearer {admin_token}
- Body: { name?, is_free?, requires_vip?, free_until? }
- Response: { game }
- Used by: Web Portal (Admin)

DELETE /admin/games/{app_id}
- Headers: Authorization: Bearer {admin_token}
- Response: { success }
- Used by: Web Portal (Admin)
```

### 12.3 VIP Package Management
```
GET /admin/vip/packages
- Headers: Authorization: Bearer {admin_token}
- Response: { packages }
- Used by: Web Portal (Admin)

POST /admin/vip/packages
- Headers: Authorization: Bearer {admin_token}
- Body: { name, price, duration_days, features }
- Response: { package }
- Used by: Web Portal (Admin)

PUT /admin/vip/packages/{id}
- Headers: Authorization: Bearer {admin_token}
- Body: { name?, price?, duration_days?, features?, active? }
- Response: { package }
- Used by: Web Portal (Admin)
```

### 12.4 Gift Code Management
```
POST /admin/giftcodes/generate
- Headers: Authorization: Bearer {admin_token}
- Body: { count, reward_type, reward_value, usage_limit?, expiry_date? }
- Response: { codes }
- Used by: Web Portal (Admin)

GET /admin/giftcodes
- Headers: Authorization: Bearer {admin_token}
- Query: ?page=1&limit=20&status=&batch_id=
- Response: { codes, pagination }
- Used by: Web Portal (Admin)

PUT /admin/giftcodes/{id}/status
- Headers: Authorization: Bearer {admin_token}
- Body: { active }
- Response: { success }
- Used by: Web Portal (Admin)
```

### 12.5 Analytics & Reports
```
GET /admin/analytics/overview
- Headers: Authorization: Bearer {admin_token}
- Query: ?start_date=&end_date=
- Response: { stats }
- Used by: Web Portal (Admin)

GET /admin/analytics/users
- Headers: Authorization: Bearer {admin_token}
- Query: ?start_date=&end_date=&group_by=day
- Response: { user_stats }
- Used by: Web Portal (Admin)

GET /admin/analytics/revenue
- Headers: Authorization: Bearer {admin_token}
- Query: ?start_date=&end_date=&group_by=day
- Response: { revenue_stats }
- Used by: Web Portal (Admin)

GET /admin/analytics/games
- Headers: Authorization: Bearer {admin_token}
- Query: ?start_date=&end_date=&sort=downloads
- Response: { game_stats }
- Used by: Web Portal (Admin)
```

### 12.6 System Management
```
GET /admin/system/health
- Headers: Authorization: Bearer {admin_token}
- Response: { status, services }
- Used by: Web Portal (Admin)

GET /admin/system/logs
- Headers: Authorization: Bearer {admin_token}
- Query: ?page=1&limit=50&level=&start_date=&end_date=
- Response: { logs, pagination }
- Used by: Web Portal (Admin)

POST /admin/system/cache/clear
- Headers: Authorization: Bearer {admin_token}
- Body: { keys? }
- Response: { success }
- Used by: Web Portal (Admin)
```

## 13. Steam Integration Module (Desktop Client Only)

### 13.1 Steam Data Sync
```
GET /steam/app/{app_id}/details
- Response: { steam_data }
- Used by: Desktop Client

POST /steam/sync/{app_id}
- Headers: Authorization: Bearer {admin_token}
- Response: { success }
- Used by: Desktop Client (Background)
```

## 14. File Management Module

### 14.1 File Operations
```
POST /files/upload
- Headers: Authorization: Bearer {admin_token}
- Body: FormData with file
- Response: { file_url, file_id }
- Used by: Web Portal (Admin)

DELETE /files/{file_id}
- Headers: Authorization: Bearer {admin_token}
- Response: { success }
- Used by: Web Portal (Admin)
```

## 15. Health Check & Monitoring

### 15.1 System Health
```
GET /health
- Response: { status, timestamp }
- Used by: Load Balancer, Monitoring

GET /health/detailed
- Headers: Authorization: Bearer {admin_token}
- Response: { status, services, metrics }
- Used by: Monitoring Tools
```

## Client Usage Patterns

### Desktop Client Priority APIs:
1. Authentication (login/logout/refresh)
2. Game catalog & search
3. Download management
4. VIP status checking
5. User library management
6. Steam integration

### Web Portal Priority APIs:
1. Authentication & registration
2. Game catalog & reviews
3. Payment & VIP management
4. User profile management
5. Admin dashboard (for admins)
6. Analytics & reporting

## Error Response Format

All APIs return consistent error format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Rate Limiting

- **General APIs**: 100 requests/minute per user
- **Authentication**: 10 requests/minute per IP
- **Payment APIs**: 5 requests/minute per user
- **Admin APIs**: 200 requests/minute per admin
- **Download APIs**: 10 requests/minute per user

## Authentication Headers

All protected endpoints require:
```
Authorization: Bearer {jwt_token}
```

Admin endpoints require admin role in JWT payload.

## Pagination Format

APIs with pagination use consistent format:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## 16. Item Module (New)

### 16.1 User Items
```
GET /user/items
- Headers: Authorization: Bearer {token}
- Response: { items: string[], item_sources: { [item_id]: "vip_sub" | "redeem_code" | "points_purchase" | "admin_grant" | string } }
- Used by: Desktop Client, Web Portal

POST /user/items/sync
- Headers: Authorization: Bearer {token}
- Body: { device_items: string[] }
- Response: { merged: string[], added: string[], removed: string[] }
- Notes: Server is source of truth; items with source=vip_sub may be inactive if VIP expired.
- Used by: Desktop Client
```

## 17. Patch Module (New)

### 17.1 Patch Catalog
```
GET /patches/{appid}
- Headers: Authorization: Bearer {token}
- Response: { patches: [{ id, appid, author, description, size }] }
- Used by: Desktop Client, Web Portal
```

### 17.2 Patch Upload (Admin)
```
POST /patches/upload
- Headers: Authorization: Bearer {admin_token}
- Body: multipart/form-data { appid, file, author, description, size }
- Response: { patch_id }
- Used by: Web Portal (Admin)
```

### 17.3 Generate Patch Download URL
```
GET /patches/download/{id}
- Headers: Authorization: Bearer {token}
- Response: { download_url, expires_at }
- Notes: Signed URL generated from cloud storage. Client downloads directly from cloud.
- Used by: Desktop Client
```
