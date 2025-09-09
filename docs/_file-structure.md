# Cấu trúc File và Thư mục - Dự án Trạm Game

## Tổng quan
Dự án "Trạm Game" bao gồm 3 thành phần chính:
- **Backend API Server**: Node.js + MongoDB + Redis
- **Web Portal**: ReactJS frontend cho catalog và admin dashboard
- **Desktop Client**: C# WPF application cho Windows

## Cấu trúc thư mục tổng thể

```
launcher-new-/
├── backend/                    # Backend API Server (Node.js)
├── web_portal/                 # Web Portal (ReactJS)
├── client/                     # Desktop Client (C#)
├── scripts/                    # Deployment & utility scripts
├── tests/                      # Integration & E2E tests
├── docs/                       # Documentation
├── docker-compose.yml          # Development environment
├── .env.example               # Environment variables template
└── README.md                  # Project overview
```

```
/docs/
├── PRD.md                  # Product Requirements Document
├── _system_architecture.txt # Sơ đồ kiến trúc hệ thống
├── _modules_and_functions.txt # Danh sách module và chức năng
├── _data_flow_and_architecture_rationale.txt # Flow dữ liệu và giải thích kiến trúc
├── _api_client_list.txt     # Danh sách API dành cho Client
├── _file-structure.txt      # Cấu trúc file chi tiết
├── _database_schema.md      # Sơ đồ/định nghĩa Schema Database (nếu có)
├── _dependencygraph.md      # Sơ đồ phụ thuộc giữa các thành phần
├── _implementation_plan.md  # Kế hoạch triển khai chi tiết
├── _payment-flow.md          # Tài liệu bắt buộc bám sát để triển khai payment-flow.đúng chuẩn theo PRD 
├── _fixing_plan.md          # Kế hoạch cải tiến dự án
└── _api_update.md           # Ý tưởng cập nhật API



```

## 1. Backend API Server (/backend/)

### Cấu trúc chính
```
backend/
├── src/
│   ├── controllers/           # API Controllers
│   │   ├── auth.controller.js         # Authentication & Session
│   │   ├── user.controller.js         # User management
│   │   ├── game.controller.js         # Game catalog & downloads
│   │   ├── payment.controller.js      # SePay integration
│   │   ├── vip.controller.js          # VIP subscription
│   │   ├── admin.controller.js        # Admin dashboard
│   │   ├── giftcode.controller.js     # Gift code system
│   │   ├── community.controller.js    # Community features
│   │   ├── review.controller.js       # Game reviews & ratings
│   │   └── analytics.controller.js    # Analytics & reporting
│   │
│   ├── services/              # Business Logic Services
│   │   ├── auth.service.js            # JWT, session management
│   │   ├── user.service.js            # User CRUD operations
│   │   ├── game.service.js            # Game metadata, Steam API
│   │   ├── sepay.service.js           # Payment processing
│   │   ├── vip.service.js             # VIP package management
│   │   ├── download.service.js        # File download & proxy
│   │   ├── giftcode.service.js        # Gift code generation
│   │   ├── steam.service.js           # Steam API integration
│   │   ├── community.service.js       # Community features
│   │   ├── review.service.js          # Game reviews & ratings
│   │   ├── cache.service.js           # Redis caching operations
│   │   ├── analytics.service.js       # Usage analytics & reporting
│   │   └── notification.service.js    # System notifications
│   │
│   ├── models/                # MongoDB Models (Mongoose)
│   │   ├── User.js                    # User schema
│   │   ├── Game.js                    # Game metadata
│   │   ├── Transaction.js             # Payment transactions
│   │   ├── VipPackage.js              # VIP subscription plans
│   │   ├── GiftCode.js                # Gift codes
│   │   ├── Review.js                  # Game reviews
│   │   ├── AuditLog.js                # System audit logs
│   │   └── Session.js                 # User sessions
│   │
│   ├── middleware/            # Express Middleware
│   │   ├── auth.middleware.js         # JWT verification
│   │   ├── vip.middleware.js          # VIP access control
│   │   ├── admin.middleware.js        # Admin role check
│   │   ├── sepay.middleware.js        # SePay webhook validation
│   │   ├── rateLimit.middleware.js    # API rate limiting
│   │   ├── validation.middleware.js   # Request validation
│   │   └── review.middleware.js       # Review access control
│   │
│   ├── routes/                # API Routes
│   │   ├── auth.routes.js             # /api/v1/auth/*
│   │   ├── user.routes.js             # /api/v1/users/*
│   │   ├── game.routes.js             # /api/v1/games/*
│   │   ├── payment.routes.js          # /api/v1/payments/*
│   │   ├── vip.routes.js              # /api/v1/vip/*
│   │   ├── admin.routes.js            # /api/v1/admin/*
│   │   ├── giftcode.routes.js         # /api/v1/giftcodes/*
│   │   ├── download.routes.js         # /api/v1/downloads/*
│   │   ├── review.routes.js           # /api/v1/reviews/*
│   │   └── analytics.routes.js        # /api/v1/analytics/*
│   │
│   ├── utils/                 # Utility Functions
│   │   ├── logger.js                  # Winston logging
│   │   ├── redis.js                   # Redis client
│   │   ├── database.js                # MongoDB connection
│   │   ├── encryption.js              # Data encryption
│   │   ├── qrcode.js                  # QR code generation
│   │   └── steam-api.js               # Steam API helpers
│   │
│   ├── config/                # Configuration
│   │   ├── database.config.js         # MongoDB settings
│   │   ├── redis.config.js            # Redis settings
│   │   ├── sepay.config.js            # SePay configuration
│   │   └── app.config.js              # Application settings
│   │
│   └── app.js                 # Express application entry
│
├── tests/                     # Backend Tests
│   ├── unit/                          # Unit tests
│   ├── integration/                   # Integration tests
│   └── fixtures/                      # Test data
│
├── package.json               # Dependencies & scripts
├── .env.example              # Environment template
└── server.js                 # Application entry point
```

### Modules chính theo PRD:
- **Authentication**: Login/logout, session management, single device policy
- **Payment System**: SePay webhook, balance/points management, idempotency
- **VIP Management**: Subscription packages, access control
- **Game Management**: App ID catalog, Steam API integration
- **Download System**: Manifest/lua file proxy, access control
- **Admin Dashboard**: User management, analytics, gift codes
- **Community**: Reviews, ratings, community features
- **Review System**: Game reviews, ratings, moderation
- **Analytics**: Usage tracking, reporting, dashboard metrics
- **Caching**: Redis-based caching for performance
- **Notifications**: System notifications and alerts

## 2. Web Portal (/web_portal/)

### Cấu trúc ReactJS
```
web_portal/
├── public/                    # Static assets
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
│
├── src/
│   ├── components/            # Reusable Components
│   │   ├── common/                    # Common UI components
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Loading.jsx
│   │   │   └── Modal.jsx
│   │   │
│   │   ├── game/                      # Game-related components
│   │   │   ├── GameCard.jsx
│   │   │   ├── GameList.jsx
│   │   │   ├── GameDetail.jsx
│   │   │   └── GameSearch.jsx
│   │   │
│   │   ├── auth/                      # Authentication components
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── UserProfile.jsx
│   │   │
│   │   └── admin/                     # Admin dashboard components
│   │       ├── UserManagement.jsx
│   │       ├── GameManagement.jsx
│   │       ├── Analytics.jsx
│   │       └── GiftCodeManager.jsx
│   │
│   ├── pages/                 # Page Components
│   │   ├── Home.jsx                   # Landing page
│   │   ├── GameCatalog.jsx            # Game catalog
│   │   ├── GameDetail.jsx             # Game detail page
│   │   ├── Download.jsx               # Client download
│   │   ├── Login.jsx                  # Login page
│   │   ├── Register.jsx               # Registration
│   │   └── admin/                     # Admin pages
│   │       ├── Dashboard.jsx
│   │       ├── Users.jsx
│   │       └── Games.jsx
│   │
│   ├── services/              # API Services
│   │   ├── api.js                     # Axios configuration
│   │   ├── auth.service.js            # Authentication API
│   │   ├── game.service.js            # Game API
│   │   ├── user.service.js            # User API
│   │   └── admin.service.js           # Admin API
│   │
│   ├── hooks/                 # Custom React Hooks
│   │   ├── useAuth.js                 # Authentication hook
│   │   ├── useApi.js                  # API calling hook
│   │   └── useLocalStorage.js         # Local storage hook
│   │
│   ├── context/               # React Context
│   │   ├── AuthContext.js             # Authentication context
│   │   └── ThemeContext.js            # Theme context
│   │
│   ├── utils/                 # Utility Functions
│   │   ├── constants.js               # Application constants
│   │   ├── helpers.js                 # Helper functions
│   │   └── validators.js              # Form validation
│   │
│   ├── styles/                # CSS/SCSS Files
│   │   ├── globals.css                # Global styles
│   │   ├── components.css             # Component styles
│   │   └── pages.css                  # Page-specific styles
│   │
│   ├── App.jsx                # Main App component
│   └── index.js               # React entry point
│
├── package.json               # Dependencies & scripts
└── .env.example              # Environment template
```

### Chức năng chính theo PRD:
- **Game Catalog**: Hiển thị danh sách game, tìm kiếm, lọc
- **Game Detail**: Thông tin chi tiết game, bản dịch
- **Client Download**: Trang tải launcher cho Windows
- **Admin Dashboard**: Quản lý user, game, analytics (không public)

## 3. Desktop Client (/client/)

### Cấu trúc C# WPF
```
client/
├── TramGame.Client/           # Main WPF Application
│   ├── Views/                         # XAML Views
│   │   ├── MainWindow.xaml            # Main application window
│   │   ├── LoginWindow.xaml           # Login dialog
│   │   ├── GameLibrary.xaml           # Game library view
│   │   ├── GameDetail.xaml            # Game detail view
│   │   ├── PaymentWindow.xaml         # Payment/top-up
│   │   ├── VipWindow.xaml             # VIP subscription
│   │   └── SettingsWindow.xaml        # Application settings
│   │
│   ├── ViewModels/                    # MVVM ViewModels
│   │   ├── MainViewModel.cs           # Main window logic
│   │   ├── LoginViewModel.cs          # Login logic
│   │   ├── GameLibraryViewModel.cs    # Game library logic
│   │   ├── PaymentViewModel.cs        # Payment logic
│   │   └── SettingsViewModel.cs       # Settings logic
│   │
│   ├── Models/                        # Data Models
│   │   ├── User.cs                    # User model
│   │   ├── Game.cs                    # Game model
│   │   ├── Transaction.cs             # Payment transaction
│   │   ├── VipPackage.cs              # VIP package
│   │   └── AppSettings.cs             # Application settings
│   │
│   ├── Services/                      # Business Services
│   │   ├── ApiService.cs              # Backend API client
│   │   ├── AuthService.cs             # Authentication service
│   │   ├── GameService.cs             # Game management
│   │   ├── SteamService.cs            # Steam integration
│   │   ├── DownloadService.cs         # File download
│   │   ├── PaymentService.cs          # Payment processing
│   │   └── UpdateService.cs           # Auto-update
│   │
│   ├── Utils/                         # Utility Classes
│   │   ├── SteamKit2Helper.cs         # SteamKit2 wrapper
│   │   ├── FileManager.cs             # File operations
│   │   ├── RegistryHelper.cs          # Windows registry
│   │   ├── SecurityHelper.cs          # Security & integrity
│   │   └── Logger.cs                  # Application logging
│   │
│   ├── Resources/                     # Application Resources
│   │   ├── Images/                    # Image assets
│   │   ├── Styles/                    # WPF styles
│   │   └── Localization/              # Language files
│   │
│   ├── App.xaml                       # Application definition
│   ├── App.xaml.cs                    # Application code-behind
│   └── TramGame.Client.csproj         # Project file
│
├── TramGame.Core/             # Shared Library
│   ├── Models/                        # Shared models
│   ├── Interfaces/                    # Service interfaces
│   ├── Constants/                     # Application constants
│   └── TramGame.Core.csproj           # Core library project
│
├── TramGame.Installer/        # Installation Package
│   ├── Setup.cs                       # Installer logic
│   ├── Resources/                     # Installer resources
│   └── TramGame.Installer.csproj      # Installer project
│
└── TramGame.sln               # Visual Studio solution
```

### Chức năng chính theo PRD:
- **Steam Integration**: SteamKit2, phát hiện game, khởi chạy
- **Game Library**: Hiển thị game từ server + Steam library
- **Translation Management**: Tải và áp dụng bản dịch
- **Payment System**: QR code, balance/points management
- **VIP System**: Subscription management
- **Security**: Integrity check, cleanup on exit
- **Auto-update**: Application update mechanism

## 4. Scripts & Utilities (/scripts/)

```
scripts/
├── deployment/                # Deployment Scripts
│   ├── deploy-backend.sh              # Backend deployment
│   ├── deploy-frontend.sh             # Frontend deployment
│   ├── setup-database.js              # Database initialization
│   └── setup-redis.sh                 # Redis configuration
│
├── development/               # Development Tools
│   ├── seed-database.js               # Test data seeding
│   ├── generate-keys.js               # API key generation
│   ├── backup-db.js                   # Database backup
│   └── restore-db.js                  # Database restore
│
├── maintenance/               # Maintenance Scripts
│   ├── cleanup-logs.js                # Log file cleanup
│   ├── update-game-data.js            # Game metadata update
│   └── check-health.js                # System health check
│
└── build/                     # Build Scripts
    ├── build-client.bat               # Client build script
    ├── build-installer.bat            # Installer build
    └── package-release.sh             # Release packaging
```

## 5. Tests (/tests/)

```
tests/
├── backend/                   # Backend Tests
│   ├── unit/                          # Unit tests
│   │   ├── services/
│   │   ├── controllers/
│   │   └── models/
│   │
│   ├── integration/                   # Integration tests
│   │   ├── auth.test.js
│   │   ├── payment.test.js
│   │   └── game.test.js
│   │
│   └── fixtures/                      # Test data
│       ├── users.json
│       ├── games.json
│       └── transactions.json
│
├── frontend/                  # Frontend Tests
│   ├── components/                    # Component tests
│   ├── pages/                         # Page tests
│   └── services/                      # Service tests
│
├── client/                    # Client Tests
│   ├── unit/                          # Unit tests
│   ├── integration/                   # Integration tests
│   └── ui/                            # UI automation tests
│
└── e2e/                       # End-to-End Tests
    ├── auth.e2e.js                    # Authentication flow
    ├── payment.e2e.js                 # Payment flow
    └── game-download.e2e.js           # Game download flow
```

## 6. Documentation (/docs/)

```
docs/
├── PRD.md                     # Product Requirements Document
├── _payment-flow.md           # Payment system documentation
├── _file-structure.txt        # This file
├── _system_architecture.txt   # System architecture
├── _modules_and_functions.txt # Module specifications
├── _data_flow_and_architecture_rationale.txt # Data flow & rationale
├── _database_schema.md        # Database schema
├── _dependencygraph.md        # Dependency graph
├── _implementation_plan.md    # Implementation timeline
├── _fixing_plan.md            # Issues & improvements
├── _api_client_list.txt       # Client API endpoints
├── _api_update.md             # API enhancement ideas
├── api/                       # API Documentation
│   ├── swagger.yaml                   # OpenAPI specification
│   └── postman/                       # Postman collections
├── deployment/                # Deployment guides
│   ├── backend-deployment.md
│   ├── frontend-deployment.md
│   └── client-distribution.md
└── development/               # Development guides
    ├── setup-guide.md
    ├── coding-standards.md
    └── testing-guide.md
```

## Ghi chú quan trọng

### Bảo mật & Tính toàn vẹn
- Client có cơ chế kiểm tra integrity và cleanup khi thoát
- Backend sử dụng JWT authentication với single session policy
- SePay webhook có IP whitelist và timestamp validation
- Tất cả API endpoints có rate limiting và validation

### Tích hợp Steam
- Client sử dụng SteamKit2 để tương tác với Steam
- Manifest và lua files được tải từ GitHub repository
- Steam API được sử dụng để lấy metadata game

### Cơ sở dữ liệu
- MongoDB làm primary database
- Redis cho session storage và caching
- Mongoose ODM cho backend models

### TODO - Cần bổ sung
- Community features (forum, chat) - chưa rõ trong PRD
- Mobile app support - không có trong PRD hiện tại
- Multi-language support - chỉ có Việt hóa trong PRD
- Advanced analytics dashboard - cần spec chi tiết hơn
