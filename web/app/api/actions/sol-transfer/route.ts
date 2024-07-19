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

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);

    const { to } = validateQueryParams(requestUrl);

    const baseHref = new URL(
      `/api/actions/sol-transfer?to=${to}`,
      requestUrl.origin
    );

    const payload: ActionGetResponse = {
      title: 'Make a donation',
      description: 'Blinks are the future',
      label: 'Make a donation',
      icon: 'https://pbs.twimg.com/media/GRqBUajXEAAYSTw?format=jpg&name=medium',
      disabled: false,
      links: {
        actions: [
          {
            label: 'Send 1 SOL',
            href: `${baseHref}&amount=1`,
          },
          {
            label: 'Send 2 SOL',
            href: `${baseHref}&amount=5`,
          },
          {
            label: 'Send',
            href: `${baseHref}&amount=amount`,
            parameters: [
              {
                name: 'amount',
                label: 'Enter the amount of SOL you want to send',
                required: true,
              },
            ],
          },
        ],
      },
    };

    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (error) {
    let message = 'An unknown error occured.';
    if (typeof error == 'string') message = error;
    return new Response(message, {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }
}

export const OPTIONS = GET;

export async function POST(request: Request) {
  let account: PublicKey;

  try {
    const requestUrl = new URL(request.url);
    const { to, amount } = validateQueryParams(requestUrl);

    const body: ActionPostRequest = await request.json();

    try {
      account = new PublicKey(body.account);
    } catch (error) {
      return new Response('Invalid "account" provided', {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      });
    }

    const connectionURL = process.env.RPC_URL ?? clusterApiUrl('devnet');

    const connection = new Connection(connectionURL);

    const transaction = new Transaction();

    const feeAmount = amount * 0.01;
    const correctedAmount = amount - feeAmount;

    const instructions = transaction.instructions;

    instructions.push(
      SystemProgram.transfer({
        fromPubkey: account,
        toPubkey: new PublicKey(to),
        lamports: correctedAmount * LAMPORTS_PER_SOL,
      }),
      SystemProgram.transfer({
        fromPubkey: account,
        toPubkey: new PublicKey(DEFAULT_BLINKMEACOFFEE_ACCOUNT),
        lamports: feeAmount * LAMPORTS_PER_SOL,
      })
    );

    transaction.feePayer = account;
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: `Successfully sent ${amount} coffees to ${to}`,
      },
    });

    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (error) {
    let message = 'An unknown error occured.';
    if (typeof error == 'string') message = error;
    return new Response(message, {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }
}

const validateQueryParams = (requestUrl: URL) => {
  const to = requestUrl.searchParams.get('to');
  const amount = requestUrl.searchParams.get('amount');

  if (!to) {
    throw new Error("Missing required query parameter 'to'");
  }

  if (amount && isNaN(Number(amount)) && Number(amount) < 1) {
    throw new Error("Invalid query parameter 'amount'");
  }

  return { to, amount: Number(amount) };
};

const DEFAULT_BLINKMEACOFFEE_ACCOUNT =
  'TFd8fQFzrVPHsegBbLF2UPB7wHiXreEtY5uZdTuGtZW';
