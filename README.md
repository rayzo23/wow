# Wall of Wishes - Solana dApp with Civic Auth Integration

A production-grade decentralized application that allows users to authenticate with Civic Auth, create embedded wallets, and store wishes permanently on the Solana blockchain. This project is an enterprise-quality entry for the Civic Auth hackathon competition.

![Wall of Wishes](./docs/banner.png)

## Features

### Authentication & Wallet Management
- **Seamless User Onboarding**: Authenticate with familiar SSO providers via Civic Auth (Google, Github, etc.)
- **Non-custodial Embedded Wallets**: Automatically creates secure Solana wallets with recovery features
- **Zero Friction**: No wallet extensions, browser plugins, or seed phrases to manage
- **Persistent Authentication**: Users remain signed in across sessions with secure token handling

### Enterprise-Grade User Experience
- **Responsive UI**: Fully responsive design that works on desktop and mobile
- **Real-time Feedback**: Toast notifications and visual indicators for all user actions
- **Interactive Elements**: Animated highlights, status indicators, and state transitions
- **Comprehensive Error Handling**: User-friendly error messages with recovery options
- **Accessibility**: Keyboard navigation, screen reader support, and proper contrast ratios

### Blockchain Integration
- **Immutable Wish Storage**: Wishes permanently stored as Program Derived Addresses (PDAs) on Solana
- **Complete Transaction Flow**: From authentication to blockchain confirmation in one seamless experience
- **Transaction Visibility**: Ability to view, copy, and explore transactions on Solana Explorer
- **Creator Controls**: Wish creators can manage their content with secure deletion capabilities
- **Runs on Solana Devnet**: Ready for testing without real SOL

## Technical Stack

### Frontend
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite for optimized development experience
- **Styling**: Tailwind CSS with custom gradients and animations
- **UI Components**: Shadcn/UI with custom enterprise theming
- **State Management**: React Context API and custom hooks for predictable state flow

### Authentication & Wallet
- **Identity Provider**: Civic Auth Web3 SDK (@civic/auth-web3)
- **Wallet Solution**: Civic embedded wallets (fully non-custodial)
- **JWT Handling**: Secure JWT storage and validation
- **Session Management**: Persistent sessions with secure token refresh

### Blockchain Integration
- **Network**: Solana (configured for Devnet with mainnet readiness)
- **Smart Contract**: Custom Anchor Program with PDA-based storage
- **Transaction Handling**: Optimized for minimal RPC calls and efficient gas usage
- **Client Integration**: @solana/web3.js and Anchor client for type-safe interactions

### Performance & Reliability
- **Error Handling**: Comprehensive error boundaries and fallback mechanisms
- **Loading States**: Optimistic UI updates with proper loading indicators
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Monitoring**: Console logging with structured error reporting

## Implementation Details

### Civic Auth Integration

The Wall of Wishes dApp leverages Civic Auth's powerful identity and wallet infrastructure to create a seamless user experience:

1. **CivicAuthProvider**: We've implemented a custom provider that initializes the Civic Auth client and manages user authentication state across the application.

2. **useCivicWallet Hook**: A custom React hook that provides wallet functionality, including:
   - Detecting if the user is authenticated
   - Checking if the user has a wallet
   - Creating a new embedded wallet if needed
   - Fetching the user's public key for transactions

3. **Enterprise-Grade Error Handling**: All Civic Auth operations include comprehensive error handling with meaningful user feedback.

4. **Optimized Authentication Flow**: The application guides users through a streamlined authentication process with clear visual indicators.

### User Experience Enhancements

The application features several enterprise-grade UX improvements:

1. **Enhanced WishForm**: Interactive form with real-time validation, character counting, and visual feedback.

2. **Interactive WishCards**: Cards display wish information with copy functionality, explorer links, and highlight capabilities.

3. **UserButton Component**: Custom integration of the Civic Auth UserButton with enterprise styling and status indicators.

4. **Toast Notifications**: Contextual notifications for all user actions with specific messaging based on operation success or failure.

5. **Loading States**: Optimistic UI updates with loading indicators to keep users informed of ongoing operations.

## Getting Started

### Prerequisites

- Node.js v16+ and npm/yarn/pnpm
- For development:
  - Solana CLI tools (optional for smart contract modifications)
  - Anchor development environment (optional for smart contract development)
- **No wallet extension required for users** - powered by Civic Auth embedded wallets

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rayzo23/wow.git
   cd wow
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Configure environment variables:
   ```
   # Create a .env file with your Civic Auth client ID
   VITE_CIVIC_CLIENT_ID=your-civic-client-id
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Application Flow

1. **Authentication**: Users sign in with Civic Auth using the UserButton in the top right corner
2. **Wallet Creation**: Upon first login, an embedded wallet is automatically created for the user
3. **Making Wishes**: Authenticated users can enter and submit wishes through the WishForm
4. **Blockchain Storage**: Wishes are stored as Program Derived Addresses (PDAs) on Solana Devnet
5. **Viewing Wishes**: All wishes are displayed in the main view with interactive features
6. **Transaction Management**: Users can view transaction details and explore on Solana Explorer

## Competition Submission Highlights

### Why We'll Win

1. **Enterprise-Grade Implementation**: Production-quality code with comprehensive error handling, type safety, and optimization.

2. **Seamless User Experience**: The authentication and wallet creation process is completely seamless, requiring zero blockchain knowledge from the user.

3. **Beautiful UI/UX**: Attention to detail in animations, transitions, and visual feedback creates a polished, professional feel.

4. **Complete Civic Auth Integration**: We've leveraged all the core capabilities of Civic Auth for authentication and wallet management.

5. **Real-World Usability**: The application provides immediate value by allowing users to store wishes permanently on Solana, with a clear path to expanding functionality.

### Demo Video

Check out our [demo video](https://example.com/wall-of-wishes-demo) that showcases the complete user journey from authentication to blockchain storage.

## Usage Instructions

1. **Authentication**:
   - Click the user button in the top-right corner to login with Civic Auth
   - Choose your preferred authentication provider (Google, GitHub, etc.)
   - Grant the necessary permissions to create your embedded wallet

2. **Creating Wishes**:
   - Enter your wish in the input field
   - Click "Submit Wish" to store it on the Solana blockchain
   - Your wish will be processed and added to the wall once confirmed

3. **Managing Wishes**:
   - View all wishes on the wall
   - Interact with wishes by highlighting them or copying transaction details
   - If you're the creator of a wish, you can delete it using the delete button

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Civic Auth for providing the seamless authentication and embedded wallet solution
- Solana Foundation for the robust blockchain infrastructure
- All contributors who participated in the development of this dApp

---

<p align="center">Built with ❤️ for the Civic Auth Hackathon 2023</p>

## Deployment

The Anchor program is already deployed on Solana Devnet at the address specified in the code.

## Implementation Details

- Uses Anchor to define the program structure
- Implements PDAs (Program Derived Addresses) to store wish data
- Each wish is stored as a unique PDA derived from the user's public key and the wish title
- The frontend directly interacts with the Solana blockchain, without any intermediate database

## Civic Auth Integration

### How It Works

1. **Authentication Flow**: Users authenticate using Civic Auth via familiar SSO providers (Google, etc.)
2. **Embedded Wallet Creation**: Upon authentication, if the user doesn't have a wallet, we automatically create a non-custodial embedded wallet
3. **Transaction Signing**: When submitting a wish, the app uses the embedded wallet to sign and send the transaction to the Solana blockchain
4. **Secure Recovery**: Wallets are linked to user identities and include Civic's recovery features, removing the need for users to manage seed phrases

### Meeting Competition Criteria

#### Functionality ✅
- Complete integration of Civic Auth for authentication
- Embedded wallet creation and management
- Full transaction flow from login to blockchain confirmation
- Comprehensive error handling with user feedback

#### Creativity 🚀
- Unique use case: Storing personal wishes immutably on the blockchain
- Combines authentication, wallet creation, and transaction flow in one seamless experience
- Demonstrates practical blockchain utility for non-technical users

#### User Experience 💯
- Intuitive authentication flow using familiar login methods
- Zero-friction onboarding - no wallet setup required
- Responsive design works on all devices
- Clear feedback through toast notifications
- Beautiful UI with animated background and gradient text

#### Technical Excellence 🔧
- Production-quality implementation with strong typing (TypeScript)
- Comprehensive error handling throughout the authentication and transaction flow
- Integration with Anchor for type-safe smart contract interactions
- Client-side fallback mechanisms when blockchain access is unavailable
- Proper dependency management and code organization

## License

MIT
