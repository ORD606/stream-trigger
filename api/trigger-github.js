export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { station_name, stream_url, duration, timestamp } = req.body;

  const payload = {
    event_type: "record_stream",  // Name of GitHub workflow trigger
    client_payload: {
      station_name,
      stream_url,
      duration,
      timestamp,
    },
  };

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
}
