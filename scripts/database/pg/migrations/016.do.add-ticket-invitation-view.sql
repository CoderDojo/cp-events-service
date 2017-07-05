DO $$
  BEGIN
    CREATE OR REPLACE VIEW v_ticket_invitations AS (
      SELECT session_id,
      id as ticket_id,
      unnest(invites)->>'userId' as "user_id",
      unnest(invites)->>'userNotified' as "notified"
      FROM cd_tickets
    );
  END;
$$
