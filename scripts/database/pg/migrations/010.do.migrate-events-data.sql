DO $$
	BEGIN
		BEGIN
			FOR event in SELECT * FROM cd_events
			LOOP
				INSERT INTO cd_sessions (name, description, event_id, tickets, status) VALUES ('General', 'General Session', event.id, '{ {"name": "General Admission", "type": "other", "quantity": 40 } }');
			END LOOP;
		END;
	END;
$$