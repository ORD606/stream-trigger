const fetch = require('node-fetch');
const { VERCEL_API_URL, VERCEL_API_KEY } = process.env;

module.exports = async (req, res) => {
  // Check HTTP method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Extract request body
    const { station_name, stream_url, start_time, end_time, frequency } = req.body;

    // Validate required fields
    if (!station_name || !stream_url || !start_time || !end_time) {
      console.error('❌ Missing required fields in request body:', req.body);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate the stream_url
    if (!stream_url.startsWith('http://') && !stream_url.startsWith('https://')) {
      console.error(`❌ Invalid stream_url: ${stream_url}. It must be an absolute URL.`);
      return res.status(400).json({ error: 'Stream URL must be an absolute URL' });
    }

    // Construct the payload for forwarding
    const payload = {
      station_name,
      stream_url,
      start_time,
      end_time,
      frequency: frequency || 'once', // Default to 'once' if frequency is not provided
    };

    console.log('🔧 Forwarding payload to /record:', payload);

    // Send the payload to the Vercel /record API
    const response = await fetch(`${VERCEL_API_URL}/record`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload), // Ensure payload is properly stringified
    });

    // Log the full response for debugging
    const text = await response.text();
    console.log(`📬 Response from /record: Status ${response.status}, Body: ${text}`);

    if (response.ok) {
      const data = JSON.parse(text); // Parse the JSON response
      console.log('✅ Vercel recording triggered successfully:', data);
      return res.status(200).json({ message: 'Recording triggered successfully', data });
    } else {
      console.error('❌ Error from /record:', text);
      return res.status(500).json({ error: 'Recording trigger failed', details: text });
    }
  } catch (error) {
    console.error('❌ Server error in trigger-github.js:', error.message);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
