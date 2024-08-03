
import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { ChatCompletionCreateParams } from 'openai/resources/index.mjs';

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure you have your API key in environment variables
});

export async function POST(req: NextRequest) {
  try {
    const { pantry_items } = await req.json();

    if (!pantry_items || !Array.isArray(pantry_items) || pantry_items.length === 0) {
      throw new Error("pantry_items is required and should be a non-empty array");
    }

    const formattedPantryItems = pantry_items.map(item => `${item.type},${item.quantity}`).join('; ');

    const payload: ChatCompletionCreateParams = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Here is a list of pantry items and their quantities: ${formattedPantryItems}. Please generate a simple and tasty recipe that can be made using some of these ingredients. The recipe doesn't need to include all the items from the pantry.
`
        }
      ],
      max_tokens: 150
    };

    const response = await openai.chat.completions.create(payload);

    if (!response || !response.choices || response.choices.length === 0) {
      throw new Error("No response from OpenAI");
    }

    const result = response.choices[0].message.content;
    return NextResponse.json({ recipes: result });

  } catch (error: any) {
    console.error("Error in POST /api/generate-recipes:", error);
    if (error.response) {
      // Handling specific OpenAI errors
      return NextResponse.json({ error: error.response.data.error.message }, { status: error.response.status });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}

export async function PUT(req: NextRequest) {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}

