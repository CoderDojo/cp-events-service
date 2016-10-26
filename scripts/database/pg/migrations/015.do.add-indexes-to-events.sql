DO $$
  BEGIN
    BEGIN
        CREATE INDEX events_country ON cd_events((country->>'name'));
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'table cd_events already have index on column country.';
    END;
    BEGIN
	    CREATE INDEX events_city ON cd_events((city->>'name'));
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'table cd_events already have index on column country.';
    END;
  END;
$$
