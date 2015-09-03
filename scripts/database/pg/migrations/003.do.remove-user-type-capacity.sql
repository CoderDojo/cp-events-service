DO $$ 
    BEGIN
		ALTER TABLE cd_events DROP IF EXISTS user_type;
		ALTER TABLE cd_events DROP IF EXISTS capacity;
	END;
$$