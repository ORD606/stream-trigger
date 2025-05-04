const fetch = require('node-fetch');

// Environment variables loaded from Vercel
const { GITHUB_REPOSITORY, GITHUB_PAT } = process.env;

module.exports = async (req, res) => {
  // Allow only POST requests
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

    // Calculate duration in seconds
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    const duration = (endDate - startDate) / 1000;

    if (duration <= 0) {
      console.error('❌ Invalid duration: Start time must be before end time.');
      return res.status(400).json({ error: 'Invalid duration' });
    }

    // Construct payload for GitHub Actions
    const payload = {
      station_name,
      stream_url,
      duration,
      frequency: frequency || 'once', // Default to 'once' if frequency is not provided
    };

    console.log('📡 Triggering GitHub Actions with payload:', payload);
    console.log('🛠 GITHUB_REPOSITORY:', GITHUB_REPOSITORY);

    // Send request to GitHub to trigger the workflow
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_PAT}`, // Use the GitHub PAT for authentication
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'record_stream', // Must match the event name in your GitHub Actions workflow
        client_payload: payload,    // Custom payload for the workflow
      }),
    });

    // Log the full response for debugging
    const responseText = await response.text();
    console.log(`📬 Response from GitHub API: Status ${response.status}, Body: ${responseText}`);

    if (response.ok) {
      console.log('✅ GitHub Actions triggered successfully');
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
