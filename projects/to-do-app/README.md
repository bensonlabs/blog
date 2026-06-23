# Neon Todo App

A full-stack todo application built with Node.js, Express, and [Neon](https://neon.tech) Postgres. Demonstrates how to connect a browser-based app to a cloud-hosted database with real-time data persistence.

---

## Features

* **Create** — Add new todos with a single click or press Enter
* **Complete** — Toggle items done/undone with animated checkboxes
* **Delete** — Remove individual todos or clear all completed at once
* **Filter** — View All, Active only, or Completed only
* **Live Stats** — See active, done, and total counts in real-time
* **Responsive** — Works on desktop and mobile screens

---

## Screenshots

*(Add screenshot images here if desired)*

---

## Tech Stack

* **Frontend:** Vanilla HTML, CSS, JavaScript
* **Backend:** Node.js + Express
* **Database:** Neon Postgres (serverless)
* **Deployment:** [Render](https://render.com) (web service)
* **Repo:** [bensonlabs/database-demo](https://github.com/bensonlabs/database-demo)

---

## Try It

**[Live Demo](https://todo-app-l3m0.onrender.com)**

No signup required — just open the link and start adding tasks. All data persists in the cloud database.

---

## Running Locally

1. Clone the repo and navigate to the project folder:

```bash
git clone https://github.com/bensonlabs/database-demo.git
cd database-demo
```

2. Install dependencies:

```bash
npm install
```

3. Set your `DATABASE_URL` environment variable (from Neon dashboard or `.env.local`), then start:

```bash
node server.js
```

4. Open `http://localhost:3000` in your browser.

---

## How It Works

1. The Express server serves the static HTML/CSS/JS frontend
2. Browser calls REST API endpoints (`/api/todos`) for all operations
3. The `@neondatabase/serverless` driver connects to Neon Postgres over HTTPS
4. SQL queries manage the `todos` table — create, read, update, delete
5. Neon handles the database infrastructure; no server management needed
