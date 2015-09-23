DO $$
  BEGIN
    BEGIN
      ALTER TABLE cd_events DROP IF EXISTS user_type;
      ALTER TABLE cd_events DROP IF EXISTS capacity;
    END;
    BEGIN
      DROP TABLE IF EXISTS cd_attendance;
    END;
  END;
$$