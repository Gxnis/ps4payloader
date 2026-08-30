// Variables globales
let payloads = [];
let ps4Ip = localStorage.getItem('ps4Ip') || '';

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadPayloads();
    document.getElementById('ps4Ip').value = ps4Ip;
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

// Lancer un payload sur PS4 via le serveur
async function launchPayload(filename) {
    if (!ps4Ip) {
        showNotification('Veuillez configurer l\'adresse IP de votre PS4', 'error');
        return;
    }
    
    try {
        showNotification(`Envoi de ${filename} vers ${ps4Ip}...`, 'info');
        
        const response = await fetch('/api/payloads/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: filename,
                ps4Ip: ps4Ip
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`✅ ${filename} envoyé avec succès!`, 'success');
        } else {
            throw new Error(result.error || 'Erreur lors de l\'envoi');
        }
        
    } catch (error) {
        console.log('Erreur:', error);
        showNotification(`❌ Erreur: ${error.message}`, 'error');
        
        // Fallback: essayer via iframe
        showNotification('Tentative méthode alternative...', 'info');
        loadPayloadViaIframe(filename);
    }
}

// Fallback: Charger payload via iframe
function loadPayloadViaIframe(filename) {
    const payloadUrl = `/payloads/${encodeURIComponent(filename)}`;
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = payloadUrl;
    
    iframe.onload = () => {
        showNotification(`✅ ${filename} chargé`, 'success');
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    };
    
    iframe.onerror = () => {
        showNotification('❌ Erreur lors du chargement', 'error');
        document.body.removeChild(iframe);
    };
    
    document.body.appendChild(iframe);
}

// Sauvegarder la configuration PS4
function savePs4Config() {
    const ip = document.getElementById('ps4Ip').value.trim();
    
    if (!ip) {
        showNotification('Veuillez entrer une adresse IP valide', 'error');
        return;
    }
    
    // Validation basique de l'IP
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(ip)) {
        showNotification('Format d\'adresse IP invalide', 'error');
        return;
    }
    
    ps4Ip = ip;
    localStorage.setItem('ps4Ip', ip);
    showNotification('Configuration sauvegardée!', 'success');
}

// Afficher une notification (site web + PS4 via GoldHen)
function showNotification(message, type = 'info') {
    // Notification du site web
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
    
    // Notification PS4 via GoldHen si disponible
    if (type === 'success') {
        sendPs4Notification(`✅ ${message}`);
    } else if (type === 'error') {
        sendPs4Notification(`❌ ${message}`);
    } else {
        sendPs4Notification(message);
    }
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
