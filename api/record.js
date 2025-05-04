import stations from "../../stations.js"; // Import station data

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { station_name, stream_url, date, start_time, end_time, frequency } = req.body;

      // Validate required fields
      if (!station_name || !date || !start_time || !end_time) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Match station name using fuzzy matching
      const matchedStation = Object.keys(stations).reduce((best, current) => {
        const similarity = stringSimilarity.compareTwoStrings(station_name.toLowerCase(), current.toLowerCase());
        return similarity > best.similarity ? { name: current, url: stations[current], similarity } : best;
      }, { name: null, url: null, similarity: 0 });

      if (!matchedStation.name) {
        return res.status(404).json({ error: "No matching station found" });
      }

      // Use matched URL if stream_url is not provided
      const stationUrl = stream_url || matchedStation.url;

      // Calculate duration
      const startDateTime = new Date(`${date}T${start_time}`);
      const endDateTime = new Date(`${date}T${end_time}`);
      const duration = (endDateTime - startDateTime) / 1000;

      // Prepare payload for trigger-github.js
      const payload = {
        station_name: matchedStation.name,
        stream_url: stationUrl,
        duration,
        timestamp: startDateTime.toISOString(),
        frequency,
      };

      // Forward data to trigger-github.js
      const triggerResponse = await fetch(`${process.env.VERCEL_API_URL}/api/trigger-github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (triggerResponse.ok) {
        return res.status(200).json({ message: "Recording scheduled successfully" });
      } else {
        const error = await triggerResponse.text();
        return res.status(500).json({ error: "Failed to schedule recording", details: error });
      }
    } catch (error) {
      console.error("Error scheduling recording:", error);
      return res.status(500).json({ error: "Internal server error", details: error.message });
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}
