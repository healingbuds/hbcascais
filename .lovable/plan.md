

## Update Passwords for Three Users

The three target emails are:
- `maykendaal23@gmail.com` (Mayke Odendaal)
- `scott.k1@outlook.com` (Scott Hickling)
- `varseainc@gmail.com` (Benjamin Varcianna)

Currently only the admin account (`healingbudsglobal@gmail.com`) exists in auth. These three users exist as Dr. Green client records but don't have auth accounts yet.

### Implementation
Call the existing `admin-update-user` edge function three times with:
```json
{ "email": "<email>", "password": "12345678", "verify": true }
```

This will **create** auth accounts for each (since they don't exist yet) with password `12345678` and email pre-verified. The `auto_link_drgreen_on_signup` trigger and `handle_new_user` trigger will automatically create profiles and link their client records.

### Steps
1. Invoke `admin-update-user` for `maykendaal23@gmail.com`
2. Invoke `admin-update-user` for `scott.k1@outlook.com`
3. Invoke `admin-update-user` for `varseainc@gmail.com`

No code changes needed — just three edge function invocations.

