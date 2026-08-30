// Variables globales
let payloads = [];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadPayloads();
});

// Charger la liste des payloads
async function loadPayloads() {
    try {
        const response = await fetch('/api/payloads');
        payloads = await response.json();
        displayPayloads();
    } catch (error) {
        showNotification('Erreur lors du chargement des payloads', 'error');
    }
}

// Afficher les payloads
function displayPayloads() {
    const container = document.getElementById('payloadsList');
    
    if (payloads.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #a0a0a0; padding: 20px;">Aucun payload disponible</p>';
        return;
    }
    
    container.innerHTML = payloads.map(payload => `
        <div class="payload-card">
            <h3>${escapeHtml(payload.name)}</h3>
            <div class="payload-info">
                <span>Taille: ${formatSize(payload.size)}</span>
                <span>Modifié: ${formatDate(payload.modified)}</span>
            </div>
            <div class="payload-actions">
                <button class="btn btn-launch" onclick="launchPayload('${escapeHtml(payload.name)}')">
                    🚀 Lancer
                </button>
            </div>
        </div>
    `).join('');
}

// Lancer un payload (méthode standard PS4)
function launchPayload(filename) {
    // Méthode standard: lien direct vers le fichier .bin
    // Le navigateur PS4 télécharge et exécute automatiquement
    const payloadUrl = `/payloads/${encodeURIComponent(filename)}`;
    
    // Créer un lien invisible et cliquer dessus
    const link = document.createElement('a');
    link.href = payloadUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`🚀 ${filename} lancé!`, 'success');
}

// Afficher une notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Formater la taille en Ko/Mo
function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Formater la date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Échapper les caractères HTML pour éviter les injections XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
