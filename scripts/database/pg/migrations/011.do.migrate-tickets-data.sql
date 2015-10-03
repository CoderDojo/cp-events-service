DO $$
  BEGIN
    PERFORM * FROM schemaversion WHERE name = 'migrate-tickets-data';
    IF NOT FOUND THEN
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      DECLARE
        session RECORD;
        ticketId character varying;
        tickets json;
        ticket json;
      BEGIN
        FOR session in SELECT * FROM cd_sessions
        LOOP
          FOR tickets in SELECT * FROM array_to_json(session.tickets)
          LOOP
            FOR ticket in SELECT * FROM json_array_elements(tickets)
            LOOP
              ticketId := uuid_generate_v4();
              INSERT INTO cd_tickets (id, session_id, name, type, quantity) VALUES (ticketId, session.id, ticket->>'name', ticket->>'type', (ticket->>'quantity')::integer);
            END LOOP;
          END LOOP;
        END LOOP;
      END;
    ELSE
      RAISE NOTICE 'tickets data has already been migrated.';
      END IF;
  END;
$$