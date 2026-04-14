export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Handle lead capture notifications
  if (req.body && req.body.__lead) {
    console.log('Lead captured:', req.body);
    return res.status(200).json({ success: true });
  }

  const { system, messages, max_tokens = 1024 } = req.body || {};

  // Validate required fields
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required', received: req.body });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not configured');
    return res.status(500).json({ error: 'API key not configured. Please add OPENROUTER_API_KEY to Vercel environment variables.' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://getkidshub.com',
        'X-Title': 'Aria - KidsHub Assistant',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        max_tokens: max_tokens,
        messages: [
          { role: 'system', content: system || 'You are a helpful assistant.' },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: 'API request failed',
        details: errorData 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
