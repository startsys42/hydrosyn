CREATE UNIQUE INDEX unique_pump_day_hour
ON public.programming_pumps (pump, day_of_week, clock);