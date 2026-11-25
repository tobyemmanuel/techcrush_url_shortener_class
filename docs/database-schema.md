# Database schema

PostgreSQL, managed through Sequelize models in `src/models/`. Column names are snake_case in the database and camelCase in JavaScript.

```
users 1 ───< urls 1 ───< clicks
```

## users

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID, primary key | |
| name | varchar(100) | |
| email | varchar(255), unique | Stored in lower case |
| password_hash | varchar(255) | bcrypt hash. Never returned by the API |
| role | enum(`user`, `admin`) | Default `user`. Drives RBAC |
| is_active | boolean | `false` blocks login and every authenticated request |
| is_email_verified | boolean | |
| email_verify_token_hash | varchar(64) | SHA-256 of the emailed token. Cleared after use |
| email_verify_expires | timestamptz | 24 hours after issue |
| password_reset_token_hash | varchar(64) | SHA-256 of the emailed token. Cleared after use |
| password_reset_expires | timestamptz | 1 hour after issue |
| password_changed_at | timestamptz | Login cookies issued before this moment stop working |
| last_login_at | timestamptz | |
| created_at, updated_at | timestamptz | |

## urls

| Column | Type | Notes |
| --- | --- | --- |
| id | UUID, primary key | |
| user_id | UUID, foreign key to users | Deleting a user deletes their URLs |
| code | varchar(32), unique | The short code, for example `aB3xK9z`. Case sensitive |
| original_url | text | The destination |
| is_custom_alias | boolean | `true` when the user chose the code |
| is_active | boolean | `false` makes the link return 404 |
| expires_at | timestamptz, nullable | After this moment the link returns 410 |
| click_count | integer | Fast counter, updated on every visit |
| last_clicked_at | timestamptz, nullable | |
| created_at, updated_at | timestamptz | |

Indexes: unique on `code`, plus `user_id` and `created_at`.

## clicks

One row per visit. Used for the statistics endpoint.

| Column | Type | Notes |
| --- | --- | --- |
| id | bigint, auto increment, primary key | |
| url_id | UUID, foreign key to urls | Deleting a URL deletes its clicks |
| ip | varchar(64) | |
| user_agent | varchar(512) | |
| referer | varchar(2048) | |
| created_at | timestamptz | The time of the visit |

Index: `(url_id, created_at)`.

## Why both `click_count` and the `clicks` table?

`click_count` answers "how many total clicks?" instantly, without counting rows. The `clicks` table answers deeper questions such as "clicks per day" or "top referrers". The two are updated together by `recordClick` in `src/services/urlService.js`.
