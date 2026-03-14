
-- Create discount_type enum
CREATE TYPE public.discount_type AS ENUM ('percent', 'fixed');

-- Create promotions table
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  discount_type discount_type NOT NULL DEFAULT 'percent',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  banner_image_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create promotion_items junction table
CREATE TABLE public.promotion_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  promo_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(promotion_id, menu_item_id)
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for promotions (public read for active, admin write)
CREATE POLICY "Anyone can view active promotions"
  ON public.promotions FOR SELECT TO public
  USING (is_active = true AND start_date <= now() AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Admins can manage promotions (select all)"
  ON public.promotions FOR SELECT TO authenticated
  USING (public.has_staff_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert promotions"
  ON public.promotions FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promotions"
  ON public.promotions FOR UPDATE TO authenticated
  USING (public.has_staff_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promotions"
  ON public.promotions FOR DELETE TO authenticated
  USING (public.has_staff_role(auth.uid(), 'admin'));

-- RLS policies for promotion_items (public read, admin write)
CREATE POLICY "Anyone can view promotion items"
  ON public.promotion_items FOR SELECT TO public
  USING (promotion_id IN (
    SELECT id FROM public.promotions 
    WHERE is_active = true AND start_date <= now() AND (end_date IS NULL OR end_date >= now())
  ));

CREATE POLICY "Admins can view all promotion items"
  ON public.promotion_items FOR SELECT TO authenticated
  USING (public.has_staff_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert promotion items"
  ON public.promotion_items FOR INSERT TO authenticated
  WITH CHECK (public.has_staff_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promotion items"
  ON public.promotion_items FOR UPDATE TO authenticated
  USING (public.has_staff_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promotion items"
  ON public.promotion_items FOR DELETE TO authenticated
  USING (public.has_staff_role(auth.uid(), 'admin'));
