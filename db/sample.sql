INSERT INTO users (email, password_hash) -- hashed_password
VALUES ('demo@user.com', '$2b$12$1fcoQ5bToypnjRbAYlMNBOfxAd.uwdvZLyQF9yMvZI1Cyj6KfRFqS');

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


INSERT INTO assets (ticker, name, currency, theme, type)
VALUES
('AAPL', 'Apple Inc.','EUR', 'Global Equity', 'stock'),
('VWCE.DE', 'Vanguard FTSE All-World ETF', 'EUR', 'Global Equity', 'etf'),
(NULL, 'Fondo Indexado Global', 'EUR', 'Global Equity', 'fund'),
('BTC-EUR', 'Bitcoin', 'EUR', 'Tech', 'crypto'),
('ETH-EUR', 'Ethereum', 'EUR', 'Tech', 'crypto');

INSERT INTO assets (isin, name, currency,theme, type)
VALUES
('LU0625737910', 'Pictet-China Index P EUR', 'EUR', 'Emerging Markets', 'fund'),
('LU1372006947', 'Cobas Selection Fund Class P Acc EUR', 'EUR', 'Active Managements', 'fund'),
('IE000ZYRH0Q7', 'iShares Developed World Index (IE) Acc EUR clase S', 'EUR', 'Global Equity', 'fund'),
('IE000QAZP7L2', 'iShares Emerging Markets Index Fund (IE) Acc EUR clase S', 'EUR', 'Emerging Markets', 'fund');


INSERT INTO operations (asset_id, account_id, date, quantity, price, operation_type)
VALUES
(1, 2, NOW() - INTERVAL '30 days', 10, 150, 'buy'),
(2, 2, NOW() - INTERVAL '20 days', 5, 100, 'buy'),
(3, 2, NOW() - INTERVAL '15 days', 20, 50, 'buy'),
(4, 3, NOW() - INTERVAL '7 days', 0.05, 45000, 'buy'),
(5, 3, NOW() - INTERVAL '5 days', 0.5, 3000, 'buy'),
(5, 3, NOW() - INTERVAL '1 day', 0.1, 3200, 'sell'),
(6, 3, NOW() - INTERVAL '1 day', 0.1, 180, 'buy');

INSERT INTO price_history (asset_id, date, price)
VALUES
(3, CURRENT_DATE, 52);
