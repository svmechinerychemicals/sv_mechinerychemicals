# SV Machinery Website

Responsive business website for S.V. Mechinery Chemicals Sales and Service.

## Run locally

1. Install Node.js 18 or newer.
2. Run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3000`.

To test email notifications locally, copy `.env.example` to `.env`, replace the example values, and restart the server.

## Deploy

This is a small Node.js/Express application. Deploy the project root to a Node.js host and use:

```bash
npm install --omit=dev
npm start
```

Set the host's `PORT` environment variable when required. The application serves the frontend from `public/` and business assets from `assets/`.

For production, keep `data/submissions.jsonl` on persistent storage or replace the file-based handler with a hosted database. Do not commit real customer submissions to source control.

## Form submissions

Submitted quote requests are posted to `POST /api/quote` and stored in `data/submissions.jsonl`. When the Resend environment variables are configured, the same inquiry is also emailed to `NOTIFICATION_EMAIL`.

## Enable email notifications

1. Create a free account at [Resend](https://resend.com/).
2. Create an API key and keep it private.
3. For testing, use `FROM_EMAIL=Website <onboarding@resend.dev>`.
4. Set `RESEND_API_KEY`, `NOTIFICATION_EMAIL`, and `FROM_EMAIL` in the hosting provider's environment settings.
5. Redeploy or restart the application.
6. Submit one test inquiry and check the notification inbox.

For production sending, verify your own domain in Resend and use an address such as `Website <no-reply@yourdomain.com>` for `FROM_EMAIL`.

## Production checklist

- Use Node.js 18 or newer.
- Configure a domain and HTTPS at the hosting provider or reverse proxy.
- Set `PORT` if the host does not provide port 3000 automatically.
- Confirm `data/` is writable and persistent.
- Submit one real test inquiry after deployment and verify the response.
- Replace the localhost URL with the real domain in any future canonical or social metadata.
- Configure Resend email variables before expecting automatic notifications.