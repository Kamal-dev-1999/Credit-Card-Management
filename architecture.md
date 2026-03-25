# Credit Card Manager - Architecture Overview

Here is a comprehensive breakdown of everything we have built so far across the frontend UI, component architecture, and backend database schema.

---

## 🎨 1. Frontend Structure (React + Tailwind + Framer Motion)

The frontend is built with a strictly enforced, premium **"Lana"** design language (purple/yellow/red palette, rounded-3xl corners, and floating shadows).

### 🧩 Core Layout
- **[App.jsx](file:///d:/Downloads/Card-Management/frontend/src/App.jsx)**: The main orchestrator. Handles state management for notifications, active cards, and acts as the simple router between the Dashboard, Manage Cards, and AI Insights pages.
- **[Sidebar.jsx](file:///d:/Downloads/Card-Management/frontend/src/components/Sidebar.jsx)**: The main navigation menu.
- **[Header.jsx](file:///d:/Downloads/Card-Management/frontend/src/components/Header.jsx)**: Contains the search bar, user profile, and triggers the [NotificationCenter](file:///d:/Downloads/Card-Management/frontend/src/components/NotificationCenter.jsx#5-111).
- **[GlobalChatbot.jsx](file:///d:/Downloads/Card-Management/frontend/src/components/GlobalChatbot.jsx)**: A globally persistent, floating AI finance assistant ("Lana Copilot") accessible from the bottom right corner of any page.

### 📊 Dashboard Widgets
- **[CardStack.jsx](file:///d:/Downloads/Card-Management/frontend/src/components/CardStack.jsx)**: Displays a beautifully animated stack of the user's credit cards.
- **[DueSummaryCard.jsx](file:///d:/Downloads/Card-Management/frontend/src/components/DueSummaryCard.jsx)**: Highlights the total upcoming dues across all cards in INR (`₹`), heavily styled.
- **[DueDatesGraph.jsx](file:///d:/Downloads/Card-Management/frontend/src/components/DueDatesGraph.jsx)**: An interactive `recharts`-powered area chart visualizing cyclic spending against upcoming due date spikes.
- **[CreditHealthCard.jsx](file:///d:/Downloads/Card-Management/frontend/src/components/CreditHealthCard.jsx)**: An animated radial gauge tracking credit utilization against recommended healthy limits.
- **[RecentBillsTable.jsx](file:///d:/Downloads/Card-Management/frontend/src/components/RecentBillsTable.jsx)**: A detailed table tracking recent payments and overdue bills, featuring in-line interactive "Pay" buttons.
- **[AITipCard.jsx](file:///d:/Downloads/Card-Management/frontend/src/components/AITipCard.jsx)**: A floating high-contrast tip widget offering immediate contextual AI suggestions.
- **[NotificationCenter.jsx](file:///d:/Downloads/Card-Management/frontend/src/components/NotificationCenter.jsx)**: A sophisticated popup (Popover on Desktop, Slide-up sheet on Mobile) managing alerts and successful payment receipts.

### 💳 Manage Cards Page
- **[ManageCards.jsx](file:///d:/Downloads/Card-Management/frontend/src/components/ManageCards.jsx)**: The dedicated configuration page displaying a grid of the user's active cards.
- **[ManageCardItem.jsx](file:///d:/Downloads/Card-Management/frontend/src/components/ManageCardItem.jsx)**: A rich card component with quick actions to Edit, Delete, or toggle Auto-Sync.
- **[AddCardModal.jsx](file:///d:/Downloads/Card-Management/frontend/src/components/AddCardModal.jsx)**: A complex, step-by-step interactive form to link a new bank card.

### 🧠 AI Insights Hub
- **[AIInsights.jsx](file:///d:/Downloads/Card-Management/frontend/src/components/AIInsights.jsx)**: A specialized page translating raw balances into proactive wealth strategies via Daily Pulse banners and Health Grading widgets.
- **[CardInsightTile.jsx](file:///d:/Downloads/Card-Management/frontend/src/components/CardInsightTile.jsx)**: Granular widgets plotting utilization alongside 3 actionable, LLM-generated recommendations per card.

---

## 🗄️ 2. Backend & Database Structure (Node.js + Prisma)

The backend is primed for Express.js API logic and PostgreSQL integration using Prisma ORM. 

### Database Schema Models
The schema ([d:/Downloads/Card-Management/backend/prisma/schema.prisma](file:///d:/Downloads/Card-Management/backend/prisma/schema.prisma)) defines 4 core entities:

**1. `User`**
- Represents the authenticated account owner.
- Holds `email`, unique `whatsappNumber` for notifications, and establishes 1-to-many relations with their registered Cards and Expenses.

**2. [Card](file:///d:/Downloads/Card-Management/frontend/src/components/AITipCard.jsx#5-37)**
- Corresponds to the physical credit cards (e.g., Purple Zota).
- Holds critical linking data: `userId`, `bankName`, `cardName`, `last4Digits`, and `billingCycleDate`.
- One-to-many relationship with [Bill](file:///d:/Downloads/Card-Management/frontend/src/components/RecentBillsTable.jsx#11-147).

**3. [Bill](file:///d:/Downloads/Card-Management/frontend/src/components/RecentBillsTable.jsx#11-147)**
- Represents the monthly statement lifecycle per card.
- Columns: `cardId`, `amountDue`, `dueDate`, `statementDate`, and payment `status` ("Unpaid" | "Paid").
- This is the table that will be populated by the automated Email Parsing engine!

**4. `Expense`**
- A granular log for individual transactions (useful for future budget tracking).
- Columns: `userId`, `category`, `amount`, and `date`.

### API Foundation
- **[server.js](file:///d:/Downloads/Card-Management/backend/server.js)**: The Express server initialization script. Currently configured to hold routes, load [.env](file:///d:/Downloads/Card-Management/backend/.env) variables (like your `DATABASE_URL` and `OPENAI_API_KEY`), and establish CORS for the React frontend to communicate with.
