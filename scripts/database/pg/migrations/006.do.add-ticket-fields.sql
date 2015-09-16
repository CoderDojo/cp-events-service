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
    END;
$$