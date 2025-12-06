-- Create table for tracking money borrowed from others
CREATE TABLE public.borrowed_from_others (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lender_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.borrowed_from_others ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own borrow records" 
ON public.borrowed_from_others 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own borrow records" 
ON public.borrowed_from_others 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own borrow records" 
ON public.borrowed_from_others 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own borrow records" 
ON public.borrowed_from_others 
FOR DELETE 
USING (auth.uid() = user_id);