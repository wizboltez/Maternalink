# MongoDB Atlas Setup

Use this when moving from local MongoDB to **MongoDB Atlas** (cloud).

## What to provide / configure

You only need **one connection string**. Create it in Atlas, then paste it into `backend/.env` as `MONGODB_URI`.

### Step 1 — Create a free Atlas cluster

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create an account / sign in
3. **Build a Database** → choose **M0 Free** tier
4. Pick a cloud region close to your team (e.g. AWS `ap-south-1` for India)

### Step 2 — Database user

In Atlas: **Database Access → Add New Database User**

| Field | Example |
|-------|---------|
| Username | `maternalink_user` |
| Password | Strong password (save it — you cannot view it again) |
| Role | `Read and write to any database` (or scoped to `maternalink`) |

### Step 3 — Network access

In Atlas: **Network Access → Add IP Address**

| Environment | Setting |
|-------------|---------|
| Development | **Allow Access from Anywhere** (`0.0.0.0/0`) — easiest for team dev |
| Production | Add only your server/office IP ranges |

### Step 4 — Get connection string

In Atlas: **Database → Connect → Drivers → Node.js**

Copy the URI. It looks like:

```
mongodb+srv://maternalink_user:<password>@cluster0.xxxxx.mongodb.net/maternalink?retryWrites=true&w=majority
```

Replace `<password>` with your database user password (URL-encode special characters like `@`, `#`, `%`).

### Step 5 — Update backend `.env`

```env
MONGODB_URI=mongodb+srv://maternalink_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/maternalink?retryWrites=true&w=majority
JWT_SECRET=your_secure_secret_at_least_10_chars
PORT=5000
NODE_ENV=development
```

Restart the backend:

```powershell
cd backend
npm run dev
```

You should see: `✅ MongoDB connected successfully.`

---

## What you do **not** need to send anyone

- Do **not** commit `.env` to GitHub
- Do **not** share passwords in chat — each teammate can use the same Atlas cluster with the shared connection string stored locally in their own `.env`

## Optional: share with the team securely

Share only via a password manager or private team vault:

1. Atlas connection string (with password filled in), **or**
2. Cluster host + username + password separately

No other Atlas values are required by this app.
