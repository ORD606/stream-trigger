export default async function handler(req, res) {
  // Handle POST request to trigger GitHub Action
  if (req.method === 'POST') {
    const { station_name, stream_url, duration, timestamp } = req.body;

    // Prepare payload for GitHub Action
    const payload = {
      event_type: "record_stream",  // Name of the GitHub workflow trigger
      client_payload: {
        station_name,
        stream_url,
        duration,
        timestamp,
      },
    };

    // Send request to GitHub API to trigger the action
    try {
      const githubRes = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPO}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_PAT}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (githubRes.ok) {
        return res.status(200).json({ message: "✅ GitHub Action triggered" });
      } else {
        const error = await githubRes.text();
        return res.status(500).json({ error: "❌ Failed to trigger GitHub Action", details: error });
      }
    } catch (error) {
      return res.status(500).json({ error: "❌ Error triggering GitHub Action", details: error.message });
    }
  }

  // Handle GET request for the /ping route (to keep the app alive)
  if (req.method === 'GET') {
    return res.status(200).json({ message: 'Pong! 🏓' });  // Simple response for pinging
  }

  // Return a 405 method not allowed if other methods are requested
  return res.status(405).json({ error: 'Method Not Allowed' });
}
