# Kiến trúc Hệ thống - Dự án Trạm Game

## Tổng quan Kiến trúc

Hệ thống "Trạm Game" được thiết kế theo mô hình multi-tier architecture với các layer độc lập, đảm bảo khả năng mở rộng, bảo trì và bảo mật cao.

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                       │
├─────────────────────────┬───────────────────────────────────────┤
│    Desktop Client       │           Web Portal                  │
│    (C# WPF)            │           (ReactJS)                   │
│                        │                                       │
│  ┌─────────────────┐   │   ┌─────────────────────────────────┐ │
│  │ Game Library    │   │   │ Game Catalog                    │ │
│  │ Steam Integration│   │   │ User Authentication             │ │
│  │ Payment/VIP     │   │   │ Admin Dashboard                 │ │
│  │ Translation Mgmt│   │   │ Download Page                   │ │
│  └─────────────────┘   │   └─────────────────────────────────┘ │
└─────────────────────────┴───────────────────────────────────────┘
                          │
                    HTTPS/REST API
                          │
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                    Backend API Server                           │
│                      (Node.js)                                  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Controllers   │  │    Services     │  │   Middleware    │ │
│  │                 │  │                 │  │                 │ │
│  │ • Auth          │  │ • Auth          │  │ • JWT Auth      │ │
│  │ • User          │  │ • User          │  │ • VIP Check     │ │
│  │ • Game          │  │ • Game          │  │ • Admin Role    │ │
│  │ • Payment       │  │ • SePay         │  │ • Rate Limit    │ │
│  │ • VIP           │  │ • VIP           │  │ • SePay Webhook │ │
│  │ • Admin         │  │ • Download      │  │ • Validation    │ │
│  │ • GiftCode      │  │ • GiftCode      │  │ • Review Access │ │
│  │ • Community     │  │ • Steam         │  │                 │ │
│  │ • Review        │  │ • Community     │  │                 │ │
│  │ • Analytics     │  │ • Review        │  │                 │ │
│  │                 │  │ • Cache         │  │                 │ │
│  │                 │  │ • Analytics     │  │                 │ │
│  │                 │  │ • Notification  │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                          │
                    Database Queries
                          │
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                │
├─────────────────────────┬───────────────────────────────────────┤
│    Primary Database     │           Cache Layer                 │
│      (MongoDB)          │           (Redis)                     │
│                         │                                       │
│  ┌─────────────────┐   │   ┌─────────────────────────────────┐ │
│  │ Collections:    │   │   │ Cache Types:                    │ │
│  │ • Users         │   │   │ • User Sessions                 │ │
│  │ • Games         │   │   │ • Game Metadata                 │ │
│  │ • Transactions  │   │   │ • Steam API Responses           │ │
│  │ • VipPackages   │   │   │ • Download URLs                 │ │
│  │ • GiftCodes     │   │   │ • Rate Limit Counters           │ │
│  │ • Reviews       │   │   │ • Analytics Data                │ │
│  │ • AuditLogs     │   │   │                                 │ │
│  │ • Sessions      │   │   │                                 │ │
│  └─────────────────┘   │   └─────────────────────────────────┘ │
└─────────────────────────┴───────────────────────────────────────┘
```

## External Services & Integrations

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
├─────────────────────────┬───────────────────────────────────────┤
│   Payment Gateway       │        Third-party APIs              │
│      (SePay)           │                                       │
│                        │                                       │
│  ┌─────────────────┐   │   ┌─────────────────────────────────┐ │
│  │ Webhook         │   │   │ Steam API                       │ │
│  │ • IP Whitelist  │   │   │ • Game Metadata                 │ │
│  │ • Bearer Auth   │   │   │ • User Library                  │ │
│  │ • Timestamp     │   │   │ • App Details                   │ │
│  │ • Idempotency   │   │   │                                 │ │
│  │                 │   │   │ GitHub Repository               │ │
│  │ Bank Transfer   │   │   │ • Manifest Files                │ │
│  │ • QR Code       │   │   │ • Lua Scripts                   │ │
│  │ • Content Parse │   │   │ • Branch per App ID             │ │
│  └─────────────────┘   │   └─────────────────────────────────┘ │
└─────────────────────────┴───────────────────────────────────────┘
```

## Data Flow Architecture

### 1. User Authentication Flow
```
Desktop Client / Web Portal
    │
    ├─ POST /api/v1/auth/login
    │   ├─ Credential Validation
    │   ├─ Check Existing Sessions (Single Session Policy)
    │   │   └─ Invalidate Previous Sessions if Found
    │   └─ JWT Token + Session Creation
    │
    ├─ Middleware: JWT Verification
    │   ├─ Token Validation
    │   ├─ Session Existence Check
    │   └─ Single Session Policy Enforcement
    │
    ├─ Redis: Session Storage
    │   ├─ Key: user_id → session_token
    │   └─ TTL: Based on JWT expiration
    │
    └─ MongoDB: User Data
        └─ last_login, device_info tracking
```

### 2. Payment Processing Flow
```
User Bank Transfer (with username in content)
    │
    ├─ SePay Webhook POST /api/v1/payments/webhook
    │   ├─ IP Whitelist Check (configurable via env)
    │   ├─ Bearer Token Auth (Authorization: Bearer <API_KEY>)
    │   ├─ Timestamp Validation (300s window)
    │   └─ Idempotency Check (by sepay_id)
    │
    ├─ Transaction Reservation (Race Condition Protection)
    │   ├─ Check Duplicate by sepay_id
    │   └─ MongoDB: Create with status = 'processing'
    │
    ├─ Content Parsing (Regex-based)
    │   ├─ Extract Username from transfer content
    │   ├─ Find User in MongoDB
    │   └─ Handle Invalid Username → status = 'pending'
    │
    ├─ Balance/Points Update (Atomic Transaction)
    │   ├─ Convert VND to Points (1k VND = 1 point)
    │   ├─ Update user.balance += amount
    │   ├─ Update user.points += converted_points
    │   └─ Create audit log entry
    │
    └─ Transaction Completion
        ├─ MongoDB: status = 'completed'
        └─ Return success: true to SePay
```

### 3. Game Download Flow
```
Desktop Client
    │
    ├─ GET /api/v1/games (with VIP check)
    │   ├─ Filter by user access level (free/VIP)
    │   └─ Game Catalog from MongoDB
    │
    ├─ GET /api/v1/downloads/{appId}
    │   ├─ VIP/Access Validation (middleware)
    │   ├─ Check game.requires_vip vs user.vip_status
    │   ├─ Generate Signed URL (temporary, expires in 1h)
    │   └─ Proxy to GitHub Repository
    │       └─ URL: github.com/SteamAutoCracks/ManifestHub/archive/refs/heads/{appId}.zip
    │
    ├─ Download & Extract Manifest/Lua Files
    │   ├─ Download ZIP to temp directory
    │   ├─ Extract ZIP contents
    │   ├─ Copy .manifest → Steam\config\st\
    │   ├─ Copy .lua → Steam\config\depotcache\
    │   └─ Cleanup temp files
    │
    ├─ Steam Integration (SteamKit2)
    │   ├─ Detect Steam Installation Path
    │   ├─ Validate Steam is Running
    │   ├─ Add Game to Library (via manifest)
    │   └─ Refresh Steam Library
    │
    └─ Client Cleanup on Exit
        ├─ Remove temp download files
        ├─ Backup Steam directories (optional)
        └─ Restore original Steam state (if needed)
```

### 4. VIP Subscription Flow
```
User Balance Check
    │
    ├─ POST /api/v1/vip/subscribe
    │   ├─ Balance Validation (balance >= package_price)
    │   ├─ Package Selection (vipId from request)
    │   ├─ Check Current VIP Status
    │   └─ Atomic MongoDB Transaction
    │
    ├─ MongoDB Updates (within transaction):
    │   ├─ User: vip_status = 'active'
    │   ├─ User: vip_expiry = calculated_date
    │   ├─ User: vip_package_id = vipId
    │   ├─ User: balance -= package_price (only balance, not points)
    │   ├─ User: vip_history.push(vipId)
    │   └─ Transaction: VIP purchase record
    │
    ├─ Access Control Update
    │   ├─ Middleware: VIP status check on protected routes
    │   ├─ Cache invalidation for user permissions
    │   └─ Real-time access level update
    │
    └─ Balance vs Points Distinction:
        ├─ Balance: Used for VIP purchases only
        ├─ Points: Used for games, items, avatars, frames
        └─ Points can convert to Balance (not vice versa)
```

## Component Interactions

### Backend Service Dependencies
```
Controllers
    │
    ├─ Auth Controller
    │   └─ Auth Service → Redis (sessions) → MongoDB (users)
    │
    ├─ Payment Controller
    │   └─ SePay Service → Redis (cache) → MongoDB (transactions)
    │
    ├─ Game Controller
    │   └─ Game Service → Steam Service → Redis (cache) → MongoDB (games)
    │
    ├─ VIP Controller
    │   └─ VIP Service → MongoDB (users, vip_packages)
    │
    ├─ Download Controller
    │   └─ Download Service → GitHub API → Redis (signed URLs)
    │
    └─ Admin Controller
        └─ Analytics Service → MongoDB (aggregation) → Redis (cache)
```

### Client-Server Communication
```
Desktop Client (C#)
    │
    ├─ ApiService.cs
    │   ├─ HTTP Client with JWT
    │   ├─ Request/Response Models
    │   └─ Error Handling
    │
    ├─ AuthService.cs
    │   ├─ Login/Logout
    │   ├─ Token Management
    │   └─ Session Validation
    │
    ├─ GameService.cs
    │   ├─ Game Catalog Sync
    │   ├─ Download Management
    │   └─ Steam Integration
    │
    └─ SteamService.cs
        ├─ SteamKit2 Integration
        ├─ Library Detection
        └─ Game Launch
```

## Security Architecture

### Authentication & Authorization
```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Transport     │  │  Application    │  │     Data        │ │
│  │   Security      │  │    Security     │  │   Security      │ │
│  │                 │  │                 │  │                 │ │
│  │ • HTTPS/TLS     │  │ • JWT Tokens    │  │ • Encryption    │ │
│  │ • Certificate   │  │ • Role-based    │  │   at Rest       │ │
│  │   Validation    │  │   Access        │  │ • Field-level   │ │
│  │ • IP Whitelist  │  │ • Rate Limiting │  │   Encryption    │ │
│  │   (SePay)       │  │ • Input Valid.  │  │ • Audit Logs    │ │
│  │                 │  │ • CORS Policy   │  │ • Backup        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Client Security (Desktop)
```
Desktop Client Security
    │
    ├─ Application Integrity
    │   ├─ Code Signing
    │   ├─ Anti-tampering
    │   └─ Checksum Validation
    │
    ├─ Runtime Protection
    │   ├─ Memory Protection
    │   ├─ Anti-debugging
    │   └─ Process Monitoring
    │
    └─ Cleanup Mechanism
        ├─ Temp File Removal
        ├─ Registry Cleanup
        └─ Steam Directory Restore
```

## Performance & Scalability

### Caching Strategy
```
┌─────────────────────────────────────────────────────────────────┐
│                       CACHING LAYERS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Client-side   │  │   Server-side   │  │   Database      │ │
│  │     Cache       │  │     Cache       │  │     Cache       │ │
│  │                 │  │                 │  │                 │ │
│  │ • Game Metadata │  │ • Redis Cache   │  │ • Query Cache   │ │
│  │ • User Profile  │  │ • Steam API     │  │ • Index Cache   │ │
│  │ • Settings      │  │ • Download URLs │  │ • Aggregation   │ │
│  │ • Session Data  │  │ • Rate Limits   │  │   Cache         │ │
│  │                 │  │ • Analytics     │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Load Balancing & Scaling
```
Internet
    │
    ├─ Load Balancer (Nginx/HAProxy)
    │   ├─ SSL Termination
    │   ├─ Rate Limiting
    │   └─ Health Checks
    │
    ├─ Backend Instances (Horizontal Scaling)
    │   ├─ Node.js App Server 1
    │   ├─ Node.js App Server 2
    │   └─ Node.js App Server N
    │
    ├─ Database Cluster
    │   ├─ MongoDB Primary
    │   ├─ MongoDB Secondary (Read Replicas)
    │   └─ MongoDB Arbiter
    │
    └─ Cache Cluster
        ├─ Redis Master
        └─ Redis Slaves
```

## Deployment Architecture

### Development Environment
```
Developer Machine
    │
    ├─ Docker Compose
    │   ├─ Backend Container (Node.js)
    │   ├─ MongoDB Container
    │   ├─ Redis Container
    │   └─ Web Portal Container (React Dev Server)
    │
    └─ Desktop Client
        └─ Visual Studio Development
```

### Production Environment
```
Cloud Infrastructure
    │
    ├─ Application Servers
    │   ├─ Backend API (Node.js + PM2)
    │   └─ Web Portal (Static Files + CDN)
    │
    ├─ Database Servers
    │   ├─ MongoDB Cluster
    │   └─ Redis Cluster
    │
    ├─ External Services
    │   ├─ SePay Integration
    │   ├─ Steam API
    │   └─ GitHub Repository
    │
    └─ Monitoring & Logging
        ├─ Application Logs
        ├─ Performance Metrics
        └─ Error Tracking
```

## Technology Stack Summary

### Backend Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB 6.0+
- **Cache**: Redis 7.0+
- **ODM**: Mongoose
- **Authentication**: JWT
- **Validation**: Joi/Express-validator
- **Logging**: Winston
- **Testing**: Jest + Supertest

### Frontend Stack
- **Framework**: React 18+
- **Build Tool**: Vite/Create React App
- **State Management**: Context API / Redux Toolkit
- **HTTP Client**: Axios
- **UI Library**: Material-UI / Ant Design
- **Testing**: Jest + React Testing Library

### Desktop Client Stack
- **Framework**: .NET 6+ / WPF
- **Steam Integration**: SteamKit2
- **HTTP Client**: HttpClient
- **JSON**: Newtonsoft.Json
- **Logging**: NLog/Serilog
- **Installer**: WiX Toolset

### DevOps Stack
- **Containerization**: Docker
- **Orchestration**: Docker Compose / Kubernetes
- **CI/CD**: GitHub Actions / Jenkins
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

## Architecture Rationale

### Why MongoDB?
- **Flexible Schema**: Game metadata có cấu trúc đa dạng
- **JSON Native**: Tương thích tốt với Node.js và React
- **Horizontal Scaling**: Hỗ trợ sharding cho tương lai
- **Rich Queries**: Aggregation pipeline cho analytics

### Why Redis?
- **Session Storage**: Fast access cho user sessions
- **Caching**: Giảm tải cho MongoDB và external APIs
- **Rate Limiting**: Counter-based rate limiting
- **Pub/Sub**: Real-time notifications (future feature)

### Why SePay?
- **Local Payment**: Hỗ trợ ngân hàng Việt Nam
- **Webhook Support**: Real-time payment notification
- **No Credit Card**: Phù hợp với đối tượng người dùng
- **Bank Transfer**: Phương thức thanh toán phổ biến

### Why SteamKit2?
- **Direct Integration**: Tương tác trực tiếp với Steam network
- **Library Detection**: Phát hiện game đã cài đặt
- **Manifest Handling**: Quản lý Steam depot files
- **Community Support**: Thư viện mã nguồn mở ổn định

## TODO - Cần bổ sung
- **API Gateway**: Kong/AWS API Gateway cho production
- **Message Queue**: RabbitMQ/Redis Pub/Sub cho async processing
- **CDN**: CloudFlare/AWS CloudFront cho static assets
- **Backup Strategy**: Automated backup cho MongoDB
- **Disaster Recovery**: Multi-region deployment
- **Monitoring**: Health checks và alerting system
