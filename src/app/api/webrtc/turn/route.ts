
import { NextResponse } from 'next/server';
import twilio from 'twilio';

// Create a new Twilio client using environment variables
// Note: These env vars must be set in your .env file
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

export async function GET() {
    if (!accountSid || !authToken) {
        return NextResponse.json(
            { error: 'Twilio credentials not configured' },
            { status: 500 }
        );
    }

    try {
        const client = twilio(accountSid, authToken);

        // Create a new token for Network Traversal Service
        const token = await client.tokens.create();

        return NextResponse.json({
            iceServers: token.iceServers
        });
    } catch (error) {
        console.error('[TURN API] Error creating token:', error);
        return NextResponse.json(
            { error: 'Failed to generate TURN token' },
            { status: 500 }
        );
    }
}
