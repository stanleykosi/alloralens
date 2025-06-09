# AlloraLens

A full-stack web application that sources 5-minute and 8-hour Bitcoin price predictions from the Allora network. The application displays these predictions and serves as a hub for analyzing Allora's prediction accuracy against historical Bitcoin prices from the CoinGecko API.


 <!-- TODO: Add a real screenshot once deployed -->

---

## About The Project

AlloraLens is designed to provide transparency and insights into the performance of the Allora Network. It showcases the network's decentralized AI capabilities by:

*   **Fetching Live Predictions:** Periodically ingests 5-minute and 8-hour Bitcoin price predictions via the Allora SDK.
*   **Calculating Accuracy:** Compares predictions against real-world historical market data from the CoinGecko API.
*   **Visualizing Data:** Displays the latest predictions, accuracy KPIs (24h, 7d, 30d), and historical accuracy trends in a clean, modern dashboard.
*   **Providing Insights:** Offers deeper "informetrics" about the network's performance, such as the contribution of individual workers (future feature).

This project targets crypto traders, AI enthusiasts, and anyone curious about the reliability and intelligence of decentralized AI prediction networks.

---

## Built With

*   **Framework**: [Next.js](https://nextjs.org/) (App Router)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
*   **Database**: [Supabase](https://supabase.io/) (PostgreSQL)
*   **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
*   **Prediction Data**: [Allora Network SDK](https://docs.allora.network/)
*   **Historical Price Data**: [CoinGecko API](https://www.coingecko.com/en/api)
*   **Charting**: [Nivo](https://nivo.rocks/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Deployment**: [Vercel](https://vercel.com/)

---

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm, yarn, or pnpm
*   A Supabase account for the database.
*   An Allora Network API key.
*   A CoinGecko API key (optional but recommended for better rate limits).

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/stanleykosi-alloralens.git
    cd stanleykosi-alloralens
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    *   Create a `.env.local` file in the root of the project by copying the example file:
        ```sh
        cp .env.example .env.local
        ```
    *   Fill in the required values in `.env.local`:
        *   `SUPABASE_URL` & `SUPABASE_ANON_KEY`: Found in your Supabase project settings under `Project Settings > API`.
        *   `SUPABASE_DB_URL`: The database connection string. Found in `Project Settings > Database > Connection string`. **Remember to replace `[YOUR-PASSWORD]` with your actual database password.**
        *   `ALLORA_API_KEY`: Your API key for the Allora Network.
        *   `ALLORA_CHAIN_SLUG`: The Allora network to connect to (e.g., `testnet` or `mainnet`).
        *   `COINGECKO_API_KEY`: Your API key from CoinGecko.
        *   `CRON_SECRET`: A secure, randomly generated string to protect your cron job endpoints. You can generate one using `openssl rand -base64 32`.

4.  **Set up the database schema:**
    *   Drizzle Kit is configured to manage the database schema. Run the following command to push the schema defined in `src/db/schema/` to your Supabase database. This will create the `predictions` table and the associated enum type.
    ```sh
    npm run db:migrate
    ```
    *   You can verify the schema in the Supabase Table Editor.

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## Usage

The application is designed to be largely automated once set up.

### Cron Jobs

The core data ingestion and processing logic is handled by two API routes designed to be run as cron jobs:

*   **`/api/cron/update-predictions`**: Fetches the latest predictions from Allora and stores them in the database. Recommended schedule: every 5 minutes.
*   **`/api/cron/update-accuracy`**: Finds mature predictions, fetches the actual price from CoinGecko, calculates accuracy, and updates the database. Recommended schedule: every 5 minutes.

On Vercel, these can be configured in the `vercel.json` file or through the project dashboard. For local development, you can trigger them manually using `curl` or a browser:

```sh
# Make sure to include the CRON_SECRET if it's implemented in the route
curl -X POST http://localhost:3000/api/cron/update-predictions
curl -X POST http://localhost:3000/api/cron/update-accuracy