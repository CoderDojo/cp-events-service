DO $$
  BEGIN
    BEGIN
        ALTER TABLE cd_events ADD COLUMN notify_on_applicant boolean DEFAULT FALSE;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column notify_on_applicant already exists in cd_events.';
    END;
  END;
$$
