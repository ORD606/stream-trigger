export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { station_name, stream_url, start_time, end_time, frequency } = req.body;

    if (!station_name || !stream_url || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const duration = (new Date(end_time) - new Date(start_time)) / 1000;

    const payload = {
      station_name,
      stream_url,
      duration,
      timestamp: new Date(start_time).toISOString(),
      frequency,
    };

    console.log("🔁 Forwarding payload to GitHub Actions:", payload);

    // Simulate success for now
    return res.status(200).json({ message: 'Recording scheduled', payload });
  } catch (err) {
    console.error("❌ Error in trigger-github:", err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
