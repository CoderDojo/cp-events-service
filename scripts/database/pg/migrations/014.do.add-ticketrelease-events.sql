DO $$
    BEGIN
        BEGIN
            ALTER TABLE cd_events ADD COLUMN ticket_release_use boolean DEFAULT FALSE;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column ticket_release_use already exists in cd_events.';
        END;
        BEGIN
            ALTER TABLE cd_events ADD COLUMN ticket_release_date timestamp with time zone;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column ticket_release_date already exists in cd_events.';
        END;
    END;
$$