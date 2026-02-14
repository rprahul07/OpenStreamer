-- Create user_branding_settings table
CREATE TABLE IF NOT EXISTS public.user_branding_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    app_name TEXT DEFAULT 'Academic Audio Platform',
    app_logo_url TEXT,
    app_icon_url TEXT,
    splash_screen_url TEXT,
    primary_color TEXT DEFAULT '#4F46E5',
    secondary_color TEXT DEFAULT '#10B981',
    accent_color TEXT DEFAULT '#F59E0B',
    background_color TEXT DEFAULT '#FFFFFF',
    text_color TEXT DEFAULT '#1F2937',
    theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'auto')),
    font_family TEXT,
    custom_css TEXT,
    footer_text TEXT DEFAULT '2024 Academic Audio Platform',
    contact_email TEXT,
    social_links TEXT, -- JSON string
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_branding_settings_user_id ON public.user_branding_settings(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_branding_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only access their own branding settings
CREATE POLICY "Users can view own branding settings" ON public.user_branding_settings
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own branding settings" ON public.user_branding_settings
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own branding settings" ON public.user_branding_settings
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_branding_settings TO authenticated;
GRANT SELECT ON public.user_branding_settings TO anon;
