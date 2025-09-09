# Dependency Graph - Dự án Trạm Game

## Tổng quan
Tài liệu này mô tả chi tiết dependency graph của hệ thống "Trạm Game", thể hiện mối quan hệ phụ thuộc giữa các layer và components.

## 1. High-Level Architecture Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
├─────────────────────────┬───────────────────────────────────────┤
│    Desktop Client       │           Web Portal                  │
│         (C#)            │           (ReactJS)                   │
└─────────────────────────┴───────────────────────────────────────┘
                          │
                    HTTP/REST API
                          │
┌─────────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                  Backend API Server                             │
│                     (Node.js)                                   │
│                                                                 │
│  Controllers → Services → Models → Database                     │
└─────────────────────────────────────────────────────────────────┘
                          │
                    Database Queries
                          │
┌─────────────────────────┬───────────────────────────────────────┐
│    Primary Database     │           Cache Layer                 │
│      (MongoDB)          │           (Redis)                     │
└─────────────────────────┴───────────────────────────────────────┘
```

## 2. Backend Layer Dependencies

### 2.1 Controller → Service → Model Flow

```
HTTP Request
    │
    ├─ Route Handler
    │   └─ Middleware Stack
    │       ├─ Authentication
    │       ├─ Authorization  
    │       ├─ Validation
    │       └─ Rate Limiting
    │
    ├─ Controller
    │   ├─ Request parsing
    │   ├─ Input validation
    │   └─ Response formatting
    │
    ├─ Service Layer
    │   ├─ Business logic
    │   ├─ External API calls
    │   ├─ Cache operations
    │   └─ Transaction management
    │
    ├─ Model Layer
    │   ├─ Data validation
    │   ├─ Schema enforcement
    │   └─ Database operations
    │
    └─ Database
        ├─ MongoDB (Primary)
        └─ Redis (Cache)
```

### 2.2 Detailed Component Dependencies

#### Item Management Flow (NEW):
```
item.routes.js
    │
    ├─ auth.middleware.js (JWT)
    │
    ├─ item.controller.js
    │   ├─ GET /user/items
    │   └─ POST /user/items/sync
    │
    ├─ item.service.js
    │   ├─ Merge device_items with server items
    │   ├─ Enforce VIP expiry rules on vip_sub items
    │   └─ Audit updates
    │
    ├─ User.js (Model)
    │   └─ users.items & users.item_sources
    │
    └─ MongoDB → users collection; Redis (optional) for item cache
```

#### Patch Management Flow (NEW):
```
patch.routes.js
    │
    ├─ auth.middleware.js
    │   └─ + admin.middleware.js cho upload
    │
    ├─ patch.controller.js
    │   ├─ GET /patches/{appid}
    │   ├─ GET /patches/download/{id}
    │   └─ POST /patches/upload (admin)
    │
    ├─ patch.service.js
    │   ├─ CRUD MongoDB(patches)
    │   ├─ Access checks (VIP/points/gift)
    │   └─ CloudStorageService → Signed URL (1h)
    │
    ├─ Patch.js (Model)
    │   └─ Patch schema
    │
    ├─ MongoDB
    │   └─ patches collection
    │
    └─ Redis
        ├─ signed_url cache
        └─ download rate limits
```

#### Authentication Flow:
```
auth.routes.js
    │
    ├─ auth.middleware.js (JWT verification)
    │
    ├─ auth.controller.js
    │   ├─ Input validation
    │   └─ Response handling
    │
    ├─ auth.service.js
    │   ├─ Password verification
    │   ├─ JWT token generation
    │   ├─ Session management
    │   └─ Single session policy
    │
    ├─ User.js (Mongoose Model)
    │   ├─ Schema validation
    │   └─ Password hashing
    │
    ├─ MongoDB
    │   └─ users collection
    │
    └─ Redis
        └─ session storage
```

#### Payment Flow:
```
payment.routes.js
    │
    ├─ sepay.middleware.js
    │   ├─ IP whitelist validation
    │   ├─ Bearer token auth
    │   └─ Timestamp validation
    │
    ├─ payment.controller.js
    │   ├─ Webhook payload parsing
    │   └─ Response formatting
    │
    ├─ sepay.service.js
    │   ├─ Idempotency handling
    │   ├─ Transaction reservation
    │   ├─ Username parsing
    │   ├─ Balance/Points calculation
    │   └─ Atomic updates
    │
    ├─ Transaction.js (Model)
    │   ├─ Schema validation
    │   └─ Status management
    │
    ├─ User.js (Model)
    │   └─ Balance/Points updates
    │
    ├─ MongoDB
    │   ├─ transactions collection
    │   └─ users collection
    │
    └─ Redis
        └─ Cache invalidation
```

#### Game Management Flow:
```
game.routes.js
    │
    ├─ vip.middleware.js (Access control)
    │
    ├─ game.controller.js
    │   ├─ Filtering by user access
    │   └─ Pagination handling
    │
    ├─ game.service.js
    │   ├─ VIP access validation
    │   ├─ Steam API integration
    │   └─ Cache management
    │
    ├─ steam.service.js
    │   ├─ Steam API calls
    │   └─ Response caching
    │
    ├─ Game.js (Model)
    │   └─ Schema validation
    │
    ├─ MongoDB
    │   └─ games collection
    │
    └─ Redis
        ├─ Steam API cache
        └─ Game metadata cache
```

#### VIP Management Flow:
```
vip.routes.js
    │
    ├─ auth.middleware.js (Authentication)
    │
    ├─ vip.controller.js
    │   ├─ Package selection
    │   └─ Purchase validation
    │
    ├─ vip.service.js
    │   ├─ Balance validation
    │   ├─ Atomic transaction
    │   ├─ VIP status update
    │   └─ Cache invalidation
    │
    ├─ User.js (Model)
    │   └─ VIP fields update
    │
    ├─ VipPackage.js (Model)
    │   └─ Package details
    │
    ├─ Transaction.js (Model)
    │   └─ Purchase record
    │
    ├─ MongoDB
    │   ├─ users collection
    │   ├─ vip_packages collection
    │   └─ transactions collection
    │
    └─ Redis
        └─ User permission cache
```

#### Download Management Flow:
```
download.routes.js
    │
    ├─ auth.middleware.js
    ├─ vip.middleware.js
    │
    ├─ download.controller.js
    │   ├─ Access validation
    │   └─ URL generation
    │
    ├─ download.service.js
    │   ├─ Signed URL creation
    │   ├─ GitHub proxy
    │   └─ Download logging
    │
    ├─ Game.js (Model)
    │   └─ Access requirements
    │
    ├─ UserLibrary.js (Model)
    │   └─ Download history
    │
    ├─ MongoDB
    │   ├─ games collection
    │   └─ user_library collection
    │
    └─ Redis
        ├─ Signed URL cache
        └─ Download rate limits
```

## 3. External Service Dependencies

### 3.1 SePay Integration Dependencies

```
SePay Webhook
    │
    ├─ sepay.middleware.js
    │   ├─ IP Whitelist Check
    │   │   └─ Environment Config
    │   ├─ Bearer Token Validation
    │   │   └─ SEPAY_API_KEY
    │   └─ Timestamp Validation
    │       └─ SEPAY_TIMESTAMP_WINDOW
    │
    ├─ sepay.service.js
    │   ├─ Idempotency Check
    │   │   └─ MongoDB (transactions)
    │   ├─ Transaction Reservation
    │   │   └─ MongoDB Session
    │   ├─ Content Parsing
    │   │   └─ Regex Username Extraction
    │   └─ Balance Update
    │       └─ Atomic MongoDB Transaction
    │
    └─ Response to SePay
        └─ { success: true }
```

### 3.2 Steam API Dependencies

```
Steam API Integration
    │
    ├─ steam.service.js
    │   ├─ API Rate Limiting
    │   │   └─ Redis Counters
    │   ├─ Response Caching
    │   │   └─ Redis Cache (1h TTL)
    │   └─ Error Handling
    │       └─ Fallback to cached data
    │
    ├─ External API Calls
    │   ├─ https://store.steampowered.com/api/appdetails
    │   └─ https://api.xiaoheihe.cn/game/web/get_game_detail
    │
    └─ Cache Strategy
        ├─ Redis: steam:{app_id}
        └─ TTL: 3600 seconds
```

### 3.3 GitHub Repository Dependencies

```
GitHub Integration
    │
    ├─ download.service.js
    │   ├─ URL Construction
    │   │   └─ github.com/SteamAutoCracks/ManifestHub/archive/refs/heads/{appId}.zip
    │   ├─ Proxy Download
    │   │   └─ Stream to Client
    │   └─ Error Handling
    │       └─ 404 handling for missing games
    │
    └─ File Processing
        ├─ ZIP extraction
        ├─ .manifest → Steam\config\st\
        └─ .lua → Steam\config\depotcache\
```

### 3.4 Cloud Storage Dependencies (NEW)
```
Cloud Storage (e.g., S3/Cloudflare R2/GCS)
    │
    ├─ CloudStorageService
    │   ├─ Generate Signed URL (GET only)
    │   ├─ TTL configurable (default 1h)
    │   └─ Object key derived from patches.download_url
    │
    └─ Security
        ├─ Signed URL validation at provider
        └─ Backend never proxies large files in production path
```

## 4. Desktop Client Dependencies

### 4.1 Client-Server Communication

```
Desktop Client (C#)
    │
    ├─ ApiService.cs
    │   ├─ HttpClient configuration
    │   ├─ JWT token management
    │   ├─ Request/Response serialization
    │   └─ Error handling
    │
    ├─ AuthService.cs
    │   ├─ Login/Logout
    │   ├─ Token refresh
    │   └─ Session validation
    │
    ├─ GameService.cs
    │   ├─ Game catalog sync
    │   ├─ Download management
    │   └─ Library updates
    │
    └─ Backend API
        ├─ /api/v1/auth/*
        ├─ /api/v1/games/*
        ├─ /api/v1/downloads/*
        └─ /api/v1/vip/*
```

### 4.2 Steam Integration Dependencies

```
Desktop Client Steam Integration
    │
    ├─ SteamService.cs
    │   ├─ SteamKit2 library
    │   ├─ Steam network connection
    │   └─ Library management
    │
    ├─ FileManager.cs
    │   ├─ Steam directory detection
    │   ├─ File operations
    │   └─ Backup management
    │
    ├─ SecurityHelper.cs
    │   ├─ Integrity checks
    │   ├─ Cleanup on exit
    │   └─ Anti-tampering
    │
    └─ Local Steam Installation
        ├─ Steam\config\st\ (manifests)
        ├─ Steam\config\depotcache\ (lua files)
        └─ Steam library refresh
```

## 5. Database Dependencies

### 5.1 MongoDB Collection Relationships

```
users
    │
    ├─ Referenced by:
    │   ├─ transactions.user_id
    │   ├─ reviews.user_id
    │   ├─ sessions.user_id
    │   ├─ user_library.user_id
    │   ├─ notifications.user_id
    │   └─ audit_logs.user_id
    │
    └─ References:
        └─ vip_packages._id (vip_package_id)

games
    │
    ├─ Referenced by:
    │   ├─ reviews.game_id
    │   ├─ user_library.game_id
    │   ├─ translations.game_id
    │   └─ patches.appid          // NEW
    │
    └─ Primary key: _id (Steam App ID)

transactions
    │
    ├─ References:
    │   ├─ users._id (user_id)
    │   └─ vip_packages._id (metadata.vip_package_id)
    │
    └─ Unique constraint: sepay_id

vip_packages
    │
    └─ Referenced by:
        ├─ users.vip_package_id
        └─ transactions.metadata.vip_package_id
```

### 5.2 Redis Cache Dependencies

```
Redis Cache Structure
    │
    ├─ Session Management
    │   ├─ session:{token_hash}
    │   └─ user:{user_id}:session
    │
    ├─ API Caching
    │   ├─ steam:{app_id}
    │   ├─ game:{app_id}
    │   └─ user:{user_id}:permissions
    │
    ├─ Rate Limiting
    │   ├─ rate:{user_id}:{endpoint}
    │   └─ rate:{ip}:{endpoint}
    │
    └─ Download Management
        ├─ download:{uuid}
        ├─ download_count:{app_id}
        └─ patch_signed_url:{patch_id}    // NEW
```

## 6. Middleware Dependencies

### 6.1 Middleware Chain Order

```
Express Middleware Stack
    │
    ├─ 1. CORS middleware
    ├─ 2. Body parser
    ├─ 3. Request logging
    ├─ 4. Rate limiting
    ├─ 5. Authentication (JWT)
    ├─ 6. Authorization (Role/VIP)
    ├─ 7. Input validation
    ├─ 8. Route handler
    ├─ 9. Error handling
    └─ 10. Response logging
```

### 6.2 Middleware Dependencies

```
auth.middleware.js
    │
    ├─ Depends on:
    │   ├─ JWT library
    │   ├─ Redis (session check)
    │   └─ User model
    │
    └─ Used by:
        ├─ All protected routes
        └─ VIP/Admin routes

vip.middleware.js
    │
    ├─ Depends on:
    │   ├─ auth.middleware.js
    │   ├─ User model
    │   └─ Redis cache
    │
    └─ Used by:
        ├─ VIP-only game routes
        └─ Premium download routes

sepay.middleware.js
    │
    ├─ Depends on:
    │   ├─ IP whitelist config
    │   ├─ Bearer token validation
    │   └─ Timestamp validation
    │
    └─ Used by:
        └─ /api/v1/payments/webhook
```

## 7. Error Handling Dependencies

### 7.1 Error Propagation Flow

```
Database Error
    │
    ├─ Model Layer
    │   └─ Mongoose error handling
    │
    ├─ Service Layer
    │   ├─ Business logic errors
    │   └─ External API errors
    │
    ├─ Controller Layer
    │   ├─ HTTP status mapping
    │   └─ Error response formatting
    │
    ├─ Error Middleware
    │   ├─ Error logging
    │   ├─ Audit trail
    │   └─ Client response
    │
    └─ Client Handling
        ├─ Retry logic
        ├─ User notification
        └─ Fallback behavior
```

## 8. Performance Dependencies

### 8.1 Caching Strategy Dependencies

```
Request Flow with Caching
    │
    ├─ 1. Check Redis Cache
    │   ├─ Cache Hit → Return cached data
    │   └─ Cache Miss → Continue to database
    │
    ├─ 2. Database Query
    │   ├─ Execute query
    │   └─ Get results
    │
    ├─ 3. Cache Update
    │   ├─ Store in Redis
    │   └─ Set TTL
    │
    └─ 4. Return Response
        └─ Send to client
```

### 8.2 Database Optimization Dependencies

```
Query Optimization
    │
    ├─ Index Usage
    │   ├─ Compound indexes
    │   ├─ Text search indexes
    │   └─ TTL indexes
    │
    ├─ Aggregation Pipeline
    │   ├─ $match early filtering
    │   ├─ $lookup for joins
    │   └─ $group for analytics
    │
    └─ Connection Pooling
        ├─ Mongoose connection pool
        └─ Redis connection pool
```

## 9. Security Dependencies

### 9.1 Security Layer Dependencies

```
Security Stack
    │
    ├─ Transport Security
    │   ├─ HTTPS/TLS
    │   └─ Certificate validation
    │
    ├─ Authentication
    │   ├─ JWT tokens
    │   ├─ Password hashing (bcrypt)
    │   └─ Session management
    │
    ├─ Authorization
    │   ├─ Role-based access
    │   ├─ Resource permissions
    │   └─ VIP status checks
    │
    ├─ Input Validation
    │   ├─ Schema validation
    │   ├─ Sanitization
    │   └─ Rate limiting
    │
    └─ Audit & Monitoring
        ├─ Access logging
        ├─ Error tracking
        └─ Security alerts
```

## 10. Deployment Dependencies

### 10.1 Production Dependencies

```
Production Environment
    │
    ├─ Load Balancer
    │   ├─ SSL termination
    │   ├─ Health checks
    │   └─ Request routing
    │
    ├─ Application Servers
    │   ├─ Node.js instances
    │   ├─ PM2 process manager
    │   └─ Environment variables
    │
    ├─ Database Cluster
    │   ├─ MongoDB replica set
    │   ├─ Redis cluster
    │   └─ Backup systems
    │
    └─ Monitoring
        ├─ Application metrics
        ├─ Infrastructure monitoring
        └─ Log aggregation
```

## Summary

The dependency graph shows a clear separation of concerns with:

1. **Layered Architecture**: Controllers → Services → Models → Database
2. **External Integrations**: SePay, Steam API, GitHub with proper error handling
3. **Caching Strategy**: Redis for performance optimization
4. **Security**: Multi-layer security with authentication, authorization, and validation
5. **Scalability**: Horizontal scaling support with load balancing and clustering

All dependencies are designed to be loosely coupled, testable, and maintainable.
