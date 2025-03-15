# Custom Linktree Generator

A full-stack web application for creating personalized link pages with advanced customization options, built with Next.js, TypeScript, and MongoDB.

## Features

- User authentication with Google and GitHub
- Create and manage multiple Linktrees
- Customizable themes and styles
- Link management with drag-and-drop functionality
- Analytics tracking
- Premium features for subscribed users

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** MongoDB with Mongoose
- **Authentication:** NextAuth.js
- **Deployment:** Vercel (recommended)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/linktree-app.git
   cd linktree-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local`
   - Fill in your MongoDB connection string
   - Add your OAuth credentials for Google and GitHub
   - Generate a NextAuth secret with: `openssl rand -base64 32`

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Setting up OAuth Providers

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to Credentials > Create Credentials > OAuth Client ID
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy the Client ID and Secret to your `.env.local`

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Add homepage URL: `http://localhost:3000`
4. Add callback URL: `http://localhost:3000/api/auth/callback/github`
5. Copy the Client ID and Secret to your `.env.local`

## Project Structure

```
├── app/
│   ├── (auth)/
│   │   └── signin/
│   ├── api/
│   │   └── auth/
│   ├── dashboard/
│   ├── components/
│   ├── lib/
│   ├── models/
│   └── types/
├── public/
└── ...
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
