DO $$
  BEGIN
    BEGIN
      ALTER TABLE cd_events DROP IF EXISTS invites;
    END;
    BEGIN
        ALTER TABLE cd_tickets ADD COLUMN invites json[];
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'column invites already exists in cd_tickets.';
    END;
  END;
$$