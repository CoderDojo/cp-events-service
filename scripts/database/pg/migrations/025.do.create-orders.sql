CREATE TABLE IF NOT EXISTS cd_orders
(
  id uuid NOT NULL,
  event_id character varying REFERENCES cd_events (id),
  user_id character varying,
  created_at timestamp,
  CONSTRAINT pk_cd_orders_id PRIMARY KEY (id)
);

ALTER TABLE cd_applications ADD COLUMN order_id uuid REFERENCES cd_orders (id);