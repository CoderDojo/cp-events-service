DO $$
  BEGIN
    BEGIN
        ALTER TABLE cd_applications ADD COLUMN notes character varying;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column notes already exists in cd_applications.';
    END;
  END;
$$
