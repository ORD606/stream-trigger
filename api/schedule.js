// api/schedule.js (Vercel Endpoint Example)

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { station_name, stream_url, start_time, end_time, frequency } = req.body;

      // Log incoming data for debugging
      console.log('Received schedule request:', req.body);

      // Here, you could trigger the actual recording process or store the data

      // Respond with a success message
      res.status(200).json({ message: 'Recording scheduled successfully' });
    } catch (error) {
      console.error('Error scheduling recording:', error);
      res.status(500).json({ error: 'Failed to schedule recording' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
