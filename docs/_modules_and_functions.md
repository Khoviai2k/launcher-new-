# Modules và Functions - Dự án Trạm Game

## Tổng quan
Tài liệu này mô tả chi tiết tất cả các module trong hệ thống "Trạm Game", bao gồm chức năng chính, input/output và business logic của từng module.

## 1. Authentication Module (AUTH)

### Chức năng chính:
- Đăng nhập/đăng xuất người dùng
- Quản lý phiên đăng nhập (single session policy)
- Xác thực JWT token
- Quản lý quyền truy cập

### Functions:

#### 1.1 User Login
- **Input**: `{ username, password, device_info }`
- **Output**: `{ jwt_token, user_profile, expires_in }`
- **Logic**: 
  - Validate credentials
  - Check existing sessions → invalidate if found
  - Create new session in Redis
  - Generate JWT token
  - Update last_login in MongoDB

#### 1.2 User Logout
- **Input**: `{ jwt_token }`
- **Output**: `{ success: true }`
- **Logic**:
  - Validate JWT token
  - Remove session from Redis
  - Blacklist token (optional)

#### 1.3 Session Validation
- **Input**: `{ jwt_token }`
- **Output**: `{ user_id, permissions, vip_status }`
- **Logic**:
  - Verify JWT signature
  - Check session exists in Redis
  - Return user context

#### 1.4 Single Session Enforcement
- **Input**: `{ user_id, new_session_token }`
- **Output**: `{ previous_sessions_invalidated }`
- **Logic**:
  - Find existing sessions for user
  - Invalidate all previous sessions
  - Store new session

## 2. Payment Module (PAYMENT)

### Chức năng chính:
- Xử lý webhook từ SePay
- Quản lý balance và points
- Tạo QR code thanh toán
- Idempotency handling

### Functions:

#### 2.1 SePay Webhook Processing
- **Input**: `{ sepay_webhook_payload }`
- **Output**: `{ success: true, transaction_id }`
- **Logic**:
  - Validate IP whitelist
  - Verify Bearer token
  - Check timestamp window
  - Idempotency check by sepay_id
  - Reserve transaction (status: processing)
  - Parse username from content
  - Update user balance/points
  - Complete transaction

#### 2.2 Generate Payment QR
- **Input**: `{ user_id, amount }`
- **Output**: `{ qr_code_data, reference_code, bank_info }`
- **Logic**:
  - Generate unique reference code
  - Create pending transaction
  - Generate QR code with bank info
  - Return payment details

#### 2.3 Balance/Points Conversion
- **Input**: `{ vnd_amount }`
- **Output**: `{ balance_added, points_added }`
- **Logic**:
  - balance += vnd_amount
  - points += (vnd_amount / 1000) // 1k VND = 1 point

#### 2.4 Points to Balance Conversion
- **Input**: `{ user_id, points_amount }`
- **Output**: `{ balance_added, points_deducted }`
- **Logic**:
  - Validate user has enough points
  - points -= points_amount
  - balance += (points_amount * 1000)

## 3. VIP Module (VIP)

### Chức năng chính:
- Quản lý gói VIP subscription
- Xử lý thanh toán VIP
- Kiểm tra quyền truy cập VIP
- Quản lý thời hạn VIP

### Functions:

#### 3.1 VIP Subscription Purchase
- **Input**: `{ user_id, vip_package_id }`
- **Output**: `{ success, vip_expiry, transaction_id }`
- **Logic**:
  - Validate user balance >= package price
  - Get package details from MongoDB
  - Atomic transaction:
    - Deduct balance
    - Update vip_status = 'active'
    - Set vip_expiry date
    - Add to vip_history
    - Create transaction record

#### 3.2 VIP Status Check
- **Input**: `{ user_id }`
- **Output**: `{ is_vip, vip_expiry, package_name }`
- **Logic**:
  - Check vip_status and vip_expiry
  - Return current VIP status

#### 3.3 VIP Access Validation
- **Input**: `{ user_id, resource_id }`
- **Output**: `{ has_access, reason }`
- **Logic**:
  - Check user VIP status
  - Check resource requires_vip flag
  - Return access decision

#### 3.4 VIP Expiry Management
- **Input**: `{ user_id }`
- **Output**: `{ status_updated }`
- **Logic**:
  - Check if VIP expired
  - Update vip_status to 'expired'
  - Send notification (if applicable)

## 4. Game Module (GAME)

### Chức năng chính:
- Quản lý catalog game
- Tích hợp Steam API
- Quản lý metadata game
- Lọc game theo quyền truy cập

### Functions:

#### 4.1 Get Game Catalog
- **Input**: `{ user_id, filters, pagination }`
- **Output**: `{ games[], total_count, has_next }`
- **Logic**:
  - Get user VIP status
  - Filter games by access level:
    - Check is_free flag
    - Check requires_vip vs user VIP status
    - Check free_until date (if applicable)
  - Apply search/filter criteria
  - Return paginated results with access indicators

#### 4.2 Get Game Details
- **Input**: `{ app_id, user_id }`
- **Output**: `{ game_details, steam_info, access_info }`
- **Logic**:
  - Get game from MongoDB
  - Fetch Steam API data (cached)
  - Check user access permissions
  - Return combined information

#### 4.3 Steam API Integration
- **Input**: `{ app_id }`
- **Output**: `{ steam_game_data }`
- **Logic**:
  - Check Redis cache first
  - Call Steam API if not cached
  - Cache result for 24h
  - Return game metadata

#### 4.4 Update Game Metadata
- **Input**: `{ app_id, metadata }`
- **Output**: `{ success, updated_fields }`
- **Logic**:
  - Validate admin permissions
  - Update game record in MongoDB
  - Invalidate related caches
  - Log audit trail

## 5. Download Module (DOWNLOAD)

### Chức năng chính:
- Quản lý download links
- Proxy tới GitHub repository
- Tạo signed URLs
- Kiểm soát quyền truy cập

### Functions:

#### 5.1 Generate Download URL
- **Input**: `{ app_id, user_id }`
- **Output**: `{ download_url, expires_at }`
- **Logic**:
  - Validate user access to game
  - Check VIP requirements
  - Generate signed URL (1h expiry)
  - Log download request

#### 5.2 Proxy GitHub Download
- **Input**: `{ app_id, signed_token }`
- **Output**: `{ file_stream }`
- **Logic**:
  - Validate signed token
  - Construct GitHub URL
  - Stream file to client
  - Log download completion

#### 5.3 Download Analytics
- **Input**: `{ app_id, user_id }`
- **Output**: `{ download_logged }`
- **Logic**:
  - Record download event
  - Update game download counter
  - Track user download history

## 6. Admin Module (ADMIN)

### Chức năng chính:
- Quản lý người dùng
- Quản lý game catalog
- Analytics và reporting
- Quản lý gift codes

### Functions:

#### 6.1 User Management
- **Input**: `{ action, user_id, params }`
- **Output**: `{ success, updated_user }`
- **Logic**:
  - Validate admin permissions
  - Execute user action (ban, unban, update VIP)
  - Log admin action
  - Send notification to user

#### 6.2 Game Management
- **Input**: `{ action, game_data }`
- **Output**: `{ success, game_id }`
- **Logic**:
  - Validate admin permissions
  - Add/update/remove game
  - Update search indexes
  - Log changes

#### 6.3 Analytics Dashboard
- **Input**: `{ date_range, metrics }`
- **Output**: `{ analytics_data }`
- **Logic**:
  - Aggregate data from MongoDB
  - Calculate KPIs
  - Return dashboard metrics

#### 6.4 Gift Code Management
- **Input**: `{ action, gift_code_data }`
- **Output**: `{ success, gift_codes }`
- **Logic**:
  - Generate/validate gift codes
  - Set expiry and usage limits
  - Track redemption history

## 7. Gift Code Module (GIFTCODE)

### Chức năng chính:
- Tạo và quản lý gift codes
- Xử lý redemption
- Kiểm tra tính hợp lệ
- Quản lý rewards

### Functions:

#### 7.1 Generate Gift Code
- **Input**: `{ reward_type, reward_value, expiry, usage_limit }`
- **Output**: `{ gift_code, code_id }`
- **Logic**:
  - Generate unique code
  - Store in MongoDB with metadata
  - Set expiry and usage limits

#### 7.2 Redeem Gift Code
- **Input**: `{ user_id, gift_code }`
- **Output**: `{ success, reward_received }`
- **Logic**:
  - Validate code exists and not expired
  - Check usage limits
  - Apply reward to user
  - Mark code as used
  - Log redemption

#### 7.3 Validate Gift Code
- **Input**: `{ gift_code }`
- **Output**: `{ is_valid, reward_info, expiry }`
- **Logic**:
  - Check code exists
  - Verify not expired
  - Check usage limits
  - Return validation status

## 8. Community Module (COMMUNITY)

### Chức năng chính:
- Quản lý community features
- User interactions
- Content moderation
- Social features (TODO)

### Functions:

#### 8.1 User Profile Management
- **Input**: `{ user_id, profile_data }`
- **Output**: `{ success, updated_profile }`
- **Logic**:
  - Update user profile
  - Validate profile data
  - Handle avatar/frame updates

#### 8.2 Community Stats
- **Input**: `{ user_id }`
- **Output**: `{ stats }`
- **Logic**:
  - Get user community metrics
  - Calculate reputation/points
  - Return social stats

## 9. Review Module (REVIEW)

### Chức năng chính:
- Quản lý game reviews
- Rating system
- Review moderation
- Review analytics

### Functions:

#### 9.1 Submit Review
- **Input**: `{ user_id, game_id, rating, comment }`
- **Output**: `{ success, review_id }`
- **Logic**:
  - Validate user can review (owns game)
  - Check for existing review
  - Store review in MongoDB
  - Update game average rating

#### 9.2 Get Game Reviews
- **Input**: `{ game_id, pagination, filters }`
- **Output**: `{ reviews[], average_rating, total_count }`
- **Logic**:
  - Get reviews from MongoDB
  - Apply filters (rating, date)
  - Calculate statistics
  - Return paginated results

#### 9.3 Moderate Review
- **Input**: `{ review_id, action, moderator_id }`
- **Output**: `{ success, action_taken }`
- **Logic**:
  - Validate moderator permissions
  - Apply moderation action
  - Log moderation activity
  - Notify user if needed

## 10. Analytics Module (ANALYTICS)

### Chức năng chính:
- Usage tracking
- Performance metrics
- Business intelligence
- Reporting dashboard

### Functions:

#### 10.1 Track User Event
- **Input**: `{ user_id, event_type, metadata }`
- **Output**: `{ success }`
- **Logic**:
  - Store event in MongoDB
  - Update real-time counters
  - Trigger alerts if needed

#### 10.2 Generate Reports
- **Input**: `{ report_type, date_range, filters }`
- **Output**: `{ report_data }`
- **Logic**:
  - Aggregate data from MongoDB
  - Apply business logic
  - Format for dashboard
  - Cache results

#### 10.3 Real-time Metrics
- **Input**: `{ metric_types }`
- **Output**: `{ live_metrics }`
- **Logic**:
  - Get data from Redis counters
  - Calculate real-time KPIs
  - Return dashboard data

## 11. Cache Module (CACHE)

### Chức năng chính:
- Redis cache management
- Cache invalidation
- Performance optimization
- Session storage

### Functions:

#### 11.1 Cache Operations
- **Input**: `{ key, value, ttl }`
- **Output**: `{ success }`
- **Logic**:
  - Store/retrieve from Redis
  - Handle TTL expiration
  - Manage cache keys

#### 11.2 Cache Invalidation
- **Input**: `{ pattern }`
- **Output**: `{ keys_invalidated }`
- **Logic**:
  - Find matching keys
  - Delete from Redis
  - Log invalidation

## 12. Steam Integration Module (STEAM)

### Chức năng chính:
- Tích hợp SteamKit2
- Phát hiện Steam installation
- Quản lý Steam library
- Steam directory operations

### Functions:

#### 12.1 Steam Detection
- **Input**: `{}`
- **Output**: `{ steam_path, is_running, user_id }`
- **Logic**:
  - Detect Steam installation path
  - Check if Steam is running
  - Get Steam user ID
  - Validate Steam directories

#### 12.2 Steam Library Integration
- **Input**: `{ steam_user_id }`
- **Output**: `{ owned_games[], library_info }`
- **Logic**:
  - Connect via SteamKit2
  - Get user's game library
  - Cache library data
  - Return owned games list

#### 12.3 Add Game to Steam Library
- **Input**: `{ app_id, manifest_data, lua_data }`
- **Output**: `{ success, steam_updated }`
- **Logic**:
  - Copy manifest to Steam\config\st\
  - Copy lua to Steam\config\depotcache\
  - Refresh Steam library
  - Verify game appears in library

#### 12.4 Steam Directory Cleanup
- **Input**: `{ app_id }`
- **Output**: `{ cleanup_success }`
- **Logic**:
  - Remove manifest files
  - Remove lua files
  - Restore original Steam state
  - Clear temp directories

## 13. Translation/Patch Management Module (TRANSLATION)

### Chức năng chính:
- Quản lý bản dịch Việt hóa
- Patch file management
- Translation metadata
- Version control

### Functions:

#### 13.1 Get Available Translations
- **Input**: `{ app_id, user_id }`
- **Output**: `{ translations[], access_info }`
- **Logic**:
  - Get translations for game
  - Check user access (free/VIP)
  - Return available patches
  - Include author info and version

#### 13.2 Download Translation Patch
- **Input**: `{ app_id, translation_id, user_id }`
- **Output**: `{ download_url, patch_info }`
- **Logic**:
  - Validate user access
  - Generate signed download URL
  - Log download request
  - Return patch metadata

#### 13.3 Apply Translation Patch
- **Input**: `{ app_id, patch_file_path }`
- **Output**: `{ success, applied_files }`
- **Logic**:
  - Extract patch files
  - Backup original files
  - Apply translation files
  - Update patch registry

#### 13.4 Translation Management (Admin)
- **Input**: `{ action, translation_data }`
- **Output**: `{ success, translation_id }`
- **Logic**:
  - Upload new translation
  - Update translation metadata
  - Set access permissions
  - Notify community

## 14. File Management Module (FILEMANAGER)

### Chức năng chính:
- File operations và cleanup
- Temp file management
- Steam directory operations
- Backup và restore

### Functions:

#### 14.1 Temp File Management
- **Input**: `{ operation, file_paths }`
- **Output**: `{ success, temp_paths }`
- **Logic**:
  - Create temp directories
  - Manage temp file lifecycle
  - Cleanup on app exit
  - Handle file locks

#### 14.2 Steam Directory Operations
- **Input**: `{ operation, source_files, target_dirs }`
- **Output**: `{ success, copied_files }`
- **Logic**:
  - Copy files to Steam directories
  - Validate file integrity
  - Handle permission issues
  - Create backups

#### 14.3 Cleanup on Exit
- **Input**: `{ cleanup_type }`
- **Output**: `{ cleanup_success }`
- **Logic**:
  - Remove temp files
  - Restore Steam directories
  - Clear application cache
  - Log cleanup actions

#### 14.4 Backup Management
- **Input**: `{ backup_type, target_files }`
- **Output**: `{ backup_created, backup_path }`
- **Logic**:
  - Create file backups
  - Compress backup files
  - Store backup metadata
  - Manage backup retention

## 15. Security Module (SECURITY)

### Chức năng chính:
- Application integrity checks
- Anti-tampering protection
- Security validation
- Audit logging

### Functions:

#### 15.1 Integrity Check
- **Input**: `{ file_paths }`
- **Output**: `{ integrity_valid, modified_files }`
- **Logic**:
  - Calculate file checksums
  - Compare with known good values
  - Detect tampering attempts
  - Log security events

#### 15.2 Application Protection
- **Input**: `{}`
- **Output**: `{ protection_active }`
- **Logic**:
  - Enable anti-debugging
  - Monitor process integrity
  - Detect injection attempts
  - Trigger security responses

#### 15.3 Security Audit
- **Input**: `{ event_type, metadata }`
- **Output**: `{ audit_logged }`
- **Logic**:
  - Log security events
  - Track suspicious activities
  - Generate security reports
  - Alert on threats

#### 15.4 Secure Cleanup
- **Input**: `{ cleanup_level }`
- **Output**: `{ secure_cleanup_done }`
- **Logic**:
  - Securely delete sensitive files
  - Clear memory contents
  - Remove registry entries
  - Verify cleanup completion

## 16. Notification Module (NOTIFICATION)

### Chức năng chính:
- System notifications
- User alerts
- Email notifications (TODO)
- Push notifications (TODO)

### Functions:

#### 12.1 Send Notification
- **Input**: `{ user_id, type, message, metadata }`
- **Output**: `{ success, notification_id }`
- **Logic**:
  - Create notification record
  - Determine delivery method
  - Send notification
  - Track delivery status

#### 12.2 Get User Notifications
- **Input**: `{ user_id, pagination }`
- **Output**: `{ notifications[], unread_count }`
- **Logic**:
  - Get user notifications
  - Mark as read if requested
  - Return paginated results

## Module Dependencies

```
Controllers → Services → Models → Database

Auth Controller → Auth Service → User Model → MongoDB + Redis
Payment Controller → SePay Service → Transaction Model → MongoDB
Game Controller → Game Service → Game Model → MongoDB + Steam API
VIP Controller → VIP Service → User/VipPackage Models → MongoDB
Download Controller → Download Service → Game Model → MongoDB + GitHub
Admin Controller → Multiple Services → Multiple Models → MongoDB
GiftCode Controller → GiftCode Service → GiftCode Model → MongoDB
Review Controller → Review Service → Review Model → MongoDB
Analytics Controller → Analytics Service → Multiple Models → MongoDB
Community Controller → Community Service → User Model → MongoDB
Steam Service → SteamKit2 → Steam Network + Local Steam Installation
Translation Service → File Manager → Local File System + Cloud Storage
File Manager → Security Module → Local File System + Registry
Security Module → System APIs → Windows Security Features
```

## Business Rules

### Access Control:
- Free users: Access to free games and limited features
- VIP users: Access to all games and premium features
- Admin users: Full system access and management capabilities

### Payment Rules:
- Balance: Used only for VIP purchases
- Points: Used for games, items, avatars, frames
- Points can convert to Balance (not vice versa)
- 1k VND = 1 point conversion rate

### VIP Rules:
- Only one active VIP subscription per user
- VIP status checked on each protected resource access
- VIP expiry automatically updates status to 'expired'

### Security Rules:
- Single session policy enforced
- JWT tokens have expiration
- All admin actions logged
- Sensitive operations require additional validation

## TODO - Cần bổ sung:
- Email notification system
- Push notification for desktop client
- Advanced community features (forum, chat)
- Multi-language support
- Advanced analytics and ML features
- Mobile app support modules
