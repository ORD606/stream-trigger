const fetch = require('node-fetch');

// Environment variables loaded from Vercel
const { GITHUB_REPOSITORY, GITHUB_PAT } = process.env;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('📥 Received payload from Glitch:', req.body);

    const { station_name, stream_url, start_time, end_time, frequency } = req.body;

    if (!station_name || !stream_url || !start_time || !end_time) {
      console.error('❌ Missing required fields in request body:', req.body);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const payload = {
      station_name,
      stream_url,
      start_time,
      end_time,
      duration: (new Date(end_time) - new Date(start_time)) / 1000,
      frequency: frequency || 'once',
    };

    console.log('📡 Payload being sent to GitHub Actions:', payload);

    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'record_stream',
        client_payload: payload,
      }),
    });

    const responseText = await response.text();
    console.log(`📬 Response from GitHub API: Status ${response.status}, Body: ${responseText}`);

    if (response.ok) {
      return res.status(200).json({ message: 'Recording triggered successfully' });
    } else {
      console.error('❌ Error triggering GitHub Actions:', responseText);
      return res.status(500).json({ error: 'Failed to trigger GitHub workflow', details: responseText });
    }
  } catch (error) {
    console.error('❌ Server error in trigger-github.js:', error.message);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
