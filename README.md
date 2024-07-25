
# blockchainRIO - Blinks Demo

## Start your dapp

First, create a new Solana Dapp using the following command:

```sh
pnpm dlx create-solana-dapp
```
This command will set up a new Dapp project with the necessary basic configurations.

## Install the @solana/actions Dependency

Navigate to your project directory and install the `@solana/actions` package:

```sh
pnpm install @solana/actions
```
This package provides functionalities for creating and managing actions on Solana.

## Set Up Environment Variables

Create a `.env` file in the root of your project and add the following environment variables. Replace `YOUR_RPC_URL` with the actual RPC URL you want to use:

```env
RPC_URL=YOUR_RPC_URL
```
These environment variables are used to configure the connection to the Solana network.

## Create the Solana Transfer Action

Create a new file named `solanaTransfer.ts` in the `src` directory and add the following code:

```ts
import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from '@solana/actions';
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

// Function to validate query parameters
const validateQueryParams = (requestUrl: URL) => {
  const to = requestUrl.searchParams.get('to');
  const amount = requestUrl.searchParams.get('amount');

  if (!to) {
    throw new Error("Missing required query parameter 'to'");
  }

  if (amount && (isNaN(Number(amount)) || Number(amount) <= 0)) {
    throw new Error("Invalid query parameter 'amount'");
  }

  return { to, amount: amount ? parseFloat(amount) : undefined };
};

// Function to create a connection to the Solana cluster
const getConnection = () => {
  const connectionURL = process.env.RPC_URL ?? clusterApiUrl('devnet');
  return new Connection(connectionURL, 'confirmed');
};

// GET request handler
export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const { to } = validateQueryParams(requestUrl);

    const baseHref = new URL(
      `/api/actions/sol-transfer?to=${to}`,
      requestUrl.origin
    );

    const payload: ActionGetResponse = {
      title: 'Make a SOL Transfer',
      description: 'Transfer SOL securely and efficiently',
      label: 'Transfer SOL',
      icon: 'https://pbs.twimg.com/media/GRqBUajXEAAYSTw?format=jpg&name=medium',
      disabled: false,
      links: {
        actions: [
          {
            label: 'Send 1 SOL',
            href: `${baseHref}&amount=1`,
          },
          {
            label: 'Send 5 SOL',
            href: `${baseHref}&amount=5`,
          },
          {
            label: 'Send SOL',
            href: `${baseHref}&amount={amount}`,
            parameters: [
              {
                name: 'amount',
                label: 'Enter the amount',
                required: true,
              },
            ],
          },
        ],
      },
    };

    return new Response(JSON.stringify(payload), {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (error) {
    return handleErrorResponse(error);
  }
}

// OPTIONS request handler
export const OPTIONS = GET;

// POST request handler
export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const { to, amount } = validateQueryParams(requestUrl);

    if (!to || !amount) {
      throw new Error('Missing required body parameters');
    }

    const body: ActionPostRequest = await request.json();
    const account = parsePublicKey(body.account);

    const connection = getConnection();

    const transaction = new Transaction();
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: account,
        toPubkey: new PublicKey(to),
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    transaction.feePayer = account;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: `Successfully sent ${amount} SOL to ${to}`,
      },
    });

    return new Response(JSON.stringify(payload), {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (error) {
    return handleErrorResponse(error);
  }
}

// Function to parse and validate a public key
const parsePublicKey = (key: string): PublicKey => {
  try {
    return new PublicKey(key);
  } catch (error) {
    throw new Error('Invalid "account" provided');
  }
};

// Function to handle error responses
const handleErrorResponse = (error: unknown) => {
  const message =
    typeof error === 'string' ? error : 'An unknown error occurred.';
  return new Response(message, {
    status: 400,
    headers: ACTIONS_CORS_HEADERS,
  });
};
```
This code defines the necessary functions for creating and managing SOL transfers.

## Deploy Your Dapp

Finally, deploy your Dapp using your preferred deployment method. Make sure to set the environment variable `RPC_URL` in your deployment settings.

Your Dapp is now ready to securely and efficiently transfer SOL tokens using the Solana blockchain!

---

By following these steps, you will have a fully functional Dapp that utilizes Solana actions to transfer SOL tokens. If you encounter any issues or need further assistance, feel free to reach out to the community or check the official Solana documentation.
