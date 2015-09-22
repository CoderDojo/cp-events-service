DO $$
	BEGIN
		CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
		DECLARE
    		event RECORD;
    		ticket_string character varying;
		BEGIN
			FOR event in SELECT * FROM cd_events
			LOOP
				ticket_string := '{"name": "General Admission", "type": "other", "quantity": "'||event.capacity||'" }';
				INSERT INTO cd_sessions (id, name, description, event_id, tickets, status) VALUES (uuid_generate_v4(), 'General', 'General Session', event.id, array[ticket_string::json], 'active');
			END LOOP;
		END;
	END;
$$