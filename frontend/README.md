# 🚀 The-AI-Engineer-Challenge Frontend

Welcome to the frontend! This is a Next.js + Tailwind CSS app with a chat UI that talks to your AI backend.

## 🛠️ Local Development

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```
2. **Set up environment variables:**
   - Create a `.env.local` file in the `frontend` directory.
   - Add this line (replace the URL if your backend runs elsewhere):
     ```env
     NEXT_PUBLIC_API_URL=http://localhost:3000/api
     ```
3. **Run the dev server:**
   ```bash
   npm run dev
   ```
4. **Open your browser:**
   - Visit [http://localhost:3000](http://localhost:3000) to chat with your AI!

## 🚀 Deploying to Vercel

- This app is ready for Vercel! Just set the `NEXT_PUBLIC_API_URL` environment variable in your Vercel dashboard to point to your backend API.
- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)

## 💡 Features
- Chat interface: User messages on the right, AI on the left.
- Responsive, modern, and dark-mode friendly.
- All AI calls go through your backend proxy—never directly to OpenAI.

---

Have fun building! If you break it, you get to keep both pieces. 😄
