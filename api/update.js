// api/update.js
export default async function handler(req, res) {
    // Только POST запросы
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Проверяем секретный ключ
    const secretKey = req.headers['x-admin-key'];
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { products } = req.body;

    if (!products) {
        return res.status(400).json({ error: 'No products data' });
    }

    try {
        // Обновляем products.json через GitHub API
        const githubToken = process.env.GITHUB_TOKEN;
        const repoOwner = 'sdrvsavva-coder';
        const repoName = 'oun-art';
        const filePath = 'products.json';
        
        // Получаем текущий файл (чтобы получить SHA)
        const getFileUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
        const getFileResponse = await fetch(getFileUrl, {
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        let sha = null;
        if (getFileResponse.ok) {
            const fileData = await getFileResponse.json();
            sha = fileData.sha;
        }
        
        // Обновляем файл
        const updateUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
        const content = Buffer.from(JSON.stringify(products, null, 2)).toString('base64');
        
        const updateResponse = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: 'Update products via admin panel',
                content: content,
                sha: sha
            })
        });
        
        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(errorData.message || 'Failed to update file');
        }
        
        res.status(200).json({ success: true, message: 'Products updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
}
