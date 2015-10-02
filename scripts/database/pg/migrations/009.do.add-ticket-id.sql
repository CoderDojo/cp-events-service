DO $$
    BEGIN
        BEGIN
            ALTER TABLE cd_applications ADD COLUMN ticket_id character varying;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column ticket_id already exists in cd_applications.';
        END;
    END;
$$