DO $$
  BEGIN
    ALTER TABLE cd_sessions DROP IF EXISTS tickets;
  END;
$$