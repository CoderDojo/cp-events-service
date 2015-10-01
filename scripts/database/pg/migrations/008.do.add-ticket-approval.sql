DO $$
    BEGIN
        BEGIN
            ALTER TABLE cd_events ADD COLUMN ticket_approval boolean DEFAULT FALSE;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column ticket_approval already exists in cd_events.';
        END;
    END;
$$