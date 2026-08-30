const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');

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

// Servir les fichiers payload directement pour chargement sur PS4
app.get('/payloads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(PAYLOADS_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier non trouvé' });
  }
  
  res.download(filePath);
});

// API: Envoyer payload directement à la PS4 via GoldHen
app.post('/api/payloads/send', express.json(), async (req, res) => {
  const { filename, ps4Ip } = req.body;
  
  if (!filename || !ps4Ip) {
    return res.status(400).json({ error: 'Nom du fichier et IP PS4 requis' });
  }
  
  const filePath = path.join(PAYLOADS_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier non trouvé' });
  }
  
  try {
    // Lire le fichier payload
    const payloadData = fs.readFileSync(filePath);
    
    // Envoyer à la PS4 via GoldHen web API (port 9020)
    const goldHenUrl = `http://${ps4Ip}:9020/api/load`;
    
    const options = {
      hostname: ps4Ip,
      port: 9020,
      path: '/api/load',
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': payloadData.length
      }
    };
    
    const goldHenReq = http.request(options, (goldHenRes) => {
      let data = '';
      
      goldHenRes.on('data', (chunk) => {
        data += chunk;
      });
      
      goldHenRes.on('end', () => {
        if (goldHenRes.statusCode === 200) {
          res.json({ success: true, message: `Payload ${filename} envoyé à ${ps4Ip}` });
        } else {
          res.status(500).json({ error: `Erreur GoldHen: ${goldHenRes.statusCode}` });
        }
      });
    });
    
    goldHenReq.on('error', (error) => {
      console.error('Erreur envoi à GoldHen:', error);
      res.status(500).json({ error: 'Impossible de contacter la PS4. Vérifiez l\'IP et que GoldHen est actif.' });
    });
    
    goldHenReq.write(payloadData);
    goldHenReq.end();
    
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du payload' });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Répertoire des payloads: ${PAYLOADS_DIR}`);
});
