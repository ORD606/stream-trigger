const fetch = require('node-fetch');
const { VERCEL_API_URL, VERCEL_API_KEY } = process.env;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { station_name, stream_url, start_time, end_time, frequency } = req.body;

    if (!station_name || !stream_url || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const payload = {
      station_name,
      stream_url,
      start_time,
      end_time,
      frequency: frequency || 'once',
    };

    console.log('🔧 Forwarding payload to /record:', payload);

    const response = await fetch(`${VERCEL_API_URL}/record`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ Vercel recording triggered:', data);
      return res.status(200).json({ message: 'Recording triggered successfully', data });
    } else {
      console.error('❌ Error from /record:', data);
      return res.status(500).json({ error: 'Recording trigger failed', details: data });
    }

  } catch (error) {
    console.error('❌ Server error in trigger-github.js:', error.message);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
