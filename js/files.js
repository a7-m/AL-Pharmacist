// Files Service

/**
 * Get all files
 */
async function getAllFiles() {
    try {
        const { data, error } = await supabaseClient
            .from('files')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching files:', error);
        showError('حدث خطأ أثناء تحميل الملفات');
        return [];
    }
}

/**
 * Get file download URL
 */
function getFileDownloadUrl(filePath) {
    const { data } = supabaseClient
        .storage
        .from('files')
        .getPublicUrl(filePath);
    
    return data.publicUrl;
}

/**
 * Download file
 */
function downloadFile(fileUrl, fileName) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Get file icon based on type
 */
function getFileIcon(fileType) {
    const icons = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'ppt': '📊',
        'pptx': '📊',
        'xls': '📈',
        'xlsx': '📈',
        'image': '🖼️',
        'video': '🎥',
        'zip': '📦',
        'rar': '📦'
    };
    
    return icons[fileType] || '📎';
}

/**
 * Render file cards
 */
function renderFileCards(files, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (files.length === 0) {
        container.innerHTML = '<p class="no-data">لا توجد ملفات متاحة حاليًا</p>';
        return;
    }

    container.innerHTML = files.map(file => {
        const fileUrl = getFileDownloadUrl(file.file_url);
        return `
            <div class="file-card">
                <div class="file-icon">
                    ${getFileIcon(file.file_type)}
                </div>
                <div class="file-info">
                    <h3>${file.title}</h3>
                    <p>${file.description || ''}</p>
                    <div class="file-meta">
                        <span class="file-type">${file.file_type.toUpperCase()}</span>
                        <span class="file-size">${formatFileSize(file.file_size || 0)}</span>
                        <span class="file-date">${formatDate(file.created_at)}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-primary btn-sm" onclick="downloadFile('${fileUrl}', '${file.title}')">
                        تحميل
                    </button>
                </div>
            </div>
        `;
    }).join('');
}
