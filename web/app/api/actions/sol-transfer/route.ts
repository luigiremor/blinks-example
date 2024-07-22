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
