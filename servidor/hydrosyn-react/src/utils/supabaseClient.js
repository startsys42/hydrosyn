import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iolzdktanpnlofgfjorw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbHpka3RhbnBubG9mZ2Zqb3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTM3NTQsImV4cCI6MjA2OTc4OTc1NH0.JTtINgbiIphtXs0X5Yzi9N3luGKmL30EiZREWJcsj5M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)