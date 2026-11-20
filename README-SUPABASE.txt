AUREON — CLIENT BRIEF + SUPABASE
=================================

FILES
- index.html              Public AUREON questionnaire
- style.css               Original premium AUREON design and responsive styles
- script.js               Multi-step form, 4-color palette, Supabase submission
- aureon-logo.jfif        Supplied AUREON logo
- supabase-config.js      Supabase project URL + publishable key placeholders
- supabase-setup.sql      Database table, grants and Row Level Security policies
- admin.html              Private admin login and client briefs dashboard
- admin.css               Dashboard styles
- admin.js                Admin authentication, list, detail and TXT export

STEP 1 — CREATE THE SUPABASE PROJECT
1. Open https://supabase.com/ and create a project.
2. Save the database password somewhere secure.
3. Wait until the project is ready.
4. In Project Settings > API Keys (or the API section), copy:
   - Project URL
   - Publishable key (preferred), or legacy anon key if the dashboard shows it.
5. Do NOT copy a secret key or service_role key into this website.

STEP 2 — CREATE YOUR AUREON ADMIN USER
1. In Supabase, open Authentication > Users.
2. Add a user using an AUREON-controlled email address and a strong password.
3. Confirm the user if the dashboard asks you to.
4. Copy the user's UUID/ID from the Users list. This is the administrator identity.

STEP 3 — CREATE THE DATABASE SECURELY
1. Open SQL Editor in Supabase.
2. Open this project's supabase-setup.sql.
3. Replace ADMIN_USER_UUID with the exact UUID copied in Step 2.
4. Run the complete SQL script.
5. The public visitor role receives INSERT only.
6. Authenticated users receive SELECT permission, but the RLS policy allows
   SELECT only for the exact administrator UUID.
7. No public SELECT, UPDATE or DELETE policy is created.

STEP 4 — CONNECT THE WEBSITE
1. Open supabase-config.js.
2. Replace YOUR_PROJECT_URL with your Project URL, e.g.
   https://abcdefghijk.supabase.co
3. Replace YOUR_PUBLISHABLE_KEY with your publishable key.
4. Save the file.
5. Keep this file in the GitHub repository. The publishable key is intended
   for browser use; the database RLS policies are what protect the data.
6. NEVER put a Supabase secret key or service_role key in any HTML or JS file.

STEP 5 — TEST LOCALLY
1. Open the project folder in VS Code.
2. Use the Live Server extension, or run: python -m http.server 8000
3. Open http://localhost:8000
4. Complete a test brief and submit it.
5. In Supabase > Table Editor > client_briefs, confirm that the row exists.
6. Open http://localhost:8000/admin.html and sign in with your admin user.
7. Confirm that you can see the submission and export it.

STEP 6 — PUBLISH ON GITHUB PAGES
1. Push all project files to your GitHub repository.
2. In repository Settings > Pages, select Deploy from a branch.
3. Select your main branch and / (root), then Save.
4. Wait for GitHub Pages to publish.
5. Public link: https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
6. Admin link: https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/admin.html

SECURITY NOTES
- The browser contains only the Supabase publishable key. This key is not a password.
- RLS is mandatory. Do not publish before running the SQL setup successfully.
- Never add the service_role / secret key to the repository.
- The dashboard hides itself until Supabase Auth reports a valid session.
- Database RLS is the actual security boundary; hiding the dashboard is not security.
- This starter permits public submissions. For a public production form, consider
  adding CAPTCHA/Turnstile and rate limiting through a server-side Edge Function
  to reduce spam. Do not put privileged keys in the browser.
- Admin account password reset and MFA can be enabled in Supabase Auth settings.

TROUBLESHOOTING
- "Le formulaire n'est pas encore connecté": supabase-config.js still has placeholders.
- "permission denied" or insert error: check that the SQL ran, RLS is enabled,
  and anon has INSERT grant plus the Public can submit client briefs policy.
- Admin can log in but sees no briefs: confirm the UUID in the SQL matches the
  Auth user UUID, and that the select policy exists.
- If you change the admin account, update the UUID in the policy using SQL.
