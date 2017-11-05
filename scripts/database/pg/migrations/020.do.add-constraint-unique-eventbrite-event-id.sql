DO $$
  BEGIN
    BEGIN
        ALTER TABLE cd_events ADD UNIQUE (eventbrite_id);
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'constraint eventbrite_id already exists in cd_events.';
    END;
  END;
$$
