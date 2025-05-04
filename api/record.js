export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { station_name, stream_url, start_time, end_time, frequency } = req.body;

      if (!station_name || !stream_url || !start_time || !end_time) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Calculate duration in seconds
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);
      const duration = (endDate - startDate) / 1000;

      if (duration <= 0) {
        return res.status(400).json({ error: "Invalid duration" });
      }

      const payload = {
        station_name,
        stream_url,
        duration,
        timestamp: startDate.toISOString(),
        frequency: frequency || "once"
      };

      console.log("📡 Forwarding payload to trigger-github:", payload);

      const response = await fetch(`${process.env.VERCEL_API_URL}/api/trigger-github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json({ message: "✅ Recording triggered", data });
      } else {
        const text = await response.text();
        return res.status(500).json({ error: "Failed to trigger GitHub workflow", details: text });
      }
    } catch (err) {
      console.error("❌ Error:", err);
      return res.status(500).json({ error: "Internal server error", details: err.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}
