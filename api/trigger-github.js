export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { station_name, stream_url, duration, timestamp } = req.body;

      if (!station_name || !stream_url || !duration || !timestamp) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Prepare payload for GitHub Action
      const payload = {
        event_type: "record_stream", // Name of the GitHub workflow trigger
        client_payload: {
          station_name,
          stream_url,
          duration,
          timestamp,
        },
      };

      // Trigger GitHub Action
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
      console.error("Error triggering GitHub Action:", error);
      return res.status(500).json({ error: "❌ Internal server error", details: error.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}
