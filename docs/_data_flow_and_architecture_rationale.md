# Data Flow và Architecture Rationale - Dự án Trạm Game

## Tổng quan
Tài liệu này mô tả chi tiết luồng dữ liệu chính trong hệ thống "Trạm Game" và giải thích lý do lựa chọn các công nghệ cốt lõi.

## 1. Main Data Flow - Luồng dữ liệu chính

### 1.1 User Journey Flow
```
User Registration/Login → Authentication → Payment/Top-up → VIP Subscription → Game Access → Download 

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Access   │ -> │  Authentication │ -> │   Payment       │ -> │  VIP Purchase   │
│   (Web/Client)  │    │   & Session     │    │  (SePay)        │    │  (Balance)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       
         v                       v                       v                       
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    
│   Game Access   │ -> │  Game Download  │ -> │ Steam Integration│ 
│   (Catalog)     │    │  (GitHub Proxy) │    │  (SteamKit2)    │    
└─────────────────┘    └─────────────────┘    └─────────────────┘    
```

### 1.2 Detailed Data Flow Steps

#### Step 1: User Registration/Login
```
Input: User credentials (username, password)
Process:
  1. Web Portal/Desktop Client → Backend API
  2. Credential validation against MongoDB
  3. Single session policy check in Redis
  4. JWT token generation
  5. Session storage in Redis
Output: JWT token, user profile, session info

Data Flow:
Client → POST /api/v1/auth/login → Auth Controller → Auth Service → MongoDB (users) + Redis (sessions)
```

#### Step 2: Payment Processing
```
Input: Bank transfer with username in content
Process:
  1. SePay webhook → Backend API
  2. IP whitelist + Bearer token validation
  3. Idempotency check by sepay_id
  4. Transaction reservation (status: processing)
  5. Username parsing from transfer content
  6. Balance/Points update (atomic transaction)
  7. Transaction completion (status: completed)
Output: Updated user balance/points, transaction record

Data Flow:
SePay → POST /api/v1/payments/webhook → Payment Controller → SePay Service → MongoDB (transactions, users)
```

#### Step 3: VIP Subscription
```
Input: VIP package selection, user balance
Process:
  1. Balance validation (>= package price)
  2. Atomic MongoDB transaction:
     - Deduct balance
     - Update VIP status/expiry
     - Create transaction record
  3. Cache invalidation for user permissions
Output: Active VIP status, updated balance, transaction record

Data Flow:
Client → POST /api/v1/vip/subscribe → VIP Controller → VIP Service → MongoDB (users, vip_packages, transactions)
```

#### Step 4: Game Access & Download

Input: Game request, user VIP status
Process:
  1. Resolve game access flags (order of precedence):
     - If game.free === true => allow access (global free)
     - Else if game.free_until && now < game.free_until => allow access (temporary free)
     - Else if game.is_free === true => allow access (legacy flag)
     - Else if game.requires_vip === true => require VIP membership
     - Else => allow access
  2. Permission check implementation returns 403 if not allowed
  3. Signed URL generation (1h expiry)
  4. GitHub repository proxy
  5. File download and extraction
  6. Steam directory operations
Output: Game files in Steam directories

Data Flow:
Client → GET /api/v1/downloads/{appId} → Download Controller → Download Service → Permission Check → GitHub API → Steam Directories
```

#### Step 5: Steam Integration
```
Input: Manifest/Lua files, Steam installation
Process:
  1. Steam detection and validation
  2. File copy to Steam directories:
     - .manifest → Steam\config\st\
     - .lua → Steam\config\depotcache\
  3. Steam library refresh via SteamKit2
  4. Game appears in Steam library
Output: Game available in Steam

Data Flow:
Client → Steam Service → SteamKit2 → Steam Network → Local Steam Installation
```

#### Step 6: Community Interaction
```
Loại bỏ chức năng Community Interaction
```

#### Step 7: Gift Code Redemption
```
Input: Gift code from user
Process:
  1. Gift code validation (exists, not expired, usage limits)
  2. User eligibility check
  3. Reward application (balance, points, games, items)
  4. Code usage marking
  5. Redemption logging
Output: Reward applied to user account

Data Flow:
Client → POST /api/v1/giftcodes/redeem → GiftCode Controller → GiftCode Service → MongoDB (giftcodes, users)
```

#### Step 8: Admin Analytics
```
Input: Date range, metric types
Process:
  1. Data aggregation from multiple collections
  2. KPI calculations (downloads, payments, active users, vip users)
  3. Trend analysis
  4. Report generation
  5. Cache results for dashboard
Output: Analytics dashboard data

Data Flow:
Admin Panel → GET /api/v1/admin/analytics → Analytics Controller → Analytics Service → MongoDB (aggregation) → Redis (cache)
```

## 2. Data Storage Architecture

### 2.1 MongoDB Collections Structure
```
┌─────────────────────────────────────────────────────────────────┐
│                        MongoDB Database                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │     Users       │  │     Games       │  │  Transactions   │ │
│  │                 │  │                 │  │                 │ │
│  │ • _id           │  │ • _id (app_id)  │  │ • _id           │ │
│  │ • username      │  │ • name          │  │ • user_id       │ │
│  │ • password_hash │  │ • is_free       │  │ • type          │ │
│  │ • balance       │  │ • requires_vip  │  │ • amount        │ │
│  │ • points        │  │ • free_until    │  │ • status        │ │
│  │ • vip_status    │  │ • last_commit   │  │ • sepay_id      │ │
│  │ • vip_expiry    │  │ • updated_at    │  │ • created_at    │ │
│  │ • created_at    │  │                 │  │                 │ │
│  │ • item owned    │  │                 │  │                 │ │
│  │ (game,avt,frame)│  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   VipPackages   │  │    Reviews      │  │   GiftCodes     │ │
│  │                 │  │                 │  │                 │ │
│  │ • _id           │  │                 │  │ • _id           │ │
│  │ • name          │  │     Loại  bỏ    │  │ • code          │ │
│  │ • price         │  │                 │  │ • reward_type   │ │
│  │ • duration      │  │                 │  │ • reward_value  │ │
│  │ • features      │  │                 │  │ • expiry        │ │
│  │ • active        │  │                 │  │ • used_by       │ │
│  │                 │  │                 │  │ • used_at       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │   AuditLogs     │  │    Sessions     │                      │
│  │                 │  │                 │                      │
│  │ • _id           │  │ • _id           │                      │
│  │ • user_id       │  │ • user_id       │                      │
│  │ • action        │  │ • session_token │                      │
│  │ • resource      │  │ • expires_at    │                      │
│  │ • metadata      │  │ • device_info   │                      │
│  │ • timestamp     │  │ • created_at    │                      │
│  │                 │  │                 │                      │
│  └─────────────────┘  └─────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Redis Cache Structure
```
┌─────────────────────────────────────────────────────────────────┐
│                         Redis Cache                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Sessions      │  │   Game Cache    │  │  Rate Limits    │ │
│  │                 │  │                 │  │                 │ │
│  │ Key Pattern:    │  │ Key Pattern:    │  │ Key Pattern:    │ │
│  │ session:{token} │  │ game:{app_id}   │  │ rate:{user_id}  │ │
│  │                 │  │ steam:{app_id}  │  │ rate:{ip}       │ │
│  │ Value:          │  │                 │  │                 │ │
│  │ {               │  │ Value:          │  │ Value:          │ │
│  │   user_id,      │  │ {               │  │ {               │ │
│  │   permissions,  │  │   metadata,     │  │   count,        │ │
│  │   vip_status,   │  │   steam_data,   │  │   window_start, │ │
│  │   expires_at    │  │   cached_at     │  │   expires_at    │ │
│  │ }               │  │ }               │  │ }               │ │
│  │                 │  │                 │  │                 │ │
│  │ TTL: 24h        │  │ TTL: 1h         │  │ TTL: 1h         │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │ Download URLs   │  │   Analytics     │                      │
│  │                 │  │                 │                      │
│  │ Key Pattern:    │  │ Key Pattern:    │  │                      │
│  │ download:{uuid} │  │ stats:{date}    │                      │
│  │                 │  │ metrics:{type}  │                      │
│  │ Value:          │  │ Value:          │                      │
│  │ {               │  │ {               │                      │
│  │   app_id,       │  │   downloads,    │                      │
│  │   user_id,      │  │   registrations,│                      │
│  │   github_url,   │  │   payments,     │                      │
│  │   expires_at    │  │   active_users  │                      │
│  │ }               │  │ }               │                      │
│  │ TTL: 1h         │  │ TTL: 24h        │                      │
│  └─────────────────┘  └─────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Architecture Rationale - Lý do lựa chọn công nghệ

### 3.1 Tại sao chọn MongoDB?

#### Ưu điểm phù hợp với dự án:
1. **Flexible Schema**: Game metadata có cấu trúc đa dạng và thay đổi thường xuyên
   - Steam API trả về JSON với nhiều fields khác nhau
   - Game properties có thể mở rộng (tags, categories, achievements)
   - User profiles có thể có custom fields

2. **JSON Native Support**: 
   - Frontend (React) và Backend (Node.js) đều làm việc với JSON
   - Không cần ORM mapping phức tạp
   - API responses trực tiếp từ database

3. **Aggregation Pipeline**: 
   - Analytics queries phức tạp (user stats, game popularity)
   - Real-time reporting cho admin dashboard
   - Complex filtering cho game catalog

4. **Horizontal Scaling**: 
   - Sharding support cho tương lai khi user base lớn
   - Replica sets cho high availability
   - Read replicas cho analytics queries

#### Ví dụ cụ thể:
```javascript
// Game document structure - flexible và mở rộng được
{
  "_id": "570", // Steam App ID
  "name": "Dota 2",
  "is_free": true,
  "requires_vip": false,
  "free_until": null,
  "steam_data": {
    "price": 0,
    "categories": ["Multiplayer", "MOBA"],
    "screenshots": [...],
    "achievements": {...}
  },
  "translation_data": {
    "available": true,
    "author": "Vietnamese Team",
    "version": "1.2.3",
    "last_updated": "2024-01-15"
  },
  "stats": {
    "downloads": 15420,
    "rating": 4.5,
    "reviews_count": 234
  }
}
```

### 3.2 Tại sao chọn Redis?

#### Ưu điểm phù hợp với dự án:
1. **Session Management**: 
   - Single session policy cần fast lookup
   - Session invalidation khi user login từ device khác
   - TTL tự động cho session expiry

2. **Caching Layer**: 
   - Steam API responses (expensive external calls)
   - Game metadata (frequently accessed)
   - User permissions (checked on every request)

3. **Rate Limiting**: 
   - API rate limiting per user/IP
   - Download throttling
   - Webhook spam protection

4. **Real-time Features**: 
   - Pub/Sub cho notifications (future feature)
   - Live analytics counters
   - Real-time user status

#### Ví dụ cụ thể:
```javascript
// Session storage pattern
SET session:jwt_token_hash {
  "user_id": "user123",
  "vip_status": "active",
  "vip_expiry": "2024-12-31",
  "permissions": ["download", "review"],
  "device_info": "Windows 11 - Chrome"
} EX 86400

// Rate limiting pattern
INCR rate:user123:download
EXPIRE rate:user123:download 3600
// Allow max 10 downloads per hour
```

### 3.3 Tại sao chọn SePay?

#### Ưu điểm phù hợp với thị trường Việt Nam:
1. **Local Payment Support**: 
   - Hỗ trợ tất cả ngân hàng Việt Nam
   - Không cần credit card (phù hợp với target audience)
   - Bank transfer - phương thức phổ biến nhất

2. **Real-time Webhook**: 
   - Instant payment confirmation
   - Automatic balance update
   - No manual verification needed

3. **Content-based Identification**: 
   - Username trong nội dung chuyển khoản
   - Automatic user matching
   - Reduced fraud risk

4. **Cost Effective**: 
   - Lower fees compared to international gateways
   - No setup fees
   - Transparent pricing

#### Payment Flow Example:
```
User: "Chuyển 50,000 VND với nội dung: user123 nap tien"
↓
SePay Webhook: {
  "transferAmount": 50000,
  "content": "user123 nap tien",
  "id": 12345
}
↓
Backend Processing:
- Parse username: "user123"
- Find user in MongoDB
- Update: balance += 50000, points += 50
- Create transaction record
```

### 3.4 Tại sao chọn SteamKit2?

#### Ưu điểm cho Steam integration:
1. **Direct Steam Network Access**: 
   - Bypass Steam Web API limitations
   - Access to internal Steam protocols
   - Real-time Steam status

2. **Library Management**: 
   - Direct manipulation of Steam library
   - Manifest file handling
   - Depot cache management

3. **Community Support**: 
   - Well-maintained open source library
   - Extensive documentation
   - Active community

4. **C# Native**: 
   - Perfect fit với desktop client (C# WPF)
   - Strong typing và IntelliSense
   - Async/await support

## 4. Data Consistency & Integrity

### 4.1 ACID Transactions
```javascript
// VIP Purchase - Atomic Transaction
const session = await mongoose.startSession();
session.startTransaction();

try {
  // 1. Deduct balance
  await User.updateOne(
    { _id: userId, balance: { $gte: packagePrice } },
    { 
      $inc: { balance: -packagePrice },
      $set: { 
        vip_status: 'active',
        vip_expiry: expiryDate,
        vip_package_id: packageId
      },
      $push: { vip_history: packageId }
    },
    { session }
  );

  // 2. Create transaction record
  await Transaction.create([{
    user_id: userId,
    type: 'vip_purchase',
    amount: packagePrice,
    status: 'completed',
    metadata: { package_id: packageId }
  }], { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 4.2 Idempotency Handling
```javascript
// Payment Webhook - Idempotency
async function processPaymentWebhook(payload) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check for duplicate
    const existing = await Transaction.findOne({ 
      sepay_id: payload.id 
    }).session(session);
    
    if (existing) {
      return { success: true, duplicate: true };
    }

    // Reserve transaction
    const transaction = new Transaction({
      sepay_id: payload.id,
      status: 'processing',
      // ... other fields
    });
    await transaction.save({ session });

    // Process payment
    await processPaymentContent(payload, session);
    
    await session.commitTransaction();
    return { success: true };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  }
}
```

## 5. Performance Optimization

### 5.1 Caching Strategy
```
┌─────────────────────────────────────────────────────────────────┐
│                    Multi-Level Caching                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Level 1: Application Cache (In-Memory)                         │
│  ├─ User permissions (5 minutes)                                │
│  ├─ VIP status (10 minutes)                                     │
│  └─ App configuration (1 hour)                                  │
│                                                                 │
│  Level 2: Redis Cache (Distributed)                             │
│  ├─ Steam API responses (1 hour)                                │
│  ├─ Game metadata (30 minutes)                                  │
│  ├─ User sessions (24 hours)                                    │
│  └─ Download URLs (1 hour)                                      │
│                                                                 │
│  Level 3: Database Indexes (MongoDB)                            │
│  ├─ User lookup: { username: 1 }                                │
│  ├─ Game access: { requires_vip: 1, is_free: 1 }               │
│  ├─ Transaction lookup: { sepay_id: 1 }                         │
│  └─ Session lookup: { user_id: 1, expires_at: 1 }              │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Database Optimization
```javascript
// Compound indexes for common queries
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "vip_status": 1, "vip_expiry": 1 });
db.games.createIndex({ "requires_vip": 1, "is_free": 1 });
db.transactions.createIndex({ "sepay_id": 1 }, { unique: true });
db.transactions.createIndex({ "user_id": 1, "created_at": -1 });
db.reviews.createIndex({ "game_id": 1, "created_at": -1 });

// Aggregation pipeline optimization
db.games.aggregate([
  { $match: { $or: [{ is_free: true }, { requires_vip: false }] } },
  { $lookup: { from: "reviews", localField: "_id", foreignField: "game_id", as: "reviews" } },
  { $addFields: { avg_rating: { $avg: "$reviews.rating" } } },
  { $sort: { avg_rating: -1 } },
  { $limit: 20 }
]);
```

## 6. Security Considerations

### 6.1 Data Protection
- **Encryption at Rest**: MongoDB encryption
- **Encryption in Transit**: HTTPS/TLS for all communications
- **Field-level Encryption**: Sensitive user data
- **JWT Security**: Short expiry, secure signing

### 6.2 Access Control
- **Role-based Access**: User/VIP/Admin roles
- **Resource-level Permissions**: Per-game access control
- **Rate Limiting**: API abuse prevention
- **Input Validation**: All user inputs sanitized

## 7. Scalability Considerations

---

## Cập nhật luồng dữ liệu (2025-09-09)

### Step 9: Item Sync on Login
```
Client (Desktop/Web)
    │
    ├─ POST /api/v1/auth/login → nhận JWT + user_id
    │
    ├─ GET /api/v1/user/items (Bearer)
    │   ├─ UserService → MongoDB(users)
    │   └─ Trả về: items[], item_sources{}
    │
    └─ (Tùy chọn) POST /api/v1/user/items/sync
        ├─ Gửi device_items[]
        ├─ ItemService hợp nhất (ưu tiên server), áp rules VIP hết hạn với source=vip_sub
        └─ Ghi audit + cập nhật users.items
```

### Step 10: Patch Download via Signed URL
```
Client
    │
    ├─ GET /api/v1/patches/{appid}
    │   └─ PatchService → MongoDB(patches) → trả danh sách patches
    │
    ├─ GET /api/v1/patches/download/{id}
    │   ├─ PatchService kiểm tra quyền (VIP/points/giftcode)
    │   └─ CloudStorageService tạo Signed URL (TTL ~ 1h)
    │
    └─ Client tải trực tiếp từ Cloud Storage (không đi qua Backend)
```

### Rationale bổ sung
- Signed URL giảm băng thông backend và tăng throughput tải file lớn (patches).
- Item sync sau đăng nhập đảm bảo trải nghiệm đa thiết bị nhất quán, tránh drift dữ liệu do offline changes.

### 7.1 Horizontal Scaling
- **Database Sharding**: User-based sharding strategy
- **Load Balancing**: Multiple backend instances
- **CDN Integration**: Static asset delivery
- **Microservices**: Future service decomposition

### 7.2 Monitoring & Observability
- **Application Metrics**: Response times, error rates
- **Business Metrics**: Downloads, payments, user growth
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Alerting**: Automated incident response

## TODO - Future Enhancements
- **Message Queue**: RabbitMQ for async processing
- **Search Engine**: Elasticsearch for advanced game search
- **CDN**: CloudFlare for global content delivery
- **Monitoring**: Prometheus + Grafana stack
- **Backup Strategy**: Automated MongoDB backups
- **Disaster Recovery**: Multi-region deployment
