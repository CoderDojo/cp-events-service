DO $$
    BEGIN
        BEGIN
            ALTER TABLE cd_applications ADD COLUMN dojo_id character varying;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column dojo_id already exists in cd_applications.';
        END;
    END;
$$