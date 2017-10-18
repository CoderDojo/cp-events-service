DO $$
  BEGIN
    BEGIN
        ALTER TABLE cd_events ADD COLUMN use_dojo_address boolean;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column useDojoAddress already exists in cd_applications.';
    END;
  END;
$$
