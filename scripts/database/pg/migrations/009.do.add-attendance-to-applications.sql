DO $$
    BEGIN
        BEGIN
            ALTER TABLE cd_applications ADD COLUMN attendance timestamp with time zone[];
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column attendance already exists in cd_applications.';
        END;
    END;
$$