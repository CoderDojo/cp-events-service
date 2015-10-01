CREATE TABLE IF NOT EXISTS cd_sessions
(
  id character varying NOT NULL,
  name character varying,
  description character varying,
  event_id character varying,
  tickets json[],
  CONSTRAINT pk_cd_sessions PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);

DO $$
    BEGIN
        BEGIN
            ALTER TABLE cd_applications ADD COLUMN ticket_name character varying;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column ticket_name already exists in cd_applications.';
        END;
        BEGIN
            ALTER TABLE cd_applications ADD COLUMN ticket_type character varying;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column ticket_type already exists in cd_applications.';
        END;
        BEGIN
            ALTER TABLE cd_applications ADD COLUMN session_id character varying;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column session_id already exists in cd_applications.';
        END;
        BEGIN
            ALTER TABLE cd_applications ADD COLUMN created timestamp with time zone;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column created already exists in cd_applications.';
        END;
        BEGIN
            ALTER TABLE cd_applications ADD COLUMN deleted boolean DEFAULT false;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column deleted already exists in cd_applications.';
        END;
        BEGIN
            ALTER TABLE cd_applications ADD COLUMN attendance timestamp with time zone[];
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column attendance already exists in cd_applications.';
        END;
        BEGIN
            ALTER TABLE cd_sessions ADD COLUMN status character varying;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column status already exists in cd_sessions.';
        END;
    END;
$$