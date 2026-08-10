import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  "https://cjrkqrqznjhorkgcyirt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqcmtxcnF6bmpob3JrZ2N5aXJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTYyOTksImV4cCI6MjEwMTk3MjI5OX0.L37MpwYZNPuNFYCZaSazCLY56v0KjLTcgoqJpOzhisM"
);
