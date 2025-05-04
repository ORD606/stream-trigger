const fetch = require('node-fetch');
const { GITHUB_API_URL, GITHUB_PAT, VERCEL_API_URL, VERCEL_API_KEY } = process.env;

async function triggerVercelRecording(stationName, streamUrl, startTime, endTime, frequency) {
    try {
        const payload = {
            station_name: stationName,
            stream_url: streamUrl,
            start_time: startTime,
            end_time: endTime,
            frequency: frequency
        };

        console.log('🔧 Triggering Vercel recording with payload:', payload);

        const response = await fetch(`${VERCEL_API_URL}/record`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${VERCEL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (response.ok) {
            console.log(`✅ Vercel recording scheduled successfully: ${JSON.stringify(data)}`);
        } else {
            console.error(`❌ Error from Vercel: ${data.error}`);
        }
    } catch (error) {
        console.error(`⚠️ Error triggering Vercel recording: ${error.message}`);
    }
}

triggerVercelRecording('BBC Radio 6Music', 'https://stream.example.com', '2025-05-03 10:13 PM', '2025-05-03 10:15 PM', 'once');
