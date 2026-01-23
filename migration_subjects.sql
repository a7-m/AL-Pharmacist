-- ==========================================
-- Migration: Add Subjects Support
-- Purpose: Divide platform into 4 subjects
-- ==========================================

-- ==========================================
-- 1. Create subjects table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name_en TEXT NOT NULL UNIQUE,
    name_ar TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '📚',
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. Add subject_id to existing tables
-- ==========================================

-- Add subject_id to videos table
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects (id) ON DELETE SET NULL;

-- Add subject_id to quizzes table
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects (id) ON DELETE SET NULL;

-- Add subject_id to files table
ALTER TABLE public.files
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects (id) ON DELETE SET NULL;

-- ==========================================
-- 3. Create indexes for performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_videos_subject_id ON public.videos (subject_id);

CREATE INDEX IF NOT EXISTS idx_quizzes_subject_id ON public.quizzes (subject_id);

CREATE INDEX IF NOT EXISTS idx_files_subject_id ON public.files (subject_id);

CREATE INDEX IF NOT EXISTS idx_subjects_order ON public.subjects ("order");

-- ==========================================
-- 4. Enable RLS on subjects table
-- ==========================================
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read subjects
CREATE POLICY "Authenticated users can view subjects" ON public.subjects FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

-- ==========================================
-- 5. Insert initial subject data
-- ==========================================
INSERT INTO
    public.subjects (
        name_en,
        name_ar,
        description,
        icon,
        "order"
    )
VALUES (
        'Medicinal plants',
        'نباتات طبية',
        'دراسة النباتات الطبية وخصائصها العلاجية والاستخدامات الدوائية',
        '🌿',
        1
    ),
    (
        'Pharmacognosy',
        'علم العقاقير',
        'علم دراسة الأدوية المستخرجة من مصادر طبيعية',
        '💊',
        2
    ),
    (
        'Scientific writing',
        'الكتابة العلمية',
        'تعلم مهارات الكتابة العلمية والبحثية الأكاديمية',
        '✍️',
        3
    ),
    (
        'Analytical 3',
        'تحليلي 3',
        'التحليل الصيدلاني والكيميائي المتقدم',
        '🔬',
        4
    ) ON CONFLICT (name_en) DO NOTHING;

-- ==========================================
-- 6. Update trigger for updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subjects_updated_at
    BEFORE UPDATE ON public.subjects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- Migration Complete!
-- ==========================================
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify subjects table is created with 4 records
-- 3. Verify subject_id columns added to videos/quizzes/files
-- 4. Update frontend to use subjects