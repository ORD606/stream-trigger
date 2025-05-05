const fetch = require('node-fetch');

// Environment variables loaded from Vercel
const { GITHUB_REPOSITORY, GITHUB_PAT } = process.env;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Log the incoming request body for debugging
    console.log('📥 Raw Payload received:', req.body);

    const { station_name, stream_url, date, start_time, end_time, duration, frequency } = req.body;

    // Validate required fields
    if (!station_name || !stream_url || !date || !start_time || !end_time) {
      console.error('❌ Missing required fields in request body:', req.body);
      return res.status(400).json({
        error: 'Missing required fields: station_name, stream_url, date, start_time, and end_time are required',
      });
    }

    // Combine date with start_time and end_time to create ISO 8601 strings
    const startDateTime = new Date(`${date} ${start_time}`);
    const endDateTime = new Date(`${date} ${end_time}`);

    // Ensure valid date conversion
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      console.error('❌ Invalid date, start_time, or end_time:', { date, start_time, end_time });
      return res.status(400).json({ error: 'Invalid date, start_time, or end_time format' });
    }

    // Convert to ISO 8601 format
    const isoStartTime = startDateTime.toISOString();
    const isoEndTime = endDateTime.toISOString();

    // Calculate duration if not provided
    let calculatedDuration = duration;
    if (!duration) {
      calculatedDuration = (new Date(isoEndTime) - new Date(isoStartTime)) / 1000; // Duration in seconds
      if (calculatedDuration <= 0) {
        console.error('❌ Invalid duration: start_time must be before end_time');
        return res.status(400).json({ error: 'Invalid duration: start_time must be before end_time' });
      }
    }

    // Construct payload for GitHub Actions
    const payload = {
      station_name,
      stream_url,
      start_time: isoStartTime,
      end_time: isoEndTime,
      duration: calculatedDuration,
      frequency: frequency || 'once', // Default to 'once' if frequency is not provided
    };

    console.log('📡 Triggering GitHub Actions with converted payload:', payload);

    // Send request to GitHub to trigger the workflow
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPOSITORY}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'record_stream', // Must match the event name in your GitHub Actions workflow
        client_payload: payload,    // Custom payload for the workflow
      }),
    });

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
