
CREATE TABLE IF NOT EXISTS cd_events
(
  id character varying NOT NULL,
  name character varying,
  date timestamp with time zone,
  country json,
  city json,
  address character varying,
  description character varying,
  capacity integer,
  public boolean,
  category character varying,
  user_types character varying[],
  dojo_id character varying,
  status character varying,
  invites json[],
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