DO $$
    BEGIN
        BEGIN
            ALTER TABLE cd_applications ADD COLUMN attended boolean DEFAULT false;
        EXCEPTION
            WHEN duplicate_column THEN RAISE NOTICE 'column attended already exists in cd_applications.';
        END;
        BEGIN
			DROP TABLE IF EXISTS cd_attendance;
		END;
    END;
$$