CREATE FUNCTION f_event_occurrences()
  RETURNS void AS $$
  BEGIN
    CREATE OR REPLACE VIEW v_event_occurrences AS (
      SELECT * FROM (
        SELECT *, unnest(dates)->>'startTime' as start_time, unnest(dates)->>'endTime' as end_time FROM cd_events
      ) x WHERE start_time IS NOT NULL AND start_time NOT LIKE 'Invalid%' AND end_time IS NOT NULL AND end_time NOT LIKE 'Invalid%'
    );
  END;
$$ LANGUAGE plpgsql;
SELECT f_event_occurrences();
