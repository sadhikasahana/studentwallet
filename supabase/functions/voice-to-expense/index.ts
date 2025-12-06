import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing audio data...');
    const binaryAudio = processBase64Chunks(audio);
    
    // Step 1: Transcribe audio with Whisper
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Transcribing audio...');
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.text();
      console.error('Whisper API error:', error);
      throw new Error(`Transcription failed: ${error}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcribedText = transcriptionResult.text;
    console.log('Transcribed text:', transcribedText);

    // Step 2: Extract expense data using Lovable AI
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Extracting expense data...');
    const extractionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expense data extraction assistant. Extract the amount, category, and description from the user\'s voice input. Return ONLY a JSON object with these fields: amount (number), category (one of: food, stationary, clothes, medicines, transport, entertainment, other), description (string). If information is missing, use reasonable defaults.'
          },
          {
            role: 'user',
            content: transcribedText
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_expense',
              description: 'Extract expense data from transcribed text',
              parameters: {
                type: 'object',
                properties: {
                  amount: { type: 'number', description: 'The expense amount' },
                  category: { 
                    type: 'string', 
                    enum: ['food', 'stationary', 'clothes', 'medicines', 'transport', 'entertainment', 'other'],
                    description: 'The expense category'
                  },
                  description: { type: 'string', description: 'Description of the expense' }
                },
                required: ['amount', 'category', 'description'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_expense' } }
      }),
    });

    if (!extractionResponse.ok) {
      const error = await extractionResponse.text();
      console.error('Lovable AI error:', error);
      throw new Error(`Extraction failed: ${error}`);
    }

    const extractionResult = await extractionResponse.json();
    console.log('Extraction result:', JSON.stringify(extractionResult));

    const toolCall = extractionResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No expense data extracted');
    }

    const expenseData = JSON.parse(toolCall.function.arguments);
    console.log('Extracted expense data:', expenseData);

    return new Response(
      JSON.stringify({ 
        text: transcribedText,
        expense: expenseData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in voice-to-expense:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
