DO $$
  BEGIN
    DROP FUNCTION f_event_occurrences();
    DROP VIEW v_event_occurrences;
    CREATE OR REPLACE VIEW v_event_occurrences AS (
      SELECT id, name, country, city, address, created_at, created_by, type, description, dojo_id, position, public,
      status, recurring_type, dates, ticket_approval, notify_on_applicant, eventbrite_id, eventbrite_url, use_dojo_address,
      start_time::timestamp, end_time::timestamp FROM (
        SELECT *, unnest(dates)->>'startTime' as start_time, unnest(dates)->>'endTime' as end_time FROM cd_events
      ) x WHERE start_time IS NOT NULL AND start_time NOT LIKE 'Invalid%' AND end_time IS NOT NULL AND end_time NOT LIKE 'Invalid%'
    );
  END;
$$