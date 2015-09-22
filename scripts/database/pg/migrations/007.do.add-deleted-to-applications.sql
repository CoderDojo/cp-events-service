DO $$
    BEGIN
        BEGIN
            ALTER TABLE cd_applications ADD COLUMN deleted boolean DEFAULT false;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column deleted already exists in cd_applications.';
        END;
    END;
$$