DO $$
    BEGIN
        BEGIN
            ALTER TABLE cd_sessions ADD COLUMN status character varying;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column status already exists in cd_sessions.';
        END;
    END;
$$