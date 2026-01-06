INSERT INTO users (email, password_hash)
VALUES ('demo@user.com', 'hashed_password');

INSERT INTO accounts (user_id, name, type, currency)
VALUES
(1, 'Cuenta Bancaria', 'bank', 'EUR'),
(1, 'Broker Principal', 'broker', 'EUR'),
(1, 'Wallet Cripto', 'crypto', 'EUR');


INSERT INTO transactions (account_id, category, date, amount, type, description)
VALUES
(1, 'Alimentación', NOW() - INTERVAL '2 days', 75.50, 'expense', 'Compra supermercado'),
(1, 'Transporte', NOW() - INTERVAL '5 days', 40.00, 'expense', 'Gasolina'),
(1, 'Salario', NOW() - INTERVAL '10 days', 1500.00, 'income', 'Nómina'),
(3, 'Criptomonedas', NOW() - INTERVAL '3 days', 100.00, 'expense', 'Compra de Bitcoin'),
(3, 'Criptomonedas', NOW() - INTERVAL '1 day', 500.00, 'income', 'Venta de Ethereum');


INSERT INTO assets (ticker, name, currency, themes, type)
VALUES
('AAPL', 'Apple Inc.','EUR', 'Global Equity', 'stock'),
('VWCE', 'Vanguard FTSE All-World ETF', 'EUR', 'Global Equity', 'etf'),
(NULL, 'Fondo Indexado Global', 'EUR', 'Global Equity', 'fund'),
('BTC', 'Bitcoin', 'EUR', 'Tech', 'crypto'),
('ETH', 'Ethereum', 'EUR', 'Tech', 'crypto');

INSERT INTO operations (asset_id, account_id, date, quantity, price, operation_type)
VALUES
(1, 2, NOW() - INTERVAL '30 days', 10, 150, 'buy'),
(2, 2, NOW() - INTERVAL '20 days', 5, 100, 'buy'),
(3, 2, NOW() - INTERVAL '15 days', 20, 50, 'buy'),
(4, 3, NOW() - INTERVAL '7 days', 0.05, 45000, 'buy'),
(5, 3, NOW() - INTERVAL '5 days', 0.5, 3000, 'buy'),
(5, 3, NOW() - INTERVAL '1 day', 0.1, 3200, 'sell');

INSERT INTO price_history (asset_id, date, price)
VALUES
(1, CURRENT_DATE, 170),
(2, CURRENT_DATE, 110),
(3, CURRENT_DATE, 52),
(4, CURRENT_DATE, 48000),
(5, CURRENT_DATE, 3300);
