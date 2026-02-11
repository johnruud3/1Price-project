import OpenAI from 'openai';

interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeReceipt(imageBuffer: Buffer): Promise<ReceiptItem[]> {
  try {
    console.log('Analyzing receipt with OpenAI Vision...');
    
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `Du er en ekspert på å analysere norske kvitteringer. 
          Ekstraher produktinformasjon fra kvitteringen og returner som JSON.
          
          Returner KUN et JSON-array med følgende format:
          [
            {"name": "produktnavn", "price": 99.90, "quantity": 1},
            {"name": "annet produkt", "price": 45.50, "quantity": 2}
          ]
          
          Viktige regler:
          - Ignorer totalbeløp, MVA, rabatter
          - Fokuser kun på faktiske produkter
          - Bruk norske produktnavn
          - Priser skal være i NOK
          - Quantity er valgfritt, standard er 1
          - Returner KUN JSON-array, ingen annen tekst`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyser denne norske kvitteringen og ekstraher produkter med priser:"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    try {
      const items = JSON.parse(content);
      return validateReceiptItems(items);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response');
    }
    
  } catch (error) {
    console.error('OpenAI Vision error:', error);
    throw new Error('Failed to analyze receipt with AI');
  }
}

export async function analyzeReceiptFromText(receiptText: string): Promise<ReceiptItem[]> {
  try {
    console.log('Analyzing receipt text with OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Du er en ekspert på å analysere norske kvitteringer. 
          Ekstraher produktinformasjon fra kvitteringsteksten og returner som JSON.
          
          Returner KUN et JSON-array med følgende format:
          [
            {"name": "produktnavn", "price": 99.90, "quantity": 1},
            {"name": "annet produkt", "price": 45.50, "quantity": 2}
          ]
          
          Viktige regler:
          - Ignorer totalbeløp, MVA, rabatter
          - Fokuser kun på faktiske produkter
          - Bruk norske produktnavn
          - Priser skal være i NOK
          - Quantity er valgfritt, standard er 1
          - Returner KUN JSON-array, ingen annen tekst`
        },
        {
          role: "user",
          content: `Analyser denne norske kvitteringsteksten og ekstraher produkter med priser:\n\n${receiptText}`
        }
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    try {
      const items = JSON.parse(content);
      return validateReceiptItems(items);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response');
    }
    
  } catch (error) {
    console.error('OpenAI text analysis error:', error);
    throw new Error('Failed to analyze receipt text with AI');
  }
}

function validateReceiptItems(items: any[]): ReceiptItem[] {
  if (!Array.isArray(items)) {
    throw new Error('Invalid response format');
  }

  return items.filter(item => {
    return (
      item &&
      typeof item.name === 'string' &&
      item.name.trim().length > 0 &&
      typeof item.price === 'number' &&
      item.price > 0 &&
      (!item.quantity || typeof item.quantity === 'number')
    );
  }).map(item => ({
    name: item.name.trim(),
    price: Number(item.price.toFixed(2)),
    quantity: item.quantity || 1,
  }));
}
