# Stakeados Platform

A Web3 educational platform combining blockchain education with NFT certifications on Base network.

## 🚀 Features

- **Educational Content**: Comprehensive courses on blockchain and cryptocurrency
- **NFT Certificates**: Verifiable certificates minted on Base network
- **Multi-language Support**: Available in English and Spanish
- **Genesis Community**: Special benefits for early adopters
- **AI-Powered News**: Curated crypto news with AI processing
- **Gamification**: Points system and citizenship NFTs

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom Stakeados design system
- **Web3**: Wagmi v2, Viem, Coinbase Smart Wallet
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Blockchain**: Base Network, OpenZeppelin Contracts
- **i18n**: next-intl
- **Email**: Resend
- **AI**: OpenAI API
- **Analytics**: Google Analytics, Highlight
- **Hosting**: Netlify

## 🏗 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── loading.tsx        # Loading UI
│   ├── error.tsx          # Error UI
│   └── not-found.tsx      # 404 page
├── components/            # Reusable components
├── lib/                   # Utility functions
│   ├── constants.ts       # App constants
│   └── env.ts            # Environment validation
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
├── utils/                 # Helper functions
└── styles/               # Additional styles
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd stakeados-platform
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Fill in your environment variables in `.env.local`

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## 🎨 Design System

The platform uses a gaming/futuristic design with:

- **Primary Color**: Neon Green (#00FF88)
- **Dark Theme**: Gaming-inspired dark palette
- **Typography**: Inter font family
- **Effects**: Glow effects and micro-interactions
- **Responsive**: Mobile-first approach

## 🌐 Internationalization

The platform supports multiple languages:

- **English**: `/en/` routes
- **Spanish**: `/es/` routes (e.g., `/es/cursos` for courses)

## 🔧 Environment Variables

Key environment variables (see `.env.example` for complete list):

```env
# Application
NEXT_PUBLIC_APP_NAME=Stakeados
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Web3
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_BASE_CHAIN_ID=8453

# AI & Services
OPENAI_API_KEY=your_openai_key
RESEND_API_KEY=your_resend_key
```

## 🧪 Code Quality

The project includes:

- **ESLint**: Code linting with Next.js and TypeScript rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit and pre-push checks
- **TypeScript**: Strict type checking
- **Lint-staged**: Run linters on staged files

## 📚 Documentation

- [Requirements Document](./docs/requirements.md)
- [Design Document](./docs/design.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

For support, email support@stakeados.com or join our Discord community.

---

Built with ❤️ by the Stakeados Team
