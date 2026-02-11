-- Tipos de datos utilizados en este schema:
-- TIMESTAMP WITH TIME ZONE (TIMESTAMPTZ) para fechas con zona horaria
-- NUMERIC(15,6) para valores monetarios con 6 decimales
-- BIGSERIAL para IDs autoincrementales grandes
-- BOOLEAN DEFAULT TRUE para flags activos/inactivos

CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
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
    is_active BOOLEAN DEFAULT TRUE
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

CREATE TABLE rebalance_settings (
    rebalance_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    asset_id BIGINT NOT NULL,
    target_percentage NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_rebalance_user
        FOREIGN KEY (user_id) REFERENCES users(user_id),
    
    CONSTRAINT fk_rebalance_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id),

    CONSTRAINT uq_user_rebalance_asset UNIQUE (user_id, asset_id),
    
    CONSTRAINT chk_positive_percentage CHECK (target_percentage >= 0)
);

CREATE INDEX idx_rebalance_user_id ON rebalance_settings(user_id);

CREATE TABLE price_history (
    price_id BIGSERIAL PRIMARY KEY,
    asset_id BIGINT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    price NUMERIC(15,6) NOT NULL,

    CONSTRAINT fk_price_asset
        FOREIGN KEY (asset_id) REFERENCES assets(asset_id),

    CONSTRAINT uq_asset_date UNIQUE (asset_id, date)
);

CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(date);

CREATE INDEX idx_operations_asset ON operations(asset_id);
CREATE INDEX idx_operations_account ON operations(account_id);

CREATE INDEX idx_price_asset_date ON price_history(asset_id, date);
