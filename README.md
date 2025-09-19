# Web3 Potholes managment system for municipalities

A full-stack Web3 application built with Hardhat smart contracts, modern frontend, and backend API in a monorepo structure.

## 🏗️ Architecture

```
├── contracts/          # Smart contracts (Hardhat + Solidity)
├── frontend/           # Web application (React/Next.js/Vue)
├── backend/            # API server (Express/Fastify)
├── shared/             # Shared utilities and types
├── docs/               # Project documentation
├── tsconfig.base.json  # Shared TypeScript configuration
└── README.md           # You are here
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**
- **MetaMask** or compatible Web3 wallet

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/your-web3-project.git
   cd your-web3-project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Copy example files and fill in your values
   cp contracts/.env.example contracts/.env
   cp frontend/.env.example frontend/.env  
   cp backend/.env.example backend/.env
   ```

4. **Compile smart contracts:**
   ```bash
   cd contracts
   npm run compile
   ```

## 🧪 Development

### Smart Contracts (Hardhat)

```bash
cd contracts

# Compile contracts
npm run compile

# Run tests
npm run test

# Run tests with coverage
npm run coverage

# Start local Hardhat node
npm run node

# Deploy to local network
npm run deploy:localhost

# Deploy to testnet (configure .env first)
npm run deploy:goerli
```

### Frontend Development

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

### Backend Development

```bash
cd backend

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

### Full Stack Development

```bash
# From root directory

# Build all workspaces
npm run build --workspaces

# Test all workspaces
npm run test --workspaces

# Type check entire project
npm run type-check
```

## 🌐 Deployment

### Smart Contracts

1. **Configure networks in `contracts/hardhat.config.js`**
2. **Set environment variables in `contracts/.env`:**
   ```env
   PRIVATE_KEY=your_deployer_private_key
   INFURA_PROJECT_ID=your_infura_project_id
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```
3. **Deploy to desired network:**
   ```bash
   cd contracts
   npm run deploy:mainnet    # Production
   npm run deploy:goerli     # Testnet
   ```

### Frontend

```bash
cd frontend
npm run build
# Deploy to Vercel, Netlify, or your preferred platform
```

### Backend

```bash
cd backend
npm run build
# Deploy to Railway, Render, or your preferred platform
```

## 🧰 Available Scripts

### Root Level
- `npm install` - Install all dependencies
- `npm run build --workspaces` - Build all projects
- `npm run test --workspaces` - Test all projects
- `npm run type-check` - TypeScript type checking across all workspaces

### Contracts
- `npm run compile` - Compile smart contracts
- `npm run test` - Run contract tests
- `npm run coverage` - Generate test coverage report
- `npm run deploy:localhost` - Deploy to local Hardhat network
- `npm run verify` - Verify contracts on Etherscan

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run frontend tests
- `npm run lint` - Lint code

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run API tests
- `npm run start` - Start production server

## 📁 Project Structure

### Smart Contracts (`/contracts`)
- `contracts/` - Solidity smart contracts
- `scripts/` - Deployment and utility scripts  
- `test/` - Contract tests
- `typechain-types/` - Generated TypeScript types
- `hardhat.config.js` - Hardhat configuration

### Frontend (`/frontend`)
- `src/` - React/Vue source code
- `public/` - Static assets
- `components/` - Reusable UI components
- `hooks/` - Custom React hooks for Web3 integration

### Backend (`/backend`)
- `src/` - API source code
- `routes/` - API route definitions
- `middleware/` - Express middleware
- `services/` - Business logic services

### Shared (`/shared`)
- `types/` - TypeScript type definitions
- `utils/` - Common utilities
- `constants/` - Shared constants

## 🔧 Configuration

### Environment Variables

**Contracts (`.env`)**
```env
PRIVATE_KEY=your_private_key
INFURA_PROJECT_ID=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

**Frontend (`.env.local`)**
```env
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

**Backend (`.env`)**
```env
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/database
JWT_SECRET=your_jwt_secret
```

### TypeScript Configuration

The project uses TypeScript project references for optimal development experience:
- `tsconfig.base.json` - Shared TypeScript settings
- Each workspace has its own `tsconfig.json` extending the base
- Root `tsconfig.json` orchestrates all workspaces

## 🧪 Testing

### Smart Contracts
```bash
cd contracts
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run coverage          # Generate coverage report
```

### Frontend
```bash
cd frontend
npm run test              # Run tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### Backend
```bash
cd backend
npm run test              # Run tests
npm run test:integration  # Integration tests
npm run test:e2e          # End-to-end tests
```

## 📚 Documentation

- [Smart Contracts](./contracts/README.md) - Contract documentation and deployment guides
- [Frontend](./frontend/README.md) - Frontend development and component docs
- [Backend](./backend/README.md) - API documentation and endpoints  
- [API Reference](./docs/api.md) - Complete API documentation
- [Deployment Guide](./docs/deployment.md) - Production deployment instructions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes and add tests**
4. **Ensure all tests pass:** `npm run test --workspaces`
5. **Commit your changes:** `git commit -m 'Add some amazing feature'`
6. **Push to your branch:** `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Code Standards

- **TypeScript** for type safety
- **ESLint + Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Test coverage** > 80% for new features

## 🔐 Security

### Smart Contract Security
- All contracts are tested with comprehensive test suites
- Use established patterns and OpenZeppelin libraries
- Regular security audits (see `audits/` folder)

### API Security  
- JWT authentication
- Rate limiting
- Input validation and sanitization
- CORS properly configured

## 📈 Monitoring

### Smart Contracts
- Contract events monitoring
- Gas usage tracking
- Transaction success rates

### Application
- Error tracking with Sentry
- Performance monitoring
- User analytics

## 🛠️ Troubleshooting

### Common Issues

**"Cannot find type definition file for 'node'"**
```bash
npm install --save-dev @types/node
```

**Hardhat compilation fails**
```bash
cd contracts
npx hardhat clean
npm run compile
```

**Frontend Web3 connection issues**
- Ensure MetaMask is installed and connected
- Check network configuration
- Verify contract addresses in environment variables

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Hardhat](https://hardhat.org/) for the excellent development environment
- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries
- [Ethers.js](https://docs.ethers.io/) for blockchain interactions
- The amazing Web3 community

## 📞 Support

- **Documentation:** [Project Wiki](https://github.com/yourusername/your-web3-project/wiki)
- **Issues:** [GitHub Issues](https://github.com/yourusername/your-web3-project/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/your-web3-project/discussions)
- **Discord:** [Join our community](https://discord.gg/your-discord)

---

**Happy Building! 🚀**