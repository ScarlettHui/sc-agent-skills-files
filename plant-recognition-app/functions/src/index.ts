import { onCall, HttpsError } from 'firebase-functions/v2/https';
import Anthropic from '@anthropic-ai/sdk';

const PLANT_PROMPT = `You are a botanist expert. Identify the plant in this photo and return ONLY a valid JSON object — no markdown, no extra text.

Required JSON structure:
{
  "isPlant": true,
  "confidence": "high" | "medium" | "low",
  "name": {
    "en": "Common English name",
    "zh": "中文名称"
  },
  "scientificName": "Genus species",
  "description": {
    "en": "Brief description in 2-3 sentences.",
    "zh": "2-3句中文简介。"
  },
  "characteristics": {
    "en": "Key visual features: leaves, flowers, bark, etc.",
    "zh": "主要形态特征：叶片、花朵、树皮等。"
  },
  "habitat": {
    "en": "Natural habitat and geographic distribution.",
    "zh": "自然栖息地和地理分布。"
  },
  "funFacts": {
    "en": ["Interesting fact 1", "Interesting fact 2", "Interesting fact 3"],
    "zh": ["趣味知识1", "趣味知识2", "趣味知识3"]
  }
}

If the photo does not show a plant, return:
{
  "isPlant": false,
  "confidence": "high",
  "name": { "en": "Not a plant", "zh": "非植物" },
  "scientificName": "",
  "description": { "en": "No plant detected in this image.", "zh": "图片中未检测到植物。" },
  "characteristics": { "en": "", "zh": "" },
  "habitat": { "en": "", "zh": "" },
  "funFacts": { "en": [], "zh": [] }
}`;

export const recognizePlant = onCall(
  { secrets: ['ANTHROPIC_API_KEY'] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const { imageBase64, mimeType = 'image/jpeg' } = request.data as {
      imageBase64: string;
      mimeType?: string;
    };

    if (!imageBase64) {
      throw new HttpsError('invalid-argument', 'imageBase64 is required.');
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: PLANT_PROMPT,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new HttpsError('internal', 'Unexpected response type from AI.');
    }

    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      return JSON.parse(jsonMatch[0]);
    } catch {
      throw new HttpsError('internal', 'Failed to parse plant identification data.');
    }
  },
);
