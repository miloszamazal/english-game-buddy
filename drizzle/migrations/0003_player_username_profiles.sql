CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 username text NOT NULL CHECK (char_length(username) BETWEEN 1 AND 30 AND username = btrim(username)),
 normalized_username text GENERATED ALWAYS AS (lower(btrim(username))) STORED UNIQUE
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Player names for login menu" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE FUNCTION public.create_player_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE player_name text; expected_email text;
BEGIN
 player_name := btrim(NEW.raw_user_meta_data->>'username');
 IF player_name IS NULL OR char_length(player_name) NOT BETWEEN 1 AND 30 THEN
  RAISE EXCEPTION 'Invalid player name';
 END IF;
 expected_email := encode(sha256(convert_to(lower(player_name), 'UTF8')), 'hex') || '@players.invalid';
 IF NEW.email IS DISTINCT FROM expected_email THEN
  RAISE EXCEPTION 'Invalid player identity';
 END IF;
 INSERT INTO public.profiles(id, username) VALUES (NEW.id, player_name);
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_player_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER create_quiz_player_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_player_profile();
DROP POLICY "Anyone can add results" ON public.quiz_results;
CREATE POLICY "Signed in players add their results" ON public.quiz_results FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.username = quiz_results.player_name));