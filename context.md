# Custom Linktree Generator App Prompt

Create a full-stack web application for a custom Linktree generator that allows users to create personalized link pages, similar to Linktree but with additional customization options and features.

## Core Features

1. **User Authentication & Management**
   - Email/password registration and login
   - OAuth integration (Google, GitHub, Twitter)
   - Password reset functionality
   - User profile management
   - Role-based access (free users vs premium users)

2. **Linktree Creation & Management**
   - Create multiple Linktrees under one account
   - Custom URL slugs (username.domain.com or domain.com/username)
   - Add, edit, delete, and reorder links with drag-and-drop functionality
   - Custom link titles, URLs, and icons (from icon libraries)
   - Toggle links active/inactive without deleting them
   - Schedule links to appear/disappear at specific dates/times

3. **Customization Options**
   - Multiple theme options (light, dark, colorful)
   - Custom color schemes for buttons, text, and backgrounds
   - Upload and crop profile pictures
   - Custom background images or gradients
   - Button style customization (rounded, square, outlined, filled)
   - Custom fonts selection
   - Custom CSS for advanced users

4. **Analytics Dashboard**
   - Link click tracking and statistics
   - Visitor counts and geographic data
   - Traffic sources tracking
   - Heatmaps of user interaction
   - Data export functionality (CSV, PDF)
   - Historical data comparison

5. **Sharing Features**
   - One-click copy link
   - QR code generation for each Linktree
   - Direct social media sharing buttons
   - Embed code for websites

6. **Premium Tier Features**
   - Custom domain linking
   - Advanced analytics
   - Removal of branding
   - Priority support
   - A/B testing for links
   - More themes and customization options

## Technical Stack & Architecture

**Frontend:**
- **Next.js** - React framework with server-side rendering for better SEO and performance
- **TypeScript** - For type safety and better developer experience
- **Tailwind CSS** - For utility-first styling that's highly customizable
- **React Context API** - For state management
- **Next.js API Routes** - For backend functionality
- **React DnD** - For drag-and-drop functionality

**Backend/Database:**
- **MongoDB Atlas** - Cloud database for storing user profiles, links, and analytics
- **NextAuth.js** - Authentication handling with multiple providers
- **Mongoose** - MongoDB object modeling for Node.js
- **Redis** - For caching and rate limiting

**Deployment:**
- **Vercel** - For seamless deployment of Next.js applications
- **MongoDB Atlas** - Cloud database service
- **AWS S3** - For storing user-uploaded images
- **Cloudflare** - For CDN and additional security

## Application Flow

1. **User Registration & Authentication:**
   - User signs up via email/password or OAuth providers
   - NextAuth.js handles session management and authentication
   - User is redirected to onboarding process

2. **Dashboard Experience:**
   - After login, users land on their personal dashboard
   - Users can create a new Linktree or edit existing ones
   - Interface for adding/editing links with drag-and-drop reordering

3. **Link Management:**
   - Add new links with title, URL, and optional icon
   - Reorder links with drag-and-drop functionality
   - Toggle links to active/inactive without deleting
   - Schedule links to appear/disappear at specific times

4. **Customization Options:**
   - Theme selection (light/dark/custom)
   - Color picker for buttons, text, and background
   - Upload profile picture and background image
   - Custom fonts and button styles

5. **Preview & Publish:**
   - Live preview of Linktree while editing
   - One-click publish functionality
   - Generate shareable URL (username.yourdomain.com or yourdomain.com/username)

6. **Analytics:**
   - Track link clicks
   - View visitor statistics (daily/weekly/monthly)
   - Geographic data of visitors (basic in free tier, detailed in premium)

7. **Sharing:**
   - Copy link button
   - Generate QR code for easy sharing
   - Direct social media share buttons

8. **Premium Features:**
   - Custom domain linking
   - Advanced analytics
   - Removal of branding
   - Priority support

## Implementation Considerations

1. **Database Schema**
   - User collection (authentication, profile info)
   - Linktree collection (theme, settings, owner reference)
   - Links collection (title, URL, icon, order, active status)
   - Analytics collection (click events, visitor data)

2. **API Routes**
   - Authentication endpoints
   - Linktree CRUD operations
   - Link management operations
   - Analytics data retrieval
   - User profile management

3. **Performance Optimization**
   - Server-side rendering for Linktree pages
   - Static generation where possible
   - Image optimization for profile pictures and backgrounds
   - Caching strategies for frequently accessed data

4. **Security Measures**
   - Input validation and sanitization
   - Rate limiting for API routes
   - CSRF protection
   - Content Security Policy implementation
   - Regular security audits

5. **Accessibility**
   - WCAG 2.1 compliance
   - Keyboard navigation support
   - Screen reader compatibility
   - Sufficient color contrast

6. **Future Expansion**
   - Mobile app development
   - API for third-party integrations
   - More advanced analytics
   - Social features (following other users, etc.)

## Deliverables

1. Complete source code with documentation
2. Database schema and migration scripts
3. Deployment instructions
4. User guide for both regular and admin users
5. API documentation
6. Maintenance and update procedures

Please include detailed documentation for deployment, future maintenance, and scaling considerations. The application should be designed with scalability in mind to accommodate growth in user base and traffic.