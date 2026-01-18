// Videos Service

/**
 * Get all videos
 */
async function getAllVideos() {
    try {
        const { data, error } = await supabaseClient
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching videos:', error);
        showError('حدث خطأ أثناء تحميل الفيديوهات');
        return [];
    }
}

/**
 * Get videos by category
 */
async function getVideosByCategory(category) {
    try {
        const { data, error } = await supabaseClient
            .from('videos')
            .select('*')
            .eq('category', category)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching videos by category:', error);
        return [];
    }
}

/**
 * Get single video by ID
 */
async function getVideoById(videoId) {
    try {
        const { data, error } = await supabaseClient
            .from('videos')
            .select('*')
            .eq('id', videoId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching video:', error);
        return null;
    }
}

/**
 * Get video URL from storage
 */
function getVideoUrl(videoPath) {
    const { data } = supabaseClient
        .storage
        .from('videos')
        .getPublicUrl(videoPath);
    
    return data.publicUrl;
}

/**
 * Render video cards
 */
function renderVideoCards(videos, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (videos.length === 0) {
        container.innerHTML = '<p class="no-data">لا توجد فيديوهات متاحة حاليًا</p>';
        return;
    }

    container.innerHTML = videos.map(video => `
        <div class="video-card" onclick="window.location.href='video-player.html?id=${video.id}'">
            <div class="video-thumbnail">
                ${video.thumbnail_url 
                    ? `<img src="${video.thumbnail_url}" alt="${video.title}">`
                    : '<div class="thumbnail-placeholder"><i class="icon">🎥</i></div>'
                }
                ${video.duration ? `<span class="video-duration">${formatDuration(video.duration)}</span>` : ''}
            </div>
            <div class="video-info">
                <h3>${video.title}</h3>
                <p>${video.description || ''}</p>
                <div class="video-meta">
                    <span class="category-badge category-${video.category}">${getCategoryName(video.category)}</span>
                    <span class="video-date">${formatDate(video.created_at)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Get category name in Arabic
 */
function getCategoryName(category) {
    const categories = {
        'lecture': 'محاضرة',
        'review': 'مراجعة',
        'application': 'تطبيق'
    };
    return categories[category] || category;
}

/**
 * Filter videos by category
 */
function filterVideosByCategory(videos, category) {
    if (category === 'all') return videos;
    return videos.filter(video => video.category === category);
}
