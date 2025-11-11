-- Create the messages table
CREATE TABLE public.messages (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    message text,
    sales_tag text,
    user_id uuid,
    CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Set table owner
ALTER TABLE public.messages OWNER TO postgres;

-- Create sequence for the id
CREATE SEQUENCE public.messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Set sequence owner
ALTER TABLE public.messages_id_seq OWNER TO postgres;

-- Link sequence to the table
ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;

-- Set id default value
ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);

-- Add primary key constraint
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policy for users to select their own messages
CREATE POLICY "Enable select for users based on user_id"
ON public.messages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for users to insert their own messages
CREATE POLICY "Enable insert for authenticated users"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
