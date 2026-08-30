# PS4 Payload Loader

Interface web pour lancer des payloads PS4 (.bin) vers votre PlayStation 4 via GoldHen.

## 🎮 Fonctionnalités

- ✅ Liste des payloads disponibles avec informations (taille, date)
- ✅ Envoi de payloads vers votre PS4 via IP
- ✅ Compatible GoldHen 2.4.18b - Firmware 9.50
- ✅ Interface moderne et responsive
- ✅ Aucune installation nécessaire - les payloads sont sur le site

## 🚀 Déploiement sur Render

### Commandes Render

**Build:**
```bash
npm install
```

**Start:**
```bash
node server.js
```

### Étapes de déploiement

1. **Créer un repository Git:**
```bash
git init
git add .
git commit -m "PS4 Payload Loader - Site statique avec payloads"
```

2. **Push vers GitHub/GitLab:**
   - Créez un nouveau repository sur GitHub ou GitLab
   - Suivez les instructions pour push votre code

3. **Déployer sur Render:**
   - Allez sur [render.com](https://render.com)
   - Créez un compte ou connectez-vous
   - Cliquez sur "New +" → "Web Service"
   - Connectez votre repository GitHub/GitLab
   - Render détectera automatiquement la configuration (grâce à `render.yaml`)
   - Cliquez sur "Create Web Service"

4. **Utiliser:**
   - Une fois déployé, Render vous donnera une URL (ex: `https://votre-app.onrender.com`)
   - Ouvrez le site dans n'importe quel navigateur (PC, mobile, ou PS4)
   - Configurez l'adresse IP de votre PS4
   - Sélectionnez un payload et cliquez sur "Lancer"
   - Le payload sera envoyé à votre PS4 via GoldHen

## 📁 Structure du projet

```
payload-loader/
├── server.js          # Serveur Node.js/Express
├── package.json       # Dépendances du projet
├── render.yaml        # Configuration Render
├── .gitignore         # Fichiers à ignorer
└── public/
    ├── index.html     # Interface utilisateur
    ├── style.css      # Styles
    ├── app.js         # Logique JavaScript
    └── payloads/      # Dossier des payloads .bin (GTAMenu.bin, PS4API.bin, etc.)
```

## 🔧 Ajouter des payloads

Pour ajouter de nouveaux payloads :

1. Placez vos fichiers `.bin` dans le dossier `public/payloads/`
2. Committez et push les changements
3. Render redéployera automatiquement avec les nouveaux payloads

## ⚠️ Notes importantes

- Les payloads doivent être au format .bin
- Le site peut être utilisé depuis n'importe quel navigateur
- Pour le déploiement, utilisez "Web Service" sur Render (pas Static Site)
- Assurez-vous que votre PS4 et le serveur sont sur le même réseau
- Les payloads sont inclus dans le site - pas besoin de les installer localement
- **Nécessite GoldHen 2.4.18b installé sur votre PS4 (FW 9.50)**
- Le port 9020 doit être ouvert sur votre PS4 pour GoldHen

## 🛠️ Technologies

- Node.js
- Express.js
- HTML5/CSS3/JavaScript
