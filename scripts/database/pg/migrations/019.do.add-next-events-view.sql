CREATE FUNCTION f_next_events()
  RETURNS void AS $$
  BEGIN
    CREATE OR REPLACE VIEW v_next_events AS (
      SELECT DISTINCT ON (id) * FROM (
        SELECT * FROM (
          SELECT *, unnest(dates)->>'startTime' as next_date FROM cd_events
        ) x WHERE next_date IS NOT NULL AND next_date NOT LIKE 'Invalid%'
      ) as filtered_dates WHERE next_date > to_char(NOW(), 'YYYY-MM-DDTHH:mm:ss') ORDER BY id, next_date
    );
  END;
$$ LANGUAGE plpgsql;
SELECT f_next_events();
