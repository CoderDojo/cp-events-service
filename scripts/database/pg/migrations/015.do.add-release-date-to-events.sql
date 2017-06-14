DO $$
  BEGIN
    BEGIN
        ALTER TABLE cd_events ADD COLUMN tickets_released boolean DEFAULT FALSE;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column tickets_released already exists in cd_events.';
    END;
    BEGIN
        ALTER TABLE cd_events ADD COLUMN release_date timestamptz DEFAULT NULL;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column release_date already exists in cd_events.';
    END;

  END;
$$
