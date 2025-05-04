const fetch = require('node-fetch');
const { GITHUB_REPOSITORY, GITHUB_TOKEN } = process.env;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { station_name, stream_url, start_time, end_time, frequency } = req.body;

    if (!station_name || !stream_url || !start_time || !end_time) {
      console.error('❌ Missing required fields:', req.body);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate duration in seconds
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    const duration = (endDate - startDate) / 1000;

    if (duration <= 0) {
      return res.status(400).json({ error: 'Invalid duration' });
    }

    const payload = {
      station_name,
      stream_url,
      duration,
      frequency: frequency || 'once',
    };

    console.log('📡 Triggering GitHub Actions with payload:', payload);

    // Trigger GitHub Actions
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'record_stream',
        client_payload: payload,
      }),
    });

    if (response.ok) {
      console.log('✅ GitHub Actions triggered successfully');
      return res.status(200).json({ message: 'Recording triggered successfully' });
    } else {
      const text = await response.text();
      console.error('❌ Error triggering GitHub Actions:', text);
      return res.status(500).json({ error: 'Failed to trigger GitHub workflow', details: text });
    }
  } catch (error) {
    console.error('❌ Server error in trigger-github.js:', error.message);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
