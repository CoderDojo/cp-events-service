DO $$
    BEGIN
        BEGIN
            ALTER TABLE cd_applications ADD COLUMN created timestamp with time zone;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column created already exists in cd_applications.';
        END;
    END;
$$