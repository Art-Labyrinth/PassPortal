CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(10) NOT NULL CHECK (status IN ('PAID', 'UNPAID', 'USED', 'INACTIVE')),
  comment TEXT,
  uuid UUID NOT NULL UNIQUE,
  phone VARCHAR(20),
  email VARCHAR(255),
  purchase_date TIMESTAMP NOT NULL DEFAULT NOW(),
  verification_date TIMESTAMP
);

-- Индексы для ускорения поиска
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_uuid ON tickets(uuid);
CREATE INDEX IF NOT EXISTS idx_tickets_purchase_date ON tickets(purchase_date);
