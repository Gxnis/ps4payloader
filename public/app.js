// Variables globales
let payloads = [];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadPayloads();
});

// Vérifier la compatibilité GoldHen
function checkGoldHenCompatibility() {
    const statusElement = document.getElementById('goldHenStatus');
    
    if (typeof GoldHen !== 'undefined') {
        const version = GoldHen.version || 'version inconnue';
        console.log('GoldHen détecté:', version);
        statusElement.textContent = `✅ GoldHen ${version} détecté - Notifications PS4 activées`;
        statusElement.style.color = '#00ff88';
        statusElement.style.borderColor = '#00ff88';
        statusElement.style.background = 'rgba(0, 255, 136, 0.1)';
        sendPs4Notification('🎮 PS4 Payload Loader chargé');
    } else {
        console.log('GoldHen non détecté, utilisation du mode fallback');
        statusElement.textContent = '⚠️ GoldHen non détecté - Mode fallback activé';
        statusElement.style.color = '#ffaa00';
        statusElement.style.borderColor = '#ffaa00';
        statusElement.style.background = 'rgba(255, 170, 0, 0.1)';
    }
}

// Envoyer une notification PS4 via GoldHen
function sendPs4Notification(message) {
    try {
        if (typeof GoldHen !== 'undefined' && GoldHen.sendNotification) {
            GoldHen.sendNotification(message);
            return true;
        } else if (typeof GoldHen !== 'undefined' && GoldHen.showNotification) {
            // Alternative pour certaines versions de GoldHen
            GoldHen.showNotification(message);
            return true;
        } else {
            // Fallback: notification du site
            showNotification(message, 'info');
            return false;
        }
    } catch (error) {
        console.log('Erreur notification GoldHen:', error);
        showNotification(message, 'info');
        return false;
    }
}

// Charger la liste des payloads
async function loadPayloads() {
    try {
        const response = await fetch('/api/payloads');
        payloads = await response.json();
        displayPayloads();
        checkGoldHenCompatibility();
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

// Lancer un payload directement sur PS4 avec GoldHen 2.4.18b FW 9.50
async function launchPayload(filename) {
    try {
        sendPs4Notification(`🚀 Lancement de ${filename}...`);
        
        const payloadUrl = `/payloads/${encodeURIComponent(filename)}`;
        
        // Méthode spécifique pour GoldHen 2.4.18b FW 9.50
        if (typeof GoldHen !== 'undefined') {
            // Essayer différentes méthodes selon la version de GoldHen
            try {
                // Méthode 1: loadPayload (GoldHen 2.4.x)
                if (GoldHen.loadPayload) {
                    await GoldHen.loadPayload(payloadUrl);
                    sendPs4Notification(`✅ ${filename} lancé avec succès!`);
                    return;
                }
                
                // Méthode 2: exec (GoldHen plus ancien)
                if (GoldHen.exec) {
                    await GoldHen.exec(payloadUrl);
                    sendPs4Notification(`✅ ${filename} lancé avec succès!`);
                    return;
                }
                
                // Méthode 3: run (alternative)
                if (GoldHen.run) {
                    await GoldHen.run(payloadUrl);
                    sendPs4Notification(`✅ ${filename} lancé avec succès!`);
                    return;
                }
                
                console.log('Méthodes GoldHen non disponibles, fallback vers iframe');
            } catch (goldhenError) {
                console.log('Erreur API GoldHen:', goldhenError);
            }
        }
        
        // Fallback: Utiliser XMLHttpRequest pour GoldHen 2.4.18b FW 9.50
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', payloadUrl, true);
            xhr.responseType = 'arraybuffer';
            
            xhr.onload = function() {
                if (xhr.status === 200) {
                    // Pour GoldHen 2.4.18b, essayer d'exécuter le buffer
                    if (typeof GoldHen !== 'undefined' && GoldHen.executeBuffer) {
                        try {
                            GoldHen.executeBuffer(xhr.response);
                            sendPs4Notification(`✅ ${filename} lancé avec succès!`);
                        } catch (execError) {
                            console.log('Erreur executeBuffer:', execError);
                            // Fallback iframe
                            loadPayloadViaIframe(payloadUrl, filename);
                        }
                    } else {
                        // Fallback iframe
                        loadPayloadViaIframe(payloadUrl, filename);
                    }
                } else {
                    sendPs4Notification(`❌ Erreur chargement payload`);
                }
            };
            
            xhr.onerror = function() {
                console.log('Erreur XHR, fallback iframe');
                loadPayloadViaIframe(payloadUrl, filename);
            };
            
            xhr.send();
            
        } catch (xhrError) {
            console.log('Erreur XHR:', xhrError);
            loadPayloadViaIframe(payloadUrl, filename);
        }
        
    } catch (error) {
        console.log('Erreur générale:', error);
        sendPs4Notification(`❌ Erreur: ${error.message}`);
    }
}

// Fallback: Charger payload via iframe
function loadPayloadViaIframe(url, filename) {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    
    iframe.onload = () => {
        sendPs4Notification(`✅ ${filename} lancé!`);
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    };
    
    iframe.onerror = () => {
        sendPs4Notification(`❌ Erreur lors du lancement`);
        document.body.removeChild(iframe);
    };
    
    document.body.appendChild(iframe);
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
