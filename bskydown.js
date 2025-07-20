// script.js

async function processBlueskyVideo(postUrl, format, statusCallback, progressCallback) {
    try {
        statusCallback('Extracting post info...');
        const { handle, rkey } = extractPostInfo(postUrl);
        
        statusCallback('Resolving DID...');
        const did = await getDidFromHandle(handle);
        
        statusCallback('Fetching post details...');
        const videoInfo = await getVideoInfoFromPost(did, rkey);
        
        if (!videoInfo) {
            throw new Error('No video found in the post');
        }
        
        statusCallback('Downloading video segments...');
        const videoBlob = await downloadAndProcessVideo(videoInfo.playlist, format, progressCallback);
        
        return {
            videoBlob,
            thumbnailUrl: videoInfo.thumbnail,
            handle: videoInfo.handle,
            createdAt: videoInfo.createdAt
        };
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

function extractPostInfo(url) {
    const match = url.match(/^https:\/\/bsky\.app\/profile\/([^/]+)\/post\/([^/]+)$/);
    if (match) {
        return {
            handle: match[1],
            rkey: match[2],
        };
    }
    throw new Error('Invalid Bluesky post URL');
}

async function getDidFromHandle(handle) {
    const response = await fetch(`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`);
    if (!response.ok) {
        throw new Error(`Failed to resolve handle: ${handle}`);
    }
    const data = await response.json();
    return data.did;
}

async function getVideoInfoFromPost(did, rkey) {
    const postUri = `at://${did}/app.bsky.feed.post/${rkey}`;
    const encodedUri = encodeURIComponent(postUri);
    const response = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodedUri}&depth=0`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const threadPost = data.thread.post;
    const embed = threadPost.embed;

    const createdAt = threadPost.record?.createdAt || threadPost.indexedAt || new Date().toISOString();
    const posterHandle = threadPost.author.handle;

    if (embed && embed.$type === 'app.bsky.embed.video#view') {
        return {
            playlist: embed.playlist,
            thumbnail: embed.thumbnail,
            createdAt,
            handle: posterHandle,
        };
    }

    return null;
}

async function downloadAndProcessVideo(masterPlaylistUrl, format, progressCallback) {
    const masterPlaylistResponse = await fetch(masterPlaylistUrl);
    const masterPlaylist = await masterPlaylistResponse.text();
    
    const videoPlaylistUrl = parseHighestQualityVideoUrl(masterPlaylist, masterPlaylistUrl);
    const videoPlaylistResponse = await fetch(videoPlaylistUrl);
    const videoPlaylist = await videoPlaylistResponse.text();
    
    const segmentUrls = parseSegmentUrls(videoPlaylist, videoPlaylistUrl);
    const chunks = await downloadSegments(segmentUrls, progressCallback);
    
    const mimeType = format === 'mp4' ? 'video/mp4' : 'video/MP2T';
    return new Blob(chunks, { type: mimeType });
}

function parseHighestQualityVideoUrl(masterPlaylist, baseUrl) {
    const lines = masterPlaylist.split('\n');
    let highestBandwidth = 0;
    let highestQualityUrl = '';

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
            const bandwidthMatch = lines[i].match(/BANDWIDTH=(\d+)/);
            if (bandwidthMatch) {
                const bandwidth = parseInt(bandwidthMatch[1]);
                if (bandwidth > highestBandwidth) {
                    highestBandwidth = bandwidth;
                    highestQualityUrl = lines[i + 1];
                }
            }
        }
    }

    return new URL(highestQualityUrl, baseUrl).toString();
}

function parseSegmentUrls(videoPlaylist, baseUrl) {
    return videoPlaylist.split('\n')
        .filter(line => !line.startsWith('#') && line.trim() !== '')
        .map(segment => new URL(segment, baseUrl).toString());
}

async function downloadSegments(segmentUrls, progressCallback) {
    const chunks = [];
    const totalSegments = segmentUrls.length;

    for (let i = 0; i < totalSegments; i++) {
        const url = segmentUrls[i];
        const response = await fetch(url);
        const chunk = await response.arrayBuffer();
        chunks.push(chunk);

        progressCallback((i + 1) / totalSegments);
    }

    return chunks;
}

function sanitizeFilename(name) {
    return name.replace(/[^a-z0-9_\-]/gi, '_');
}

function formatDateForFilename(date) {
    const pad = (n) => n.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

document.getElementById('downloadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const postUrl = document.getElementById('postUrl').value;
    const format = document.getElementById('formatSelect').value;
    const statusDiv = document.getElementById('status');
    const downloadLink = document.getElementById('downloadLink');
    const progressBar = document.getElementById('progressBar');
    const progressBarInner = progressBar.querySelector('div');
    const thumbnail = document.getElementById('thumbnail');
    const thumbnailWrapper = document.getElementById('thumbnailWrapper');
    document.getElementById('downloadForm').style.display = 'none';
    statusDiv.textContent = 'Processing...';
    downloadLink.style.display = 'none';
    progressBar.style.display = 'none';
    thumbnailWrapper.style.display = 'none';
    progressBarInner.style.width = '0%';

    try {
        const result = await processBlueskyVideo(
            postUrl, 
            format,
            (status) => {
                statusDiv.textContent = status;
            },
            (progress) => {
                progressBar.style.display = 'block';
                progressBarInner.style.width = `${progress * 100}%`;
            }
        );

        const { videoBlob, thumbnailUrl, handle, createdAt } = result;

        thumbnail.src = thumbnailUrl;
        thumbnailWrapper.style.display = 'none';

        const url = URL.createObjectURL(videoBlob);

        const sanitizedHandle = sanitizeFilename(handle || 'bluesky');
        const date = new Date(createdAt || Date.now());
        const formattedDate = formatDateForFilename(date);
        const fileExtension = format === 'mp4' ? 'mp4' : 'ts';
        const filename = `${sanitizedHandle}_${formattedDate}.${fileExtension}`;

        downloadLink.href = url;
        downloadLink.download = filename;
        downloadLink.style.display = 'inline-block';
        statusDiv.textContent = 'Video ready for download!';
        
    } catch (error) {
        console.error('Error:', error);
        statusDiv.textContent = error.message || 'An error occurred. Please try again.';
        statusDiv.style.color = 'red';
    }
});
