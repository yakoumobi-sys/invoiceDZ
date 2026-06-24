import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  "https://ztymrzxyrmrycrdorwmw.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0eW1yenh5cm1yeWNyZG9yd213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDMwMzksImV4cCI6MjA5Nzg3OTAzOX0.RjtgT2_73NX0LgQ7BhY1XxqQbjhHVK_AgNIefvATbqE"
);
