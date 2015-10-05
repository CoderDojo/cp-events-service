CREATE TABLE IF NOT EXISTS cd_tickets
(
  id character varying NOT NULL,
  session_id character varying,
  name character varying,
  type character varying,
  quantity integer,
  deleted smallint DEFAULT 0,
  CONSTRAINT pk_cd_tickets PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);