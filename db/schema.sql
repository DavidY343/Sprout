-- Tipos de datos utilizados en este schema:
-- TIMESTAMP WITH TIME ZONE (TIMESTAMPTZ) para fechas con zona horaria
-- NUMERIC(15,6) para valores monetarios con 6 decimales
-- BIGSERIAL para IDs autoincrementales grandes
-- BOOLEAN DEFAULT TRUE para flags activos/inactivos

CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    google_id VARCHAR(255) UNIQUE,
    auth_provider VARCHAR(20) DEFAULT 'email'
);

CREATE TABLE accounts (
    account_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL,
    currency CHAR(3) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_account_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL,
    category VARCHAR(100),
    date TIMESTAMPTZ NOT NULL,
    amount NUMERIC(15,6) NOT NULL,
    type VARCHAR(10) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_transaction_account
        FOREIGN KEY (account_id) REFERENCES accounts(account_id),

    CONSTRAINT chk_transaction_type
        CHECK (type IN ('income', 'expense'))
);


CREATE TABLE assets (
    asset_id BIGSERIAL PRIMARY KEY,
    ticker VARCHAR(50),
    isin VARCHAR(12),
    name VARCHAR(255) NOT NULL,
    currency CHAR(3) NOT NULL,
    theme VARCHAR(255),
    type VARCHAR(30) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT chk_asset_type 
        CHECK (type IN ('stock', 'crypto', 'fund', 'etf', 'bond', 'reit'))
);

CREATE TABLE operations (
    operation_id BIGSERIAL PRIMARY KEY,
    asset_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    quantity NUMERIC(15,6) NOT NULL,
    price NUMERIC(15,6) NOT NULL,
    fees NUMERIC(15,6) DEFAULT 0,
    operation_type VARCHAR(10) NOT NULL,

    CONSTRAINT fk_operation_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id),

    CONSTRAINT fk_operation_account
        FOREIGN KEY (account_id) REFERENCES accounts(account_id),

    CONSTRAINT chk_operation_type
        CHECK (operation_type IN ('buy', 'sell'))
);

CREATE TABLE price_history (
    price_id BIGSERIAL PRIMARY KEY,
    asset_id BIGINT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    price NUMERIC(15,6) NOT NULL,

    CONSTRAINT fk_price_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id),

    CONSTRAINT uq_asset_date UNIQUE (asset_id, date)
);

CREATE TABLE user_assets (
    user_id   BIGINT NOT NULL,
    asset_id  BIGINT NOT NULL,
    PRIMARY KEY (user_id, asset_id),

    CONSTRAINT fk_userasset_user
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,

    CONSTRAINT fk_userasset_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id) ON DELETE CASCADE
);

CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date);

CREATE INDEX idx_operations_asset ON operations(asset_id);
CREATE INDEX idx_operations_account ON operations(account_id);

CREATE INDEX idx_price_asset_date ON price_history(asset_id, date DESC);

CREATE INDEX idx_user_assets_user ON user_assets(user_id);
CREATE INDEX idx_user_assets_asset ON user_assets(asset_id);

CREATE TABLE friendships (
    friendship_id BIGSERIAL PRIMARY KEY,
    requester_id  BIGINT NOT NULL,
    addressee_id  BIGINT NOT NULL,
    status        VARCHAR(10) NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_friendship_requester
        FOREIGN KEY (requester_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_friendship_addressee
        FOREIGN KEY (addressee_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_friendship_status
        CHECK (status IN ('pending', 'accepted')),
    CONSTRAINT chk_no_self_friend
        CHECK (requester_id != addressee_id),
    CONSTRAINT uq_friendship_pair
        UNIQUE (requester_id, addressee_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
