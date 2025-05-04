const fetch = require('node-fetch');

// Trigger GitHub Action via repository_dispatch
const triggerGitHubAction = async (stationName, streamUrl, duration) => {
    const token = 'your_github_token';  // GitHub Personal Access Token or OAuth token
    const repoOwner = 'your_github_username_or_org';
    const repoName = 'your_repository_name';

    const body = {
        event_type: 'record_stream',  // Custom event type to trigger the workflow
        client_payload: {
            station_name: stationName,
            stream_url: streamUrl,
            duration: duration
        }
    };

    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`, {
        method: 'POST',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(body)
    });

    if (response.ok) {
        console.log('Successfully triggered GitHub Action!');
    } else {
        console.error('Failed to trigger GitHub Action:', response.statusText);
    }
};
