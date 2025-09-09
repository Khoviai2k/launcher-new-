# Database Schema - Dự án Trạm Game

## Tổng quan
Tài liệu này mô tả chi tiết schema của MongoDB database cho hệ thống "Trạm Game", bao gồm tất cả collections, fields, indexes và constraints.

## Database: `tramgame_db`

### 1. Users Collection

**Collection Name**: `users`

#### Schema Structure:
```javascript
{
  _id: ObjectId,                    // Primary key
  username: String,                 // Unique username
  email: String,                    // User email (optional)
  password_hash: String,            // Bcrypt hashed password
  
  // Balance & Points
  balance: Number,                  // VND balance for VIP purchases
  points: Number,                   // Points for games/items (1k VND = 1 point)
  
  // VIP Information
  vip_status: String,               // 'active', 'expired', 'never'
  vip_expiry: Date,                 // VIP expiration date
  vip_package_id: ObjectId,         // Reference to VipPackages
  vip_history: [ObjectId],          // Array of purchased VIP packages
   
  // owned items
  item : [string],
    sources: {   vip_sub, redeem_code ,points_purchase ,etc}          
  // Profile Information
  display_name: String,             // Display name
  avatar_url: String,               // Avatar image URL
  frame_id: String,                 // Profile frame ID
  
  // Account Status
  status: String,                   // 'active', 'banned', 'suspended'
  role: String,                     // 'user', 'vip', 'admin', 'moderator'
  
  // Session & Security
  last_login: Date,                 // Last login timestamp
  last_device: String,              // Last login device info
  failed_login_attempts: Number,    // Failed login counter
  locked_until: Date,               // Account lock expiry
  
  // Timestamps
  created_at: Date,                 // Account creation
  updated_at: Date                  // Last update
}
```

#### Indexes:
```javascript
// Unique indexes
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true, sparse: true });

// Query optimization indexes
db.users.createIndex({ "vip_status": 1, "vip_expiry": 1 });
db.users.createIndex({ "status": 1, "role": 1 });
db.users.createIndex({ "created_at": -1 });

// NEW: Items queries
db.users.createIndex({ "items": 1 });
```

#### Constraints:
- `username`: Required, unique, 3-50 characters
- `password_hash`: Required
- `balance`: Default 0, minimum 0
- `points`: Default 0, minimum 0
- `vip_status`: Enum ['active', 'expired', 'never']
- `status`: Enum ['active', 'banned', 'suspended']
- `role`: Enum ['user', 'vip', 'admin', 'moderator']
- NEW: `items`: Array of strings; each item ID follows rules:
  - bắt đầu bằng số → Game (ví dụ: "10")
  - bắt đầu bằng "a_" → Avatar
  - bắt đầu bằng "f_" → Frame
- NEW: `item_sources`: map item_id → source ('vip_sub', 'redeem_code', 'points_purchase', 'admin_grant', ...)

### 2. Games Collection

**Collection Name**: `games`

#### Schema Structure:
```javascript
{
  _id: String,                      // Steam App ID (e.g., "570")
  name: String,                     // Game name
  
  // Access Control
  is_free: Boolean,                 // Free for all users
  requires_vip: Boolean,            // Requires VIP access
  free_until: Date,                 // Free access until date (optional)
  
  // GitHub Repository Info
  last_commit_date: Date,           // Last commit in GitHub repo
  last_commit_sha: String,          // Last commit SHA
  
  // Steam Integration 
  steam_data: {
    price: Number,                  // Steam price
    categories: [String],           // Game categories
    screenshots: [String],          // Screenshot URLs
    description: String,            // Game description
    release_date: String,           // Release date
    developer: String,              // Developer name
    publisher: String               // Publisher name
  },
  
  // Translation Info
  translation_data: {
    available: Boolean,             // Has Vietnamese translation
    author: String,                 // Translation author
    version: String,                // Translation version
    last_updated: Date,             // Translation last update
    download_url: String            // Translation download URL
  },
  
  // Statistics
  stats: {
    downloads: Number,              // Total downloads
    rating: Number,                 // Average rating (1-5)
    reviews_count: Number,          // Total reviews
    last_downloaded: Date           // Last download timestamp
  },
  
  // Timestamps
  created_at: Date,
  updated_at: Date
}
```

#### Indexes:
```javascript
// Primary access patterns
db.games.createIndex({ "requires_vip": 1, "is_free": 1 });
db.games.createIndex({ "free_until": 1 });
db.games.createIndex({ "translation_data.available": 1 });

// Search and sorting
db.games.createIndex({ "name": "text" });
db.games.createIndex({ "stats.rating": -1 });
db.games.createIndex({ "stats.downloads": -1 });
db.games.createIndex({ "updated_at": -1 });
```

#### Constraints:
- `_id`: Required, unique Steam App ID
- `name`: Required
- `is_free`: Default false
- `requires_vip`: Default true
- `stats.downloads`: Default 0
- `stats.rating`: Default 0, range 0-5
- `stats.reviews_count`: Default 0

### 3. Transactions Collection

**Collection Name**: `transactions`

#### Schema Structure:
```javascript
{
  _id: ObjectId,                    // Primary key
  user_id: ObjectId,                // Reference to Users
  
  // Transaction Details
  type: String,                     // 'payment', 'vip_purchase', 'gift_redeem', 'points_conversion'
  amount: Number,                   // Transaction amount (VND)
  currency: String,                 // 'VND'
  
  // Payment Gateway Info (SePay)
  sepay_id: Number,                 // SePay transaction ID (unique)
  gateway: String,                  // Bank name (e.g., 'Vietcombank')
  reference_code: String,           // Bank reference code
  transfer_content: String,         // Transfer content with username
  
  // Transaction Status
  status: String,                   // 'pending', 'processing', 'completed', 'failed', 'cancelled'
  
  // Balance Changes
  balance_before: Number,           // Balance before transaction
  balance_after: Number,            // Balance after transaction
  points_before: Number,            // Points before transaction
  points_after: Number,             // Points after transaction
  
  // Metadata
  metadata: {
    vip_package_id: ObjectId,       // For VIP purchases
    gift_code_id: ObjectId,         // For gift code redemptions
    conversion_rate: Number,        // For points conversion
    admin_id: ObjectId,             // For admin actions
    notes: String                   // Additional notes
  },
  
  // Timestamps
  transaction_date: Date,           // SePay transaction date
  created_at: Date,
  updated_at: Date
}
```

#### Indexes:
```javascript
// Unique constraint for SePay
db.transactions.createIndex({ "sepay_id": 1 }, { unique: true, sparse: true });

// Query optimization
db.transactions.createIndex({ "user_id": 1, "created_at": -1 });
db.transactions.createIndex({ "status": 1, "type": 1 });
db.transactions.createIndex({ "transaction_date": -1 });
db.transactions.createIndex({ "reference_code": 1 });
```

#### Constraints:
- `user_id`: Required, reference to Users
- `type`: Required, enum ['payment', 'vip_purchase', 'gift_redeem', 'points_conversion']
- `amount`: Required, minimum 0
- `status`: Required, enum ['pending', 'processing', 'completed', 'failed', 'cancelled']
- `sepay_id`: Unique when present

### 4. VipPackages Collection

**Collection Name**: `vip_packages`

#### Schema Structure:
```javascript
{
  _id: ObjectId,                    // Primary key
  name: String,                     // Package name (e.g., "VIP 1 Month")
  description: String,              // Package description
  
  // Pricing
  price: Number,                    // Price in VND
  duration_days: Number,            // Duration in days
  
  // Features
  features: [String],               // List of features
  
  // Access Control
  game_access: String,              // 'all', 'premium', 'specific'
  download_limit: Number,           // Downloads per day (-1 = unlimited)
  
  // Status
  active: Boolean,                  // Package available for purchase
  sort_order: Number,               // Display order
  
  // Timestamps
  created_at: Date,
  updated_at: Date
}
```

#### Indexes:
```javascript
db.vip_packages.createIndex({ "active": 1, "sort_order": 1 });
db.vip_packages.createIndex({ "price": 1 });
```

#### Constraints:
- `name`: Required, unique
- `price`: Required, minimum 0
- `duration_days`: Required, minimum 1
- `active`: Default true

### 5. Reviews Collection
loại bỏ 

### 6. GiftCodes Collection

**Collection Name**: `gift_codes`

#### Schema Structure:
```javascript
{
  _id: ObjectId,                    // Primary key
  code: String,                     // Gift code (unique)
  
  // Reward Details
  reward_type: String,              // 'balance', 'points', 'vip', 'game'
  reward_value: Number,             // Reward amount/duration
  reward_metadata: {
    vip_package_id: ObjectId,       // For VIP rewards
    game_id: String,                // For game rewards
    description: String             // Reward description
  },
  
  // Usage Control
  usage_limit: Number,              // Max usage count (-1 = unlimited)
  used_count: Number,               // Current usage count
  expiry_date: Date,                // Expiration date
  
  // Usage History
  used_by: [{
    user_id: ObjectId,
    used_at: Date,
    ip_address: String
  }],
  
  // Creation Info
  created_by: ObjectId,             // Admin who created
  batch_id: String,                 // Batch identifier
  
  // Status
  active: Boolean,                  // Code is active
  
  // Timestamps
  created_at: Date,
  updated_at: Date
}
```

#### Indexes:
```javascript
db.gift_codes.createIndex({ "code": 1 }, { unique: true });
db.gift_codes.createIndex({ "active": 1, "expiry_date": 1 });
db.gift_codes.createIndex({ "batch_id": 1 });
db.gift_codes.createIndex({ "created_by": 1, "created_at": -1 });
```

#### Constraints:
- `code`: Required, unique
- `reward_type`: Required, enum ['balance', 'points', 'vip', 'game']
- `reward_value`: Required, minimum 0
- `usage_limit`: Default 1, minimum -1
- `used_count`: Default 0
- `active`: Default true

### 7. AuditLogs Collection

**Collection Name**: `audit_logs`

#### Schema Structure:
```javascript
{
  _id: ObjectId,                    // Primary key
  
  // Actor Information
  user_id: ObjectId,                // User who performed action
  admin_id: ObjectId,               // Admin who performed action (if applicable)
  ip_address: String,               // IP address
  user_agent: String,               // User agent string
  
  // Action Details
  action: String,                   // Action performed
  resource_type: String,            // Type of resource affected
  resource_id: String,              // ID of affected resource
  
  // Changes
  old_values: Object,               // Previous values
  new_values: Object,               // New values
  
  // Context
  metadata: {
    request_id: String,             // Request correlation ID
    session_id: String,             // Session ID
    api_endpoint: String,           // API endpoint called
    method: String,                 // HTTP method
    status_code: Number             // Response status code
  },
  
  // Timestamp
  timestamp: Date                   // Action timestamp
}
```

#### Indexes:
```javascript
db.audit_logs.createIndex({ "timestamp": -1 });
db.audit_logs.createIndex({ "user_id": 1, "timestamp": -1 });
db.audit_logs.createIndex({ "action": 1, "resource_type": 1 });
db.audit_logs.createIndex({ "ip_address": 1, "timestamp": -1 });

// TTL index - auto-delete logs after 1 year
db.audit_logs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 31536000 });
```

#### Constraints:
- `action`: Required
- `resource_type`: Required
- `timestamp`: Required, default current date

### 8. Sessions Collection

**Collection Name**: `sessions`

#### Schema Structure:
```javascript
{
  _id: ObjectId,                    // Primary key
  user_id: ObjectId,                // Reference to Users
  session_token: String,            // JWT token hash
  
  // Session Details
  device_info: String,              // Device information
  ip_address: String,               // IP address
  user_agent: String,               // User agent
  
  // Status
  active: Boolean,                  // Session is active
  expires_at: Date,                 // Session expiry
  
  // Timestamps
  created_at: Date,
  last_accessed: Date
}
```

#### Indexes:
```javascript
db.sessions.createIndex({ "session_token": 1 }, { unique: true });
db.sessions.createIndex({ "user_id": 1, "active": 1 });
db.sessions.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 });
```

#### Constraints:
- `user_id`: Required, reference to Users
- `session_token`: Required, unique
- `active`: Default true
- `expires_at`: Required

## Database Configuration

### Connection Settings:
```javascript
// MongoDB Connection URI
mongodb://username:password@localhost:27017/tramgame_db?authSource=admin

// Connection Options
{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}
```

### Mongoose Configuration:
```javascript
// Global schema options
mongoose.set('timestamps', true);
mongoose.set('toJSON', { virtuals: true });
mongoose.set('toObject', { virtuals: true });

// Connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};
```

## Data Validation Rules

### User Validation:
- Username: 3-50 characters, alphanumeric + underscore
- Password: Minimum 6 characters(không yêu gì thêm), bcrypt hashed
- Email: Valid email format (optional)
- Balance/Points: Non-negative numbers

### Transaction Validation:
- Amount: Positive number for payments
- SePay ID: Unique across all transactions
- Status transitions: pending → processing → completed/failed

### Game Validation:
- App ID: Valid Steam App ID format
- Access flags: Consistent logic (free games don't require VIP)

### Security Considerations:
- All sensitive data encrypted at rest
- Password hashes use bcrypt with salt rounds ≥ 12
- Session tokens are JWT with short expiry
- Audit logs for all critical operations
- IP address logging for security tracking

### 9. UserLibrary Collection

**Collection Name**: `user_library`

#### Schema Structure:
```javascript
{
  _id: ObjectId,                    // Primary key
  user_id: ObjectId,                // Reference to Users
  game_id: String,                  // Reference to Games (App ID)

  // Acquisition Details
  acquired_via: String,             // 'download', 'gift_code', 'admin_grant'
  acquired_at: Date,                // When user got access

  // Download History
  download_count: Number,           // Number of times downloaded
  last_downloaded: Date,            // Last download timestamp

  // Status
  active: Boolean,                  // User still has access

  // Timestamps
  created_at: Date,
  updated_at: Date
}
```

#### Indexes:
```javascript
// Unique constraint - one entry per user per game
db.user_library.createIndex({ "user_id": 1, "game_id": 1 }, { unique: true });
db.user_library.createIndex({ "user_id": 1, "active": 1 });
db.user_library.createIndex({ "acquired_at": -1 });
```

### 10. Translations Collection

**Collection Name**: `translations`

#### Schema Structure:
```javascript
{
  _id: ObjectId,                    // Primary key
  game_id: String,                  // Reference to Games (App ID)

  // Translation Details
  name: String,                     // Translation name
  language: String,                 // Language code (e.g., 'vi')
  version: String,                  // Translation version

  // Author Information
  author: String,                   // Translator name
  author_contact: String,           // Contact information
  team: String,                     // Translation team

  // File Information
  file_size: Number,                // File size in bytes
  download_url: String,             // Download URL
  checksum: String,                 // File checksum for integrity

  // Access Control
  is_free: Boolean,                 // Free translation
  requires_vip: Boolean,            // Requires VIP access

  // Statistics
  download_count: Number,           // Total downloads
  rating: Number,                   // Average rating

  // Status
  status: String,                   // 'active', 'deprecated', 'removed'

  // Timestamps
  created_at: Date,
  updated_at: Date
}
```

#### Indexes:
```javascript
db.translations.createIndex({ "game_id": 1, "status": 1 });
db.translations.createIndex({ "language": 1, "is_free": 1 });
db.translations.createIndex({ "author": 1 });
```

### 11. Notifications Collection

**Collection Name**: `notifications`

#### Schema Structure:
```javascript
{
  _id: ObjectId,                    // Primary key
  user_id: ObjectId,                // Reference to Users

  // Notification Content
  type: String,                     // 'system', 'payment', 'vip', 'game', 'admin'
  title: String,                    // Notification title
  message: String,                  // Notification message

  // Metadata
  metadata: {
    game_id: String,                // Related game
    transaction_id: ObjectId,       // Related transaction
    action_url: String,             // Action URL
    icon: String                    // Notification icon
  },

  // Status
  read: Boolean,                    // User has read notification
  read_at: Date,                    // When user read it

  // Delivery
  delivery_method: [String],        // ['in_app', 'email', 'push']
  delivered: Boolean,               // Successfully delivered

  // Timestamps
  created_at: Date,
  expires_at: Date                  // Notification expiry
}
```

#### Indexes:
```javascript
db.notifications.createIndex({ "user_id": 1, "read": 1, "created_at": -1 });
db.notifications.createIndex({ "type": 1, "created_at": -1 });
db.notifications.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 });
```

### 12. Patches Collection (NEW)

**Collection Name**: `patches`

#### Schema Structure:
```javascript
{
  _id: ObjectId,                  // Primary key
  appid: String,                  // Steam App ID (links to games._id)
  author: String,                 // Patch author
  description: String,            // Patch description
  size: Number,                   // File size in bytes
  download_url: String,           // Cloud storage object key or canonical URL

  // Optional metadata
  version: String,
  created_at: Date,
  updated_at: Date
}
```

#### Indexes:
```javascript
db.patches.createIndex({ appid: 1 });
db.patches.createIndex({ author: 1 });
db.patches.createIndex({ updated_at: -1 });
```

#### Constraints:
- `appid`: Required; must exist in `games`.
- `author`: Required
- `description`: Required
- `size`: Required, > 0
- `download_url`: Required (not public; used to derive signed URL)

## Additional Schema Considerations

### User Library Management:
- Track which games user has access to
- Support for gift code redemptions
- Download history tracking
- Access revocation capability

### Translation Management:
- Multiple translations per game
- Version control for translations
- Author attribution and contact
- Quality ratings and reviews

### Notification System:
- Multi-channel delivery support
- Expiration and cleanup
- Read status tracking
- Rich metadata support

## Backup Strategy:
- Daily automated backups
- Point-in-time recovery capability
- Replica set for high availability
- Backup retention: 30 days daily, 12 months monthly
