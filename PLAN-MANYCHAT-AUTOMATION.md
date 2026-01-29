# Plan d'automatisation Manychat - MirrorEffect

## 📋 Vue d'ensemble

ManyChat dispose d'une **API publique complète** qui permet d'automatiser le setup et la gestion des chatbots. Ce document présente un plan concret pour intégrer ManyChat avec le système MirrorEffect.

---

## 🔌 API ManyChat disponible

### Documentation officielle
- **API Swagger** : https://api.manychat.com/swagger
- **Help Center** : https://help.manychat.com/hc/en-us/articles/14281252007580-Dev-Tools-Basics
- **Quick Start** : https://help.manychat.com/hc/en-us/articles/14281299586972-Dev-Program-Quick-Start

### Capacités clés de l'API

1. **Gestion des contacts** : Créer, mettre à jour, taguer les utilisateurs
2. **Envoi de messages** : Envoyer des messages automatiques via chatbot
3. **External Requests** : Recevoir des données depuis des webhooks externes
4. **Dynamic Blocks** : Contenu dynamique dans les conversations
5. **Flow Automation** : Déclencher des flows automatiquement

### Méthodes HTTP supportées
- `POST` : Créer/envoyer
- `GET` : Lire/récupérer
- `PUT` : Mettre à jour
- `DELETE` : Supprimer

---

## 🎯 Objectifs d'automatisation

### Phase 1 : Lead Capture (Immédiat)
- Capturer les leads depuis Facebook Messenger
- Qualifier automatiquement (date événement, type, localisation)
- Synchroniser avec Supabase en temps réel

### Phase 2 : Nurturing & Conversion (Court terme)
- Envoyer les séquences de nurturing via Messenger (alternative/complément aux emails)
- Relances automatiques pour conversion
- Liens de paiement personnalisés dans Messenger

### Phase 3 : Post-Event & Retention (Moyen terme)
- Demandes d'avis Google via Messenger
- Offres VIP anniversaire
- Réservations repeat automatisées

---

## 🏗️ Architecture proposée

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Facebook   │         │   ManyChat   │         │  MirrorEffect│
│  Messenger   │◄───────►│   Platform   │◄───────►│   Backend    │
└──────────────┘         └──────────────┘         └──────────────┘
       ▲                        │                         │
       │                        │                         │
       │                        ▼                         ▼
       │                 ┌──────────────┐         ┌──────────────┐
       └─────────────────│  Supabase    │◄───────►│   Mollie     │
                         │  Database    │         │   Payments   │
                         └──────────────┘         └──────────────┘
```

### Flux de données

**Lead Capture (Messenger → Backend) :**
1. User interagit avec Messenger bot
2. ManyChat collecte données via flow
3. ManyChat envoie webhook vers `/api/public/manychat/lead`
4. Backend crée lead dans Supabase
5. ManyChat reçoit confirmation + lead_id

**Nurturing (Backend → Messenger) :**
1. Cron détecte lead à nurture
2. Backend appelle API ManyChat
3. ManyChat envoie message Messenger
4. User clique CTA → webhook vers backend

**Payment Link (Backend ↔ Messenger) :**
1. User prêt à payer dans Messenger
2. ManyChat demande checkout via API
3. Backend génère payment Mollie + event_id
4. Backend retourne link à ManyChat
5. ManyChat envoie link dans Messenger
6. User paie → webhook Mollie déclenche confirmation

---

## 💻 Implémentation technique

### 1. Configuration ManyChat API

**Variables d'environnement :**
```env
MANYCHAT_API_KEY=your_api_key_here
MANYCHAT_PAGE_ID=your_facebook_page_id
MANYCHAT_WEBHOOK_SECRET=your_webhook_secret
```

**Fichier de configuration :** `lib/manychat/config.ts`
```typescript
export const MANYCHAT_CONFIG = {
  apiKey: process.env.MANYCHAT_API_KEY!,
  pageId: process.env.MANYCHAT_PAGE_ID!,
  webhookSecret: process.env.MANYCHAT_WEBHOOK_SECRET!,
  apiBaseUrl: "https://api.manychat.com/fb",
};
```

---

### 2. Client API ManyChat

**Fichier :** `lib/manychat/client.ts`

```typescript
import { MANYCHAT_CONFIG } from "./config";

interface ManyChatContact {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

interface ManyChatMessagePayload {
  subscriber_id: string;
  data: {
    version: "v2";
    content: {
      messages: Array<{
        type: "text" | "buttons" | "cards";
        text?: string;
        buttons?: Array<{
          type: "url" | "flow";
          caption: string;
          url?: string;
          flow_ns?: string;
        }>;
      }>;
    };
  };
}

export class ManyChatClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = MANYCHAT_CONFIG.apiKey;
    this.baseUrl = MANYCHAT_CONFIG.apiBaseUrl;
  }

  /**
   * Créer ou mettre à jour un contact
   */
  async upsertContact(data: {
    subscriber_id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    custom_fields?: Record<string, string | number>;
    tags?: string[];
  }): Promise<ManyChatContact> {
    const response = await fetch(`${this.baseUrl}/subscriber/setCustomField`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        subscriber_id: data.subscriber_id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        ...data.custom_fields,
      }),
    });

    if (!response.ok) {
      throw new Error(`ManyChat API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Envoyer un message à un utilisateur
   */
  async sendMessage(payload: ManyChatMessagePayload): Promise<{ status: string }> {
    const response = await fetch(`${this.baseUrl}/sending/sendContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`ManyChat send message error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Ajouter un tag à un utilisateur
   */
  async addTag(subscriberId: string, tagId: string): Promise<void> {
    await fetch(`${this.baseUrl}/subscriber/addTag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        subscriber_id: subscriberId,
        tag_id: tagId,
      }),
    });
  }

  /**
   * Retirer un tag d'un utilisateur
   */
  async removeTag(subscriberId: string, tagId: string): Promise<void> {
    await fetch(`${this.baseUrl}/subscriber/removeTag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        subscriber_id: subscriberId,
        tag_id: tagId,
      }),
    });
  }

  /**
   * Récupérer les infos d'un contact
   */
  async getContact(subscriberId: string): Promise<ManyChatContact> {
    const response = await fetch(
      `${this.baseUrl}/subscriber/getInfo?subscriber_id=${subscriberId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`ManyChat get contact error: ${response.statusText}`);
    }

    return response.json();
  }
}

export const manychatClient = new ManyChatClient();
```

---

### 3. Webhook ManyChat → Backend

**Fichier :** `apps/web/app/api/webhooks/manychat/route.ts`

```typescript
import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { generateLeadId } from "@/lib/date-utils";
import { normalizeDateToISO } from "@/lib/date";

interface ManyChatWebhookPayload {
  id: string; // subscriber_id
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  custom_fields?: {
    event_date?: string;
    event_type?: string;
    address?: string;
    guest_count?: string;
  };
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  console.log(`[manychat-webhook][${requestId}] Requête reçue`);

  // Vérifier le secret webhook
  const secret = req.headers.get("x-manychat-secret");
  if (secret !== process.env.MANYCHAT_WEBHOOK_SECRET) {
    console.warn(`[manychat-webhook][${requestId}] Secret invalide`);
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let payload: ManyChatWebhookPayload;
  try {
    payload = await req.json();
  } catch (error) {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const subscriberId = payload.id;
  const clientName = [payload.first_name, payload.last_name].filter(Boolean).join(" ");
  const clientEmail = payload.email?.toLowerCase() || "";
  const clientPhone = payload.phone || "";

  // Générer lead_id
  const leadId = generateLeadId();

  // Créer le lead dans Supabase
  const supabase = createSupabaseServerClient();

  try {
    const { error } = await supabase.from("leads").insert({
      lead_id: leadId,
      status: "progress",
      step: 5,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone,
      language: "fr",
      event_date: normalizeDateToISO(payload.custom_fields?.event_date || ""),
      event_type: payload.custom_fields?.event_type || null,
      event_location: payload.custom_fields?.address || "",
      guest_count: payload.custom_fields?.guest_count
        ? parseInt(payload.custom_fields.guest_count, 10)
        : null,
      utm_source: "manychat",
      utm_medium: "messenger",
      utm_campaign: "chatbot",
    });

    if (error) {
      console.error(`[manychat-webhook][${requestId}] DB error:`, error);
      return Response.json({ ok: false, error: "Database error" }, { status: 500 });
    }

    console.log(`[manychat-webhook][${requestId}] Lead créé:`, {
      lead_id: leadId,
      subscriber_id: subscriberId,
    });

    // Retourner le lead_id à ManyChat pour le stocker en custom field
    return Response.json({
      ok: true,
      lead_id: leadId,
      message: "Lead créé avec succès",
    });
  } catch (error) {
    console.error(`[manychat-webhook][${requestId}] Error:`, error);
    return Response.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
```

---

### 4. Envoyer des messages depuis le backend

**Fichier :** `lib/manychat/sendNurturingMessage.ts`

```typescript
import { manychatClient } from "./client";

export async function sendNurturingMessage(
  subscriberId: string,
  template: "J1_VALUE" | "J3_FAQ" | "J7_PROOF" | "J14_PROMO" | "J21_GOODBYE",
  variables: {
    first_name?: string;
    checkout_url?: string;
  }
): Promise<void> {
  const templates = {
    J1_VALUE: {
      text: `Salut ${variables.first_name || "toi"} 👋\n\nMerci pour ton intérêt ! Mirror Effect transforme vos événements en souvenirs magiques avec notre photobooth interactif.\n\n✨ Photos illimitées\n🎭 Filtres & animations\n📲 Partage instantané\n\nDes questions ? Réponds-moi ici !`,
      buttons: [
        {
          type: "url" as const,
          caption: "Voir nos packs 💎",
          url: "https://mirroreffect.co/#packs",
        },
      ],
    },
    J3_FAQ: {
      text: `Hey ${variables.first_name} ! 😊\n\nJ'ai remarqué que tu hésites encore. Voici les réponses aux questions les plus fréquentes :\n\n❓ Combien de temps dure la location ?\n→ 4h incluses, extensible\n\n❓ C'est compliqué à utiliser ?\n→ Ultra intuitif, même pour mamie !\n\n❓ Frais de déplacement ?\n→ Calculés automatiquement selon ta localisation`,
      buttons: [
        {
          type: "url" as const,
          caption: "Calculer mon devis ⚡",
          url: "https://mirroreffect.co/reservation",
        },
      ],
    },
    J7_PROOF: {
      text: `${variables.first_name}, regarde ce que nos clients disent ! ⭐⭐⭐⭐⭐\n\n"Le Mirror Effect était LA star de notre mariage ! Nos invités ont adoré." - Sophie\n\n"Service impeccable, souvenirs inoubliables." - Marc\n\n150+ événements réussis en 2025 🎉`,
      buttons: [
        {
          type: "url" as const,
          caption: "Voir les avis Google 🌟",
          url: "https://maps.app.goo.gl/2fRxsTJnuZzjJ92B6",
        },
      ],
    },
    J14_PROMO: {
      text: `🎁 OFFRE SPÉCIALE pour toi ${variables.first_name} !\n\n-50€ sur ta réservation si tu confirmes cette semaine.\n\nCode : MESSENGER50\n\nValable jusqu'à dimanche 23h59 ⏰`,
      buttons: [
        {
          type: "url" as const,
          caption: "Réserver maintenant 🔥",
          url: variables.checkout_url || "https://mirroreffect.co/reservation",
        },
      ],
    },
    J21_GOODBYE: {
      text: `Salut ${variables.first_name},\n\nC'est mon dernier message, promis ! 😊\n\nSi ce n'est pas le bon moment, pas de souci. Mais sache que notre calendrier se remplit vite.\n\nSi jamais tu changes d'avis, je suis là !\n\nBelle journée ✨`,
      buttons: [
        {
          type: "url" as const,
          caption: "Voir les disponibilités 📅",
          url: "https://mirroreffect.co/reservation",
        },
      ],
    },
  };

  const config = templates[template];

  await manychatClient.sendMessage({
    subscriber_id: subscriberId,
    data: {
      version: "v2",
      content: {
        messages: [
          {
            type: "text",
            text: config.text,
          },
          {
            type: "buttons",
            buttons: config.buttons,
          },
        ],
      },
    },
  });
}
```

---

### 5. Intégration dans le cron d'emails

**Modifier :** `apps/web/app/api/cron/send-emails/route.ts`

Ajouter après chaque envoi d'email de nurturing :

```typescript
import { sendNurturingMessage } from "@/lib/manychat/sendNurturingMessage";

// Dans la boucle de nurturing, après avoir queueé l'email :
if (lead.manychat_subscriber_id) {
  try {
    await sendNurturingMessage(
      lead.manychat_subscriber_id,
      step.key.replace("NURTURE_", "") as any,
      { first_name: lead.client_name }
    );
    console.log(`[nurturing] ManyChat message sent for ${step.key}`);
  } catch (error) {
    console.error(`[nurturing] ManyChat error (non-blocking):`, error);
  }
}
```

**Ajouter la colonne dans Supabase :**
```sql
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS manychat_subscriber_id TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_manychat
ON leads(manychat_subscriber_id)
WHERE manychat_subscriber_id IS NOT NULL;
```

---

## 🔄 Flows ManyChat à créer

### Flow 1 : Capture initiale

**Déclencheur :** User envoie message ou clique sur ad

1. Message de bienvenue : "Salut ! 👋 Tu veux louer le Mirror Effect ?"
2. Boutons : "Oui, dis-moi tout !" / "Non merci"
3. Si oui → Demander date d'événement (date picker)
4. Demander type d'événement (buttons : Mariage / Anniversaire / Corporate / Autre)
5. Demander localisation (text input + validation)
6. Demander nombre d'invités (number input)
7. Demander email (email validation)
8. External Request → POST `/api/webhooks/manychat/lead`
9. Stocker `lead_id` en custom field
10. Message final : "Super ! Tu recevras ton devis par email dans 2 min"

### Flow 2 : Payment Link

**Déclencheur :** User clique "Je veux réserver"

1. Vérifier si custom field `lead_id` existe
2. Si non → Rediriger vers Flow 1
3. Si oui → External Request GET `/api/manychat/checkout?lead_id={lead_id}`
4. Backend retourne `checkout_url` (Mollie)
5. Envoyer message avec bouton : "Clique ici pour payer ton acompte (180€)"
6. Ajouter tag "payment_initiated"

### Flow 3 : Post-Payment

**Déclencheur :** Webhook depuis backend après paiement confirmé

1. Message : "🎉 Paiement confirmé ! Tu vas recevoir ton email de confirmation."
2. Retirer tag "payment_initiated"
3. Ajouter tag "customer"
4. Message : "D'ici ton événement, n'hésite pas à me poser des questions !"

---

## 📅 Roadmap d'implémentation

### Semaine 1 : Setup infrastructure
- [ ] Créer compte Dev Program ManyChat
- [ ] Générer API key
- [ ] Configurer webhook secret
- [ ] Implémenter `ManyChatClient`
- [ ] Ajouter colonne `manychat_subscriber_id` dans `leads`
- [ ] Créer endpoint `/api/webhooks/manychat/lead`

### Semaine 2 : Flow capture
- [ ] Créer Flow 1 dans ManyChat dashboard
- [ ] Tester capture de leads depuis Messenger
- [ ] Vérifier sync avec Supabase
- [ ] Tester différents scénarios (avec/sans email, etc.)

### Semaine 3 : Payment integration
- [ ] Créer endpoint `/api/manychat/checkout`
- [ ] Créer Flow 2 (payment link)
- [ ] Implémenter webhook post-payment vers ManyChat
- [ ] Tester end-to-end : Messenger → Paiement → Confirmation

### Semaine 4 : Nurturing automation
- [ ] Implémenter `sendNurturingMessage()`
- [ ] Intégrer dans cron `/api/cron/send-emails`
- [ ] Créer templates Messenger pour J1, J3, J7, J14, J21
- [ ] Tester séquences complètes

### Semaine 5 : Post-event
- [ ] Ajouter flows pour demande d'avis
- [ ] Ajouter flows pour offres anniversaire
- [ ] Tester retention flows

---

## 💡 Avantages vs Email

### Email (actuel)
- ✅ Professionnel
- ✅ Détails complets
- ❌ Taux d'ouverture ~20%
- ❌ Peut aller en spam
- ❌ Moins interactif

### Messenger (nouveau)
- ✅ Taux d'ouverture ~80%
- ✅ Réponses instantanées
- ✅ Très interactif
- ✅ Notifications push natives
- ❌ Moins formel

### Stratégie hybride (recommandé)
- Email : Confirmations, contrats, factures
- Messenger : Nurturing, relances, SAV, engagement

---

## 🔐 Sécurité

1. **Webhook Secret** : Toujours vérifier le secret dans les headers
2. **Rate Limiting** : Limiter les appels API ManyChat (100/min recommandé)
3. **Data Privacy** : Ne jamais exposer les API keys côté client
4. **RGPD** : Permettre opt-out depuis Messenger aussi (commande "STOP")

---

## 📊 KPIs à tracker

- Taux de capture Messenger vs Web
- Taux d'ouverture Messenger vs Email
- Taux de conversion Messenger vs Email
- Temps moyen de réponse bot
- Satisfaction client (demander rating après événement)

---

## ✅ Checklist de démarrage

- [ ] Créer compte ManyChat
- [ ] Connecter page Facebook
- [ ] Obtenir API key
- [ ] Configurer webhooks
- [ ] Déployer endpoints backend
- [ ] Créer Flow 1 (capture)
- [ ] Tester avec compte test
- [ ] Monitorer logs 48h
- [ ] Déployer en production

---

## 📚 Ressources utiles

- ManyChat API Swagger : https://api.manychat.com/swagger
- Help Center : https://help.manychat.com/hc/en-us/articles/14281252007580-Dev-Tools-Basics
- Dev Program : https://help.manychat.com/hc/en-us/articles/14281299586972-Dev-Program-Quick-Start
- External Requests : https://help.manychat.com/hc/en-us/articles/14281285374364-Dev-Tools-External-request
- Community Forum : https://community.manychat.com/

---

**Prochaines étapes** : Commencer par la Semaine 1 et créer le compte Dev Program pour obtenir l'API key 🚀
