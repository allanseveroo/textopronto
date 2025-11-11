-- Create the user_profiles table
CREATE TABLE public.user_profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT DEFAULT 'free' NOT NULL CHECK (plan IN ('free', 'pro')),
    message_count INT DEFAULT 0 NOT NULL
);

-- Set table owner
ALTER TABLE public.user_profiles OWNER TO postgres;

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own profile
CREATE POLICY "Enable select for users based on user_id"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create policy for users to update their own profile
CREATE POLICY "Enable update for users based on user_id"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$;

-- Trigger to execute the function after a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to increment message count (to be called from the app)
CREATE OR REPLACE FUNCTION increment_message_count()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.user_profiles
  SET message_count = message_count + 1
  WHERE id = auth.uid();
END;
$$;
