import 'dotenv/config';
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: process.env.NVIDIA_API_KEY || '',
});

const models = [
  'meta/llama-3.3-70b-instruct',
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'google/gemma-2-27b-it',
];

for (const model of models) {
  try {
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timed out (40s)')), 40000));
    const req = client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful grocery assistant. Reply with STRICT JSON only.' },
        { role: 'user', content: 'List 5 ingredients to cook Chicken Curry for 10 people as JSON: {"ingredients":[{"name":string,"quantity":number,"unit":string}]}' },
      ],
      temperature: 0.2,
      max_tokens: 300,
    });
    const res: any = await Promise.race([req, timeout]);
    const content = res.choices[0]?.message?.content || '';
    console.log(`MODEL "${model}" => OK (${content.length} chars)`);
    console.log(content.slice(0, 300));
    console.log('---');
  } catch (e: any) {
    console.log(`MODEL "${model}" => FAIL: ${e.message || e}`);
    console.log('---');
  }
}
