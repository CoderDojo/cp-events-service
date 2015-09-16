DO $$
		BEGIN

				PERFORM * FROM information_schema.columns WHERE table_schema = 'public' AND table_name   = 'cd_events' AND column_name  = 'dates' AND data_type = 'ARRAY' AND udt_name = '_json';

				IF NOT FOUND THEN
					BEGIN
							ALTER TABLE cd_events ADD COLUMN dates_json json[];
					EXCEPTION
							WHEN duplicate_column THEN RAISE NOTICE 'column dates_json already exists in cd_events.';
					END;

					UPDATE cd_events e SET dates_json = (
						SELECT array (
						SELECT row_to_json(t) FROM (
						SELECT "startTime" - (SELECT EXTRACT(timezone_hour FROM "startTime") * INTERVAL '1 HOURS')  as "startTime",
						"startTime" - (SELECT EXTRACT(timezone_hour FROM "startTime") * INTERVAL '1 HOURS') + interval '2 hours' as "endTime" FROM (
						SELECT unnest(dates) as "startTime" from cd_events ev where ev.id = e.id ) s) t ) );

					ALTER TABLE cd_events DROP COLUMN dates;
					ALTER TABLE cd_events RENAME COLUMN dates_json TO dates;
				ELSE
					 RAISE NOTICE 'column dates already is already of type json[].';
					 END IF;
		END;
$$