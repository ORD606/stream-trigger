export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { station_name, stream_url, start_time, end_time, frequency } = req.body;

    if (!station_name || !stream_url || !start_time || !end_time) {
      console.error('❌ Missing required fields:', req.body);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate duration in seconds
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    const duration = (endDate - startDate) / 1000;

    if (duration <= 0) {
      return res.status(400).json({ error: 'Invalid duration' });
    }

    console.log('✅ Payload validated successfully:', {
      station_name,
      stream_url,
      duration,
      frequency: frequency || 'once',
    });

    // Preprocessing can be added here if needed

    return res.status(200).json({ message: 'Payload processed successfully' });
  } catch (error) {
    console.error('❌ Server error in record.js:', error.message);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
