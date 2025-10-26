# 🚀 Vercel Deployment Guide for HireNexa

> ⚠️ **IMPORTANT**: Replace all placeholder values below with your actual keys from `.env.local`

## Step 1: Add Environment Variables to Vercel

Go to your Vercel Dashboard → Project → Settings → Environment Variables

Add ALL of these variables (copy the actual values from your `.env.local` file):

### 🔐 Authentication (REQUIRED)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c3Vubnktcm91Z2h5LTQwLmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_OMqlc4IuAWKUy3LWB5hcZBw2gYGjP6oxI71FNnuDBD
```

### 🗄️ Database (REQUIRED)
```
NEXT_PUBLIC_SUPABASE_URL=https://gimntirghuhezjorzvmm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbW50aXJnaHVoZXpqb3J6dm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDIzODgsImV4cCI6MjA3NjE3ODM4OH0.QoGPDVBnI8OW2HKGXPX36JA-4LWZzI7yy8ooQOwtr9g
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbW50aXJnaHVoZXpqb3J6dm1tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYwMjM4OCwiZXhwIjoyMDc2MTc4Mzg4fQ.h_q7wU-YQZb8R57YvGpPNA0p5_2oqc-WHwPqrAWfYRo
```

### 🔒 Encryption (REQUIRED)
```
ENCRYPTION_KEY=abcb7a142715c5e928a26ec4c6e13bfae8da8faa18d67584ba1637e27e4fe1da
```

### 🤖 AI Services
```
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
CEREBRAS_API_KEY=your_cerebras_api_key
```

### 💬 Chat & Video (REQUIRED for Skill Exchange)
```
NEXT_PUBLIC_TALKJS_APP_ID=tyhpElWZ
TALKJS_SECRET_KEY=sk_test_oCGicC00MmjLX0n7VsayaJcSBvQXpfN
NEXT_PUBLIC_ZEGOCLOUD_APP_ID=561944383
NEXT_PUBLIC_ZEGOCLOUD_APP_SIGN=c08c48ba13a8d5f90667e81816597c9d874916e049c87a66b77bf9695cd8634f
NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET=a9e228bcc627336f7fa7a6401a582f34
NEXT_PUBLIC_ZEGOCLOUD_SERVER_URL=wss://webliveroom561944383-api.coolzcloud.com/ws
```

### ⛓️ Blockchain (Celo)
```
CELO_PRIVATE_KEY=1fd13c68e8410f7faa253dc2901b9e8bde37f3c2abedf20f536d9d3d5ab739d2
NEXT_PUBLIC_CELO_NETWORK=sepolia
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
NEXT_PUBLIC_CELO_CHAIN_ID=11142220
NEXT_PUBLIC_USE_MAINNET=false
NEXT_PUBLIC_LIGHTWEIGHT_ESCROW_ADDRESS=0xfcd5c2462bac1c4ccffe287d9959874ea09b7eb0
NEXT_PUBLIC_CELO_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000
```

### 📁 IPFS Storage
```
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxNzlmZGU2Yi0wOTVhLTQ5NmYtOGJkZC1kZDFkZWVkOTVhYzQiLCJlbWFpbCI6ImRldmFyZ2hvMjQxMDAxMDAxMDc2QHRlY2hub2luZGlhZWR1Y2F0aW9uLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1Y2U0YmRmNmRlODBiZDhjYWZjOCIsInNjb3BlZEtleVNlY3JldCI6Ijc3YWU4N2JjOGUyMTg4YzllMDlmNTc4ZWFmMDEwNjRmYWQ2OWZmMmNiNTUxYTA3MDgxMjcwY2EzOGI1ODAxYWQiLCJleHAiOjE3OTIzMjE3MjN9.irjDy2uiDg6AoAA1zLjhy-tDJosDHtiiqLy1P5sjs2g
PINATA_GATEWAY=gateway.pinata.cloud
```

### 📧 Email & OAuth (Optional)
```
RESEND_API_KEY=your_resend_api_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_TOKEN=your_github_token
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

### 🔑 Admin
```
ADMIN_SECRET_KEY=hirenexa_admin_2025_456
```

### 🌐 App URL (Set to your Vercel domain)
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Step 2: Update Clerk Settings

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Domains** → Add your Vercel domain
4. Go to **Paths** → Update redirect URLs:
   - Sign-in URL: `https://your-app.vercel.app/sign-in`
   - Sign-up URL: `https://your-app.vercel.app/sign-up`
   - After sign-in: `https://your-app.vercel.app/dashboard`
   - After sign-up: `https://your-app.vercel.app/dashboard`

---

## Step 3: Deploy

### Option A: Deploy via Git (Recommended)

```bash
# Commit your changes
git add .
git commit -m "Add Vercel configuration and deployment fixes"
git push origin main
```

Vercel will automatically deploy when you push to your repository.

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## Step 4: Verify Deployment

After deployment:

1. ✅ Check that the app loads
2. ✅ Try to sign in with Clerk
3. ✅ Go to Skill Exchange page
4. ✅ Check browser console (F12) for logs
5. ✅ Check Vercel Function logs:
   - Vercel Dashboard → Your Project → Deployments
   - Click latest deployment → Functions tab
   - Look for the console logs we added

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" or "Failed to fetch matches"
**Solution:** Check that all Supabase and Clerk environment variables are set correctly on Vercel.

### Issue: Barters not showing
**Solution:** 
1. Check Vercel function logs for errors
2. Verify you're logged in with the same account as localhost
3. Check browser console for detailed logs

### Issue: Video/Chat not working
**Solution:** Verify TalkJS and ZegoCloud environment variables are set.

### Issue: Blockchain transactions failing
**Solution:** Check Celo environment variables and ensure MetaMask is connected.

---

## 📊 Monitoring

- **Vercel Analytics**: Vercel Dashboard → Analytics
- **Function Logs**: Vercel Dashboard → Deployments → Functions
- **Browser Console**: F12 → Console tab (shows client-side logs)
- **Supabase Logs**: Supabase Dashboard → Logs

---

## 🔄 Redeployment

To redeploy after changes:

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel will automatically rebuild and deploy.

To force a redeploy without changes:
- Go to Vercel Dashboard → Deployments
- Click "..." on latest deployment → Redeploy

---

## ✅ Checklist

- [ ] All environment variables added to Vercel
- [ ] Clerk domain and redirect URLs updated
- [ ] Code pushed to Git repository
- [ ] Vercel deployment successful
- [ ] Can sign in on production
- [ ] Skill Exchange page loads
- [ ] Barters are visible
- [ ] Chat and video work
- [ ] Blockchain transactions work

---

## 🆘 Need Help?

Check the logs in this order:
1. Browser console (F12)
2. Vercel function logs
3. Supabase logs
4. Clerk logs

The detailed logging we added will show exactly where the issue is!
