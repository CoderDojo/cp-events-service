
CREATE TABLE IF NOT EXISTS cd_events
(
  id character varying NOT NULL,
  name character varying,
  country json,
  city json,
  address character varying,
  capacity integer,
  created_at timestamp with time zone,
  created_by character varying,
  type character varying,
  dates timestamp with time zone[],
  description character varying,
  dojo_id character varying,
  invites json[],
  position json,
  public boolean,
  status character varying,
  user_type character varying,
  CONSTRAINT pk_cd_events_id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);

CREATE TABLE IF NOT EXISTS cd_applications
(
  id character varying NOT NULL,
  name character varying,
  date_of_birth date,
  event_id character varying,
  status character varying,
  user_id character varying,
  CONSTRAINT pk_cd_applications_id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);

CREATE TABLE IF NOT EXISTS cd_attendance
(
  id character varying NOT NULL,
  user_id character varying,
  event_id character varying,
  event_date timestamp with time zone,
  attended boolean,
  CONSTRAINT pk_cd_attendance PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);