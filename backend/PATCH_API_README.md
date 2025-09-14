# Patch API Documentation

Chức năng Patch (Mod Game) cho Tram Game Launcher API.

## Tổng quan

Hệ thống patch cho phép người dùng tải xuống các file mod game với 2 loại quyền truy cập:
- **Free patches**: Miễn phí cho tất cả người dùng
- **Premium patches**: Yêu cầu quyền VIP hoặc PREMIUM membership để truy cập

## Cấu trúc Database

### Model Patch
```javascript
{
  _id: ObjectId,
  appid: String,           // Steam App ID (ref: Game)
  author: String,          // Tác giả patch
  description: String,     // Mô tả patch
  size: Number,           // Kích thước file (bytes)
  download_url: String,   // URL tải xuống trực tiếp
  version: String,        // Phiên bản patch
  patch_type: String,     // Loại patch: 'free' | 'premium' (default: 'premium')
  free_until: Date,       // Miễn phí tạm thời đến khi nào (optional)
  active: Boolean,        // Trạng thái hoạt động
  sort_order: Number,     // Thứ tự hiển thị
  stats: {
    downloads: Number     // Số lần tải xuống
  },
  created_at: Date,
  updated_at: Date
}
```

## API Endpoints

### 1. Lấy danh sách patches cho game
```
GET /api/patches/:appid
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "game": {
      "id": "730",
      "name": "Counter-Strike: Global Offensive"
    },
    "patches": [
      {
        "id": "patch_id",
        "appid": "730",
        "author": "CSGO Modder",
        "description": "Vietnamese Translation Pack",
        "size": 2048000,
        "version": "2.1.0",
        "patch_type": "premium",
        "free_until": null,
        "stats": {
          "downloads": 150
        },
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 2. Lấy thông tin chi tiết patch
```
GET /api/patches/:appid/:patchId
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "patch_id",
    "appid": "730",
    "author": "CSGO Modder",
    "description": "Vietnamese Translation Pack",
    "size": 2048000,
    "version": "2.1.0",
    "patch_type": "premium",
    "free_until": null,
    "stats": {
      "downloads": 150
    },
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Tải xuống patch
```
GET /api/patches/:appid/:patchId/download
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "download_url": "https://example.com/patch.zip",
    "patch_info": {
      "id": "patch_id",
      "author": "CSGO Modder",
      "description": "Vietnamese Translation Pack",
      "size": 2048000,
      "version": "2.1.0"
    }
  }
}
```

### 4. Tìm kiếm patches (Admin only)
```
GET /api/patches/search?q=search_term&page=1&limit=10
```

**Query Parameters:**
- `q`: Từ khóa tìm kiếm
- `appid`: Lọc theo game
- `author`: Lọc theo tác giả
- `patch_type`: Lọc theo loại patch ('free' | 'premium')
- `page`: Trang (default: 1)
- `limit`: Số item mỗi trang (default: 10)

### 5. Tạo patch mới (Admin only)
```
POST /api/patches
```

**Body:**
```json
{
  "appid": "730",
  "author": "CSGO Modder",
  "description": "Vietnamese Translation Pack",
  "size": 2048000,
  "download_url": "https://example.com/patch.zip",
  "version": "2.1.0",
  "patch_type": "premium",
  "free_until": null,
  "sort_order": 1
}
```

### 6. Cập nhật patch (Admin only)
```
PUT /api/patches/:patchId
```

**Body:**
```json
{
  "author": "Updated Author",
  "description": "Updated Description",
  "size": 2048000,
  "download_url": "https://example.com/updated-patch.zip",
  "version": "2.2.0",
  "patch_type": "free"
}
```

### 7. Xóa patch (Admin only)
```
DELETE /api/patches/:patchId
```

## Logic Phân Quyền

### Kiểm tra quyền truy cập patch:
1. **Free patches** (`patch_type: 'free'`): Ai cũng có thể truy cập
2. **Temporary free** (`free_until > now`): Miễn phí tạm thời, bất kể patch_type
3. **Premium patches** (`patch_type: 'premium'`): Yêu cầu quyền premium

### Premium Access Check:
```javascript
// User phải có quyền premium (VIP hoặc PREMIUM membership) để truy cập premium patches
(user.membership === 'VIP' || user.membership === 'PREMIUM') &&
user.membership_expiry && 
user.membership_expiry > new Date()
```

### Ví dụ phân quyền:
- **Free user**: Chỉ có thể truy cập patches có `patch_type: 'free'` hoặc `free_until > now`
- **VIP user**: Có thể truy cập tất cả patches
- **PREMIUM user**: Có thể truy cập tất cả patches

## Cài đặt và Sử dụng

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình environment
```bash
cp .env.example .env
# Chỉnh sửa các giá trị trong .env
```

### 3. Seed dữ liệu test
```bash
npm run seed:patches
# hoặc
node scripts/seedPatches.js
```

### 4. Khởi động server
```bash
npm start
# hoặc cho development
npm run dev
```

### 5. Test API
```bash
node test-patch-endpoints.js
```

## Lưu ý

1. **Download URL**: Hệ thống trả về URL trực tiếp từ database, không sử dụng signed URL phức tạp
2. **Authentication**: Tất cả endpoints đều yêu cầu JWT token
3. **Admin Access**: Các endpoint quản lý (CRUD) chỉ dành cho admin
4. **Download Tracking**: Mỗi lần download sẽ tăng counter và log audit
5. **Soft Delete**: Xóa patch chỉ set `active: false`, không xóa thật

## Error Codes

- `400`: Bad Request - Thiếu thông tin bắt buộc
- `401`: Unauthorized - Không có token hoặc token không hợp lệ
- `403`: Forbidden - Không có quyền truy cập patch hoặc không phải admin
- `404`: Not Found - Game hoặc patch không tồn tại
- `500`: Internal Server Error - Lỗi server

## Ví dụ sử dụng

### Client-side JavaScript
```javascript
// Lấy danh sách patches cho CS:GO
const response = await fetch('/api/patches/730', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const data = await response.json();
console.log('Available patches:', data.data.patches);

// Tải xuống patch
const downloadResponse = await fetch('/api/patches/730/patch_id/download', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const downloadData = await downloadResponse.json();
// Redirect to download URL
window.location.href = downloadData.data.download_url;
```