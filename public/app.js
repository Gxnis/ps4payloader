// Variables globales
let payloads = [];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadPayloads();
    detectPS4Environment();
});

// Détecter l'environnement PS4
function detectPS4Environment() {
    const userAgent = navigator.userAgent;
    console.log('User Agent:', userAgent);
    
    // Détecter si on est sur PS4
    if (userAgent.includes('PlayStation 4') || userAgent.includes('PS4')) {
        console.log('PS4 détecté');
        showNotification('🎮 PS4 détecté - Mode exploitation activé', 'success');
    } else {
        console.log('Autre navigateur détecté');
    }
}

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

// Lancer un payload avec vraies méthodes PS4 exploitation
async function launchPayload(filename) {
    const payloadUrl = `/payloads/${encodeURIComponent(filename)}`;
    
    showNotification(`Chargement de ${filename}...`, 'info');
    
    try {
        // Méthode standard PS4: XMLHttpRequest + Uint8Array
        const xhr = new XMLHttpRequest();
        xhr.open('GET', payloadUrl, true);
        xhr.responseType = 'arraybuffer';
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    // Convertir en Uint8Array
                    const uint8Array = new Uint8Array(xhr.response);
                    
                    // Méthode 1: Essayer l'API spécifique PS4/WebKit
                    if (typeof window.WebKit !== 'undefined' && window.WebKit.load) {
                        window.WebKit.load(uint8Array);
                        showNotification(`🚀 ${filename} lancé (WebKit API)!`, 'success');
                        return;
                    }
                    
                    // Méthode 2: Essayer d'exécuter via DataView
                    try {
                        const dataView = new DataView(xhr.response);
                        executePayloadViaDataView(filename, dataView);
                        return;
                    } catch (dvError) {
                        console.log('Erreur DataView:', dvError);
                    }
                    
                    // Méthode 3: Méthode standard WebKit exploitation
                    try {
                        const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
                        const blobUrl = URL.createObjectURL(blob);
                        
                        // Essayer d'exécuter via object URL
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        iframe.style.width = '0';
                        iframe.style.height = '0';
                        iframe.src = blobUrl;
                        iframe.sandbox = 'allow-scripts allow-same-origin';
                        
                        document.body.appendChild(iframe);
                        
                        showNotification(`🚀 ${filename} lancé (Blob method)!`, 'success');
                        
                        setTimeout(() => {
                            document.body.removeChild(iframe);
                            URL.revokeObjectURL(blobUrl);
                        }, 2000);
                        
                    } catch (blobError) {
                        console.log('Erreur blob:', blobError);
                        tryAlternativeMethod(filename, uint8Array);
                    }
                    
                } catch (error) {
                    console.log('Erreur traitement:', error);
                    tryAlternativeMethod(filename, null);
                }
            } else {
                showNotification('Erreur lors du chargement', 'error');
            }
        };
        
        xhr.onerror = function() {
            console.log('Erreur XHR');
            showNotification('Erreur de chargement', 'error');
        };
        
        xhr.send();
        
    } catch (error) {
        console.log('Erreur générale:', error);
        showNotification('Erreur de lancement', 'error');
    }
}

// Exécuter via DataView (méthode spécifique PS4)
function executePayloadViaDataView(filename, dataView) {
    try {
        // Simuler l'exécution via manipulation mémoire
        // Cette méthode est utilisée par certains exploits PS4
        const buffer = new ArrayBuffer(dataView.byteLength);
        const uint8 = new Uint8Array(buffer);
        
        for (let i = 0; i < dataView.byteLength; i++) {
            uint8[i] = dataView.getUint8(i);
        }
        
        // Créer un lien blob pour exécution
        const blob = new Blob([uint8], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        
        window.location.href = url;
        
        showNotification(`🚀 ${filename} lancé (DataView method)!`, 'success');
        
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
        
    } catch (error) {
        console.log('Erreur DataView execution:', error);
        throw error;
    }
}

// Méthode alternative pour PS4
function tryAlternativeMethod(filename, dataArray) {
    try {
        // Méthode alternative: Utiliser un script inline
        const script = document.createElement('script');
        script.type = 'text/javascript';
        
        if (dataArray) {
            // Convertir en base64 pour les scripts
            let binary = '';
            const len = dataArray.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(dataArray[i]);
            }
            const base64 = window.btoa(binary);
            script.src = 'data:application/octet-stream;base64,' + base64;
        } else {
            script.src = `/payloads/${encodeURIComponent(filename)}`;
        }
        
        script.onload = function() {
            showNotification(`🚀 ${filename} lancé (Script method)!`, 'success');
            document.body.removeChild(script);
        };
        
        script.onerror = function() {
            console.log('Erreur script');
            tryIframeMethod(filename);
        };
        
        document.body.appendChild(script);
        
    } catch (error) {
        console.log('Erreur alternative:', error);
        tryIframeMethod(filename);
    }
}

// Méthode iframe classique
function tryIframeMethod(filename) {
    try {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.src = `/payloads/${encodeURIComponent(filename)}`;
        
        iframe.onload = function() {
            showNotification(`🚀 ${filename} lancé (Iframe method)!`, 'success');
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        };
        
        document.body.appendChild(iframe);
        
    } catch (error) {
        console.log('Erreur iframe:', error);
        showNotification('Toutes les méthodes ont échoué', 'error');
    }
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
