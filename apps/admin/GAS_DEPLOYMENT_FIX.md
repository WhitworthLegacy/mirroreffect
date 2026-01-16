# 🔧 Fix : Erreur HTML au lieu de JSON

## ❌ Problème identifié

Le GAS retourne une page HTML avec une redirection au lieu d'une réponse JSON. Cela se produit quand le GAS n'est pas correctement configuré pour accepter les requêtes POST depuis des domaines externes.

## ✅ Solution : Reconfigurer le déploiement du GAS

### Étapes à suivre

1. **Ouvrez votre projet Google Apps Script**
   - Allez sur https://script.google.com
   - Ouvrez votre projet MirrorEffect

2. **Vérifiez votre fonction `doPost`**
   - Assurez-vous qu'elle est présente et qu'elle appelle `handleAdminActions_`
   - Vérifiez qu'elle retourne bien `_json(...)` avec une structure `{ data: ... }` ou `{ error: ... }`

3. **Redéployez le GAS comme Web App**
   - Cliquez sur **Deploy** → **Manage deployments**
   - Cliquez sur le crayon (Edit) sur le déploiement existant
   - OU créez un **New deployment** si nécessaire
   - **Version** : `New version`
   - **Execute as** : `Me` (très important !)
   - **Who has access** : `Anyone` (très important !)
   - Cliquez sur **Deploy**

4. **Copiez la nouvelle URL**
   - Après le déploiement, copiez l'URL Web App
   - Elle devrait ressembler à : `https://script.google.com/macros/s/.../exec`
   - **PAS** l'URL `dev` mais l'URL `exec`

5. **Mettez à jour Vercel**
   - Allez dans Vercel → Settings → Environment Variables
   - Mettez à jour `GAS_WEBAPP_URL` avec la nouvelle URL

### Structure attendue de la réponse

Votre `doPost` doit retourner :
```javascript
return _json(result.error ? { error: result.error } : { data: result });
```

Où `result` est ce que retourne `handleAdminActions_` :
- Pour `readSheet` : `{ values: [...] }`
- Pour `appendRow` : `{ success: true }`
- Pour `updateRow` : `{ success: true, action: 'updated' }`
- etc.

### Test après déploiement

Testez avec curl (remplacez l'URL par la nouvelle) :

```bash
curl -X POST "VOTRE_NOUVELLE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "readSheet",
    "key": "p8V9kqJYwz0M_3rXy1tLZbQF5sNaC2h7",
    "data": {
      "sheetName": "Clients"
    }
  }'
```

Vous devriez recevoir du JSON, pas du HTML :
```json
{"data":{"values":[...]}}
```

## 🔍 Vérifications

- [ ] `doPost` appelle bien `handleAdminActions_`
- [ ] `doPost` retourne `_json({ data: result })` ou `_json({ error: ... })`
- [ ] GAS redéployé avec **"Execute as: Me"**
- [ ] GAS redéployé avec **"Who has access: Anyone"**
- [ ] URL `GAS_WEBAPP_URL` dans Vercel est à jour
- [ ] Test curl retourne du JSON (pas du HTML)

## ⚠️ Notes importantes

1. **Execute as: Me** est OBLIGATOIRE pour que le GAS ait accès à votre Google Sheet
2. **Who has access: Anyone** est OBLIGATOIRE pour que Vercel puisse appeler le GAS
3. Après chaque modification du code GAS, vous devez créer une **New version** et redéployer
4. L'URL change parfois après redéploiement - mettez-la à jour dans Vercel
