DO $$
    BEGIN
        BEGIN
            ALTER TABLE cd_events ADD COLUMN choose_release_time boolean DEFAULT FALSE;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column choose_release_time already exists in cd_events.';
        END;
    END;
$$
