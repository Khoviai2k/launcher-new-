# Database Schema — Trạm Game

This document consolidates and standardizes all MongoDB collections for the project, derived from the repository documentation (PRD, architecture, data flows, implementation plan, and database docs), including the latest updates for Item Owned and Patch System as of 2025-09-09.

Conventions
- ID types: Unless stated otherwise, primary keys are MongoDB ObjectId.
- Timestamps: created_at and updated_at are dates managed by the backend/Mongoose timestamps.
- Currency: VND by default.
- Item ID conventions: numeric → Game (e.g., "10"); prefix a_ → Avatar; prefix f_ → Frame.
- Access control: requires_vip, is_free, free_until and VIP status determine access to games and patches.

Collections
- users
- games
- patches (new)
- translations
- transactions
- vip_packages
- gift_codes
- user_library
- notifications
- audit_logs
- sessions

---

## users

Canonical storage for user accounts, balances, VIP, and owned items.

Fields
| Field | Type | Required | Default | Description |
| ---   | ---  | ---      |     --- |         --- |
| _id   | ObjectId | yes |  | Primary key |
| username | string | yes, unique |  | Unique username (3–50 chars) |
| email | string | no, unique sparse |  | Email (optional) |
| password_hash | string | yes |  | Bcrypt hash |
| balance | number | yes | 0 | VND balance (used for VIP) |
| points | number | yes | 0 | Points for items/games (1k VND = 1 point) |
| vip_status | enum('active','expired','never') | yes | 'never' | Current VIP status |
| vip_expiry | date | no |  | VIP expiration datetime |
| vip_package_id | ObjectId (ref vip_packages) | no |  | Current VIP package |
| vip_history | ObjectId[] (ref vip_packages) | yes | [] | History of VIP packages |
| items | string[] | yes | [] | Flat list of item IDs owned by user (numeric, a_*, f_*) |
| item_sources | object map | yes | {} | Map item_id → source: 'vip_sub' | 'redeem_code' | 'points_purchase' | 'admin_grant' | 'cash' | string |
| owned_games | string[] | no | [] | Legacy; prefer items |
| owned_avatars | string[] | no | [] | Legacy; prefer items |
| owned_frames | string[] | no | [] | Legacy; prefer items |
| display_name | string | no |  | Display name |
| avatar_url | string | no |  | Profile avatar URL |
| frame_id | string | no |  | Profile frame selection (also present in items) |
| status | enum('active','banned','suspended') | yes | 'active' | Account status |
| role | enum('user','vip','admin','moderator') | yes | 'user' | Role/permissions |
| last_login | date | no |  | Last login time |
| last_device | string | no |  | Last device info string |
| locked_until | date | no |  | Account lock expiry |
| created_at | date | yes | now | Creation timestamp |
| updated_at | date | yes | now | Last update |

Indexes / Constraints
- Unique: username; email (sparse)
- Compound: vip_status + vip_expiry; status + role
- Sort: created_at (-1)
- Array/Query helper: items (1)

Relationships
- vip_package_id, vip_history[] → vip_packages._id
- Referenced by: transactions.user_id, sessions.user_id, notifications.user_id, audit_logs.user_id/admin_id, user_library.user_id

Notes
- VIP entitlements for items: items with source=vip_sub are active only while VIP is active. On VIP expiry, mark such items inactive at the application layer (do not delete history). Re-activate on renewal.

---

## games

Steam game metadata plus business access flags and stats.

Fields
| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| _id | string | yes |  | Steam App ID (e.g., "570") |
| name | string | yes |  | Game name |
| is_free | boolean | yes | false | Free for all users |
| requires_vip | boolean | yes | true | Requires VIP access |
| free_until | date | no |  | Temporarily free until time |
| last_commit_date | date | no |  | Last Git repo commit date for manifests (if tracked) |
| last_commit_sha | string | no |  | Last commit SHA |
| steam_data | object | no |  | Cached Steam info (price, categories[], screenshots[], description, release_date, developer, publisher, etc.) |
| translation_data | object | no |  | Summary of translation availability (author, version, last_updated, download_url) — see patches/translations for authoritative records |
| stats.downloads | number | yes | 0 | Total downloads |
| created_at | date | yes | now | |
| updated_at | date | yes | now | |

Indexes / Constraints
- Compound: requires_vip (1), is_free (1)
- free_until (1)
- translation_data.available (1)
- Text: name (text)
- Sort: stats.rating (-1), stats.downloads (-1), updated_at (-1)

Relationships
- Referenced by: user_library.game_id; translations.game_id; patches.appid

Notes
- The patches collection is the authoritative source for per-game patch objects. translation_data here is a summary/projection for faster UI.

---

## patches (NEW)

Patch (translation) artifacts per game, with cloud storage integration and signed URL downloads.

Fields
| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| _id | ObjectId | yes |  | Patch ID |
| appid | string (ref games) | yes |  | Steam App ID |
| author | string | yes |  | Patch author |
| description | string | yes |  | Patch description |
| size | number | yes |  | File size in bytes |
| download_url | string | yes |  | Cloud object key or canonical storage URL (not directly public) |
| version | string | no |  | Optional version label |
| created_at | date | yes | now | |
| updated_at | date | yes | now | |

Indexes / Constraints
- appid (1), mandatory (1)
- author (1)
- updated_at (-1)

Relationships
- appid → games._id

Notes
- Backend generates a time-limited signed URL at download time based on download_url; clients download directly from cloud storage.

---


## transactions

Ledger of payments (SePay), VIP purchases, gift redemptions, points conversions, and optionally item purchases.

Fields
| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| _id | ObjectId | yes |  | Primary key |
| user_id | ObjectId (ref users) | yes |  | User |
| type | enum('payment','vip_purchase','gift_redeem','points_conversion','item_purchase') | yes |  | Transaction type |
| amount | number | yes | 0 | Amount in VND |
| currency | string | yes | 'VND' | Currency code |
| sepay_id | number | no, unique |  | SePay transaction ID (webhook), unique if present |
| gateway | string | no |  | Bank/gateway name (e.g., 'Vietcombank') |
| reference_code | string | no |  | Bank reference code |
| transfer_content | string | no |  | Transfer content (contains username) |
| status | enum('pending','processing','completed','failed','cancelled') | yes | 'pending' | State machine with idempotency |
| balance_before | number | no |  | Balance before transaction |
| balance_after | number | no |  | Balance after transaction |
| points_before | number | no |  | Points before transaction |
| points_after | number | no |  | Points after transaction |
| metadata | object | no |  | Additional info (vip_package_id, gift_code_id, conversion_rate, admin_id, notes, item_id) |
| metadata.vip_package_id | ObjectId (ref vip_packages) | no |  | If VIP purchase |
| metadata.gift_code_id | ObjectId (ref gift_codes) | no |  | If gift redeem |
| metadata.item_id | string | no |  | If item_purchase, the item unlocked |
| transaction_date | date | no |  | SePay-provided timestamp |
| created_at | date | yes | now | |
| updated_at | date | yes | now | |

Indexes / Constraints
- Unique sparse: sepay_id (1)
- Queries: user_id (1), created_at (-1); status (1), type (1); reference_code (1); transaction_date (-1)

Relationships
- user_id → users._id
- metadata.vip_package_id → vip_packages._id
- metadata.gift_code_id → gift_codes._id

Notes
- Idempotency: webhook processing reserves a transaction with status 'processing' and completes atomically.

---

## vip_packages

VIP subscription packages and pricing.

Fields
| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| _id | ObjectId | yes |  | Primary key |
| name | string | yes, unique |  | Package name |
| description | string | no |  | Description |
| price | number | yes | 0 | Price in VND |
| duration_days | number | yes |  | Duration in days |
| features | string[] | no | [] | Feature list |
| game_access | enum('all','premium','specific') | yes | 'all' | Access policy |
| download_limit | number | yes | -1 | Downloads/day (-1 = unlimited) |
| active | boolean | yes | true | Available for purchase |
| sort_order | number | no | 0 | Display order |
| created_at | date | yes | now | |
| updated_at | date | yes | now | |

Indexes / Constraints
- active (1), sort_order (1)
- price (1)

Relationships
- Referenced by users.vip_package_id, users.vip_history[], transactions.metadata.vip_package_id

---

## gift_codes

Gift/redeem codes and usage history.

Fields
| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| _id | ObjectId | yes |  | Primary key |
| code | string | yes, unique |  | Gift code string |
| reward_type | enum('balance','points','vip','game','item') | yes |  | Reward category |
| reward_value | number | yes |  | Amount/duration value |
| reward_metadata | object | no |  | Reward extensions |
| reward_metadata.vip_package_id | ObjectId (ref vip_packages) | no |  | VIP reward |
| reward_metadata.game_id | string (ref games) | no |  | Game reward |
| reward_metadata.description | string | no |  | Description |
| usage_limit | number | yes | 1 | Max usage (-1 = unlimited) |
| used_count | number | yes | 0 | Current usage |
| expiry_date | date | no |  | Expiration date |
| used_by | array of objects | yes | [] | Usage history |
| used_by[].user_id | ObjectId (ref users) | yes |  | User who redeemed |
| used_by[].used_at | date | yes |  | When redeemed |
| used_by[].ip_address | string | no |  | Optional client IP |
| created_by | ObjectId (ref users) | no |  | Admin who created |
| batch_id | string | no |  | Batch identifier |
| active | boolean | yes | true | Code is active |
| created_at | date | yes | now | |
| updated_at | date | yes | now | |

Indexes / Constraints
- code (1) unique
- active (1), expiry_date (1)
- batch_id (1)
- created_by (1), created_at (-1)

Relationships
- reward_metadata.vip_package_id → vip_packages._id
- reward_metadata.game_id → games._id
- used_by[].user_id → users._id

---

## user_library

Per-user game access and download history.

Fields
| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| _id | ObjectId | yes |  | Primary key |
| user_id | ObjectId (ref users) | yes |  | User |
| game_id | string (ref games) | yes |  | Steam App ID |
| acquired_via | enum('download','gift_code','admin_grant') | yes |  | How access was acquired |
| acquired_at | date | yes | now | Acquisition time |
| download_count | number | yes | 0 | Download times |
| last_downloaded | date | no |  | Last download timestamp |
| active | boolean | yes | true | Access still active |
| created_at | date | yes | now | |
| updated_at | date | yes | now | |

Indexes / Constraints
- Unique: user_id (1), game_id (1)
- user_id (1), active (1)
- acquired_at (-1)

Relationships
- user_id → users._id; game_id → games._id

---

## notifications

User notifications and delivery metadata.

Fields
| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| _id | ObjectId | yes |  | Primary key |
| user_id | ObjectId (ref users) | yes |  | Recipient |
| type | enum('system','payment','vip','game','admin') | yes |  | Category |
| title | string | yes |  | Title |
| message | string | yes |  | Message body |
| metadata | object | no |  | Optional context (game_id, transaction_id, action_url, icon) |
| read | boolean | yes | false | Read status |
| read_at | date | no |  | When read |
| delivery_method | string[] | no | ['in_app'] | Channels ['in_app','email','push'] |
| delivered | boolean | yes | false | Delivery success |
| created_at | date | yes | now | |
| expires_at | date | no |  | Expiration (for TTL cleanup) |

Indexes / Constraints
- user_id (1), read (1), created_at (-1)
- type (1), created_at (-1)
- TTL: expires_at (1) with expireAfterSeconds: 0

Relationships
- user_id → users._id

---

## audit_logs

Security and admin/audit trail of actions.

Fields
| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| _id | ObjectId | yes |  | Primary key |
| user_id | ObjectId (ref users) | no |  | User who performed action |
| admin_id | ObjectId (ref users) | no |  | Admin who performed action |
| ip_address | string | no |  | Actor IP |
| user_agent | string | no |  | Actor UA |
| action | string | yes |  | Action name |
| resource_type | string | yes |  | Resource type |
| resource_id | string | no |  | Resource identifier |
| old_values | object | no |  | Before state |
| new_values | object | no |  | After state |
| metadata | object | no |  | Extra context (request_id, session_id, api_endpoint, method, status_code) |
| timestamp | date | yes | now | Event time |

Indexes / Constraints
- timestamp (-1); user_id (1), timestamp (-1)
- action (1), resource_type (1)
- ip_address (1), timestamp (-1)
- TTL: timestamp (1) with expireAfterSeconds: 31536000 (1 year)

Relationships
- user_id/admin_id → users._id

---

## sessions

JWT session registry (hash) and device metadata. Supports single-session policy.

Fields
| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| _id | ObjectId | yes |  | Primary key |
| user_id | ObjectId (ref users) | yes |  | User |
| session_token | string | yes, unique |  | JWT token hash |
| device_info | string | no |  | Device info string |
| ip_address | string | no |  | Client IP |
| user_agent | string | no |  | Client UA |
| active | boolean | yes | true | Session is active |
| expires_at | date | yes |  | Expiry (also used by TTL index) |
| created_at | date | yes | now | |
| last_accessed | date | yes | now |  |

Indexes / Constraints
- session_token (1) unique
- user_id (1), active (1)
- TTL: expires_at (1) with expireAfterSeconds: 0

Relationships
- user_id → users._id

---

Notes / Assumptions
- Item source policy: Items with source=vip_sub are functionally active only while vip_status='active'. The application layer should respect this without removing items from users.items; a denormalized/read model can mark visibility.
- Patches vs translations: patches is the authoritative model for downloadable patch artifacts with cloud storage integration. translations can be retained for legacy or multi-language metadata.
- Transactions.type includes 'item_purchase' to explicitly record item unlocks; if omitted in implementation, item purchases can be tracked with points_conversion + audit_logs; the recommended approach is to use item_purchase for clarity.
- Redis is used for sessions, caches, rate limits, and signed URL caches; it is out of scope for MongoDB schema but influences indexes and query design.
- All sensitive fields (password_hash) must be stored securely; field-level encryption can be applied as needed.

