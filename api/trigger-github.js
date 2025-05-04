const fetch = require('node-fetch');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { station_name, stream_url, duration, timestamp, frequency } = req.body;

  if (!station_name || !stream_url || !duration) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const githubToken = process.env.GITHUB_TOKEN; // Set this in Vercel Environment Variables
    const repoOwner = "your_github_username_or_org";
    const repoName = "your_repository_name";

    const payload = {
      event_type: "record_stream",
      client_payload: {
        station_name,
        stream_url,
        duration,
        timestamp,
        frequency
      }
    };

    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      return res.status(200).json({ message: "🎬 GitHub workflow triggered" });
    } else {
      const text = await response.text();
      return res.status(500).json({ error: "GitHub API error", details: text });
    }

  } catch (err) {
    console.error("Error triggering GitHub:", err);
    return res.status(500).json({ error: "Internal error", details: err.message });
  }
}
