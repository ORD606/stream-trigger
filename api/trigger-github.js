const fetch = require('node-fetch');
const { GITHUB_REPOSITORY, GITHUB_TOKEN } = process.env;

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
      console.error('❌ Missing required fields:', req.body);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate duration in seconds
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    const duration = (endDate - startDate) / 1000;

    if (duration <= 0) {
      console.error('❌ Invalid duration: Start time must be before end time.');
      return res.status(400).json({ error: 'Invalid duration' });
    }

    // Construct the payload
    const payload = {
      station_name,
      stream_url,
      duration,
      frequency: frequency || 'once', // Default to 'once' if frequency is not provided
    };

    console.log('📡 Triggering GitHub Actions with payload:', payload);

    // Trigger GitHub Actions via repository_dispatch
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

    // Handle the response from GitHub API
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
