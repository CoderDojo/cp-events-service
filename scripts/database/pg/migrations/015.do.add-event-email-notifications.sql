DO $$
  BEGIN
    BEGIN
        ALTER TABLE cd_events ADD COLUMN email_notifications boolean DEFAULT FALSE;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column email_notifications already exists in cd_events.';
    END;
  END;
$$
