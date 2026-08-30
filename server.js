const express = require('express');
const path = require('path');
const fs = require('fs');
const net = require('net');

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, 'public');
const PAYLOADS_DIR = path.join(PUBLIC_DIR, 'payloads');

// Créer le dossier payloads dans public s'il n'existe pas
if (!fs.existsSync(PAYLOADS_DIR)) {
  fs.mkdirSync(PAYLOADS_DIR, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// API: Liste des payloads
app.get('/api/payloads', (req, res) => {
  try {
    const files = fs.readdirSync(PAYLOADS_DIR)
      .filter(file => file.endsWith('.bin'))
      .map(file => {
        const filePath = path.join(PAYLOADS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime
        };
      });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la lecture des payloads' });
  }
});

// Endpoint /success comme les vrais exploit hosts
app.get('/success', (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  console.log(`Exploit réussi depuis ${clientIp}`);
  
  // Réponse vide comme les vrais exploit hosts
  res.status(200).send('OK');
});

// Endpoint /success/PORT/TIMEOUT/payload.bin
app.get('/success/:port/:timeout/:payload', (req, res) => {
  const port = parseInt(req.params.port);
  const timeout = parseInt(req.params.timeout);
  const payloadName = req.params.payload;
  const clientIp = req.ip || req.connection.remoteAddress;
  
  console.log(`Exploit réussi, envoi payload ${payloadName} à ${clientIp}:${port}`);
  
  const payloadPath = path.join(PAYLOADS_DIR, payloadName);
  
  if (!fs.existsSync(payloadPath)) {
    console.log(`Payload ${payloadName} non trouvé`);
    return res.status(404).send('Payload non trouvé');
  }
  
  // Lire le payload
  const payloadData = fs.readFileSync(payloadPath);
  
  // Envoyer via socket TCP au BinLoader GoldHEN
  sendPayloadViaSocket(clientIp, port, payloadData, timeout)
    .then(() => {
      console.log(`Payload ${payloadName} envoyé avec succès`);
      res.status(200).send('OK');
    })
    .catch((error) => {
      console.error(`Erreur envoi payload: ${error}`);
      res.status(500).send('Erreur envoi payload');
    });
});

// Fonction pour envoyer payload via socket TCP
function sendPayloadViaSocket(ip, port, data, timeout) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    
    client.setTimeout(timeout * 1000);
    
    client.connect(port, ip, () => {
      console.log(`Connecté à ${ip}:${port}, envoi de ${data.length} octets`);
      client.write(data);
      client.end();
    });
    
    client.on('data', (data) => {
      console.log('Réponse du BinLoader:', data.toString());
    });
    
    client.on('close', () => {
      console.log('Connexion fermée');
      resolve();
    });
    
    client.on('error', (error) => {
      console.error('Erreur socket:', error);
      reject(error);
    });
    
    client.on('timeout', () => {
      console.error('Timeout socket');
      client.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Servir les fichiers payload avec headers PS4 exploitation
app.get('/payloads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(PAYLOADS_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier non trouvé' });
  }
  
  // Headers spécifiques pour PS4 exploitation (comme les vrais sites)
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'inline'); // Pas attachment
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  res.sendFile(filePath);
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Répertoire des payloads: ${PAYLOADS_DIR}`);
  console.log(`Prêt à recevoir des requêtes /success pour envoi BinLoader`);
});
