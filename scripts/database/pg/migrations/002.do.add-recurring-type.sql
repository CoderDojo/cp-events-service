DO $$
    BEGIN
        BEGIN
            ALTER TABLE cd_events ADD COLUMN recurring_type character varying;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column recurring_type already exists in cd_events.';
        END;
    END;
$$