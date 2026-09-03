import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
# Look for SUPABASE_KEY first, fallback to SUPABASE_SERVICE_ROLE_KEY used on Render
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase environment variables in production.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)