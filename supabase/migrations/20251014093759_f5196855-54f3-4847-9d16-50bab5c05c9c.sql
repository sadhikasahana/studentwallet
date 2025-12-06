-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table to store parent contact information
CREATE TABLE public.parent_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.parent_contacts ENABLE ROW LEVEL SECURITY;

-- Allow all operations (since this is a demo app without auth)
CREATE POLICY "Allow all operations on parent_contacts"
ON public.parent_contacts
FOR ALL
USING (true)
WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_parent_contacts_updated_at
  BEFORE UPDATE ON public.parent_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();