DO $$
    BEGIN
        BEGIN
            ALTER TABLE cd_events ADD COLUMN sessions json[];
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column sessions already exists in cd_events.';
        END;
    END;
$$