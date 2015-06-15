
CREATE TABLE IF NOT EXISTS cd_events
(
  id character varying NOT NULL,
  name character varying,
  date timestamp with time zone,
  location character varying,
  description character varying,
  capacity integer,
  public boolean,
  category character varying,
  user_types character varying[],
  status character varying,
  created_at timestamp with time zone,
  created_by character varying,
  CONSTRAINT pk_cd_events_id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);

CREATE TABLE IF NOT EXISTS cd_applications
(
  id character varying NOT NULL,
  event_id character varying,
  user_id character varying,
  name character varying,
  date_of_birth date,
  attended boolean,
  status character varying,
  CONSTRAINT pk_cd_applications_id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);