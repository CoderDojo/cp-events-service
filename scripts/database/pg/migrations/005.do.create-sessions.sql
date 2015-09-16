CREATE TABLE IF NOT EXISTS cd_sessions
(
  id character varying NOT NULL,
  name character varying,
  event_id character varying,
  tickets json[],
  CONSTRAINT pk_cd_sessions PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);