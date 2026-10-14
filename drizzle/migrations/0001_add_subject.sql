ALTER TABLE public.questions ADD COLUMN subject text NOT NULL DEFAULT 'en';
CREATE INDEX questions_subject_idx ON public.questions(subject);