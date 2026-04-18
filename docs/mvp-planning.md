1. Define the schema first
      - users
      - clubs
      - events
      - event_rsvps
      - event_attendance
      - member_of
  2. Set up Google OAuth and role resolution
      - one login page
      - after sign-in, look up the email in your DB
      - redirect student to student app
      - redirect admin to admin portal
  3. Build route protection and redirects after auth exists
      - protect student pages
      - protect admin pages
      - use proxy.ts only for simple optimistic redirects if you want
      - keep the real permission checks in server-side code
  4. Build the admin vertical slice first
      - admin can sign in
      - admin can create a club event
      - event can be public or member-only
      - store club spreadsheet link and signup URL
  5. Then build the student vertical slice
      - student can sign in
      - student can view calendar
      - student can RSVP to public events
      - student can attempt RSVP to member-only events
  6. Then implement membership check
      - on member-only RSVP, call your existing membership API
      - if verified, create RSVP
      - if not, show error and redirect to club signup page
      - log every check result
  7. Then add QR attendance
      - event detail page shows QR
      - scan checks logged-in user
      - prevent duplicate attendance
      - award points via point_transactions
  8. Then add dashboards
      - student: attended events, points total
      - club admin: RSVP count, attendance count, past/current events

  The key point is: build this as working slices, not layers in isolation. A good first slice is:

  - Google sign-in
  - role redirect
  - admin creates event
  - student sees event

  After that, the next slice is:

  - RSVP
  - membership check for member-only events

  Then:

  - QR attendance
  - points
  - counts/dashboard