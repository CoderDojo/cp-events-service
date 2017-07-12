DO $$
  BEGIN
    BEGIN
        ALTER TABLE cd_events ADD COLUMN eventbrite_id character varying;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column eventbrite_id already exists in cd_applications.';
    END;
    BEGIN
        ALTER TABLE cd_events ADD COLUMN eventbrite_url character varying;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column eventbrite_url already exists in cd_applications.';
    END;
  END;
$$
