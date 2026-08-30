const express = require('express');
const path = require('path');
const fs = require('fs');

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
});
