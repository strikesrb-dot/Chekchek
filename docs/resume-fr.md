# ChekChek — Résumé exécutif (français)

*Version détaillée : docs 01–06 (en anglais). Ce résumé couvre l'essentiel du plan.*

## La vision

ChekChek est une plateforme de **suivi GPS et de dispatch pour l'économie du transport au
Sénégal** — l'équivalent d'Uber, mais conçu pour les réalités sénégalaises. Le cœur
technique est **multimodal** dès le premier jour : motos, taxis, voitures, minibus
(cars rapides / Ndiaga Ndiaye), camions, et même pirogues. La porte d'entrée commerciale,
ce sont les deux-roues : les **thiak-thiak** (livreurs à moto de Dakar) et les
**« Jakarta »** (motos-taxis de Touba, Thiès, Kaolack, Mbour, Saint-Louis, Ziguinchor…).
Objectif : **200 000 véhicules suivis**.

## Trois différences fondamentales avec un clone d'Uber

1. **Le suivi ne suppose pas un smartphone.** Trois niveaux : (a) l'application du
   conducteur ; (b) un **boîtier GPS câblé à 6 000–15 000 FCFA** (compatible protocoles
   GT06/Teltonika, installé par des mécaniciens formés) ; (c) un repli USSD/SMS pour les
   téléphones simples et les zones sans data.
2. **L'argent passe par Wave et Orange Money, pas par les cartes bancaires.** Le cash
   reste accepté ; le paiement à la livraison (COD) avec réconciliation automatique est
   la fonctionnalité décisive pour le e-commerce sénégalais.
3. **Le suivi est la plateforme ; le dispatch est une application par-dessus.** Chaque
   nouveau mode (taxis, minibus, fret) est un lancement produit, pas une refonte technique.

## Modèle économique

- **Abonnement hebdomadaire fixe** pour les conducteurs (≈ 2 500–4 000 FCFA/semaine) au
  lieu d'une commission par course — l'expérience africaine (SafeBoda, Gozem, Max.ng)
  montre que la commission pousse les conducteurs hors plateforme.
- **Frais de service** côté clients et marchands (livraison, COD).
- **SaaS de suivi de flotte** pour tout type de véhicule : 1 500–2 500 FCFA/véhicule/mois,
  boîtier à prix coûtant. Ce volet finance la base matérielle et ouvre le partenariat
  avec les financeurs de motos (suivi + immobilisation à distance = crédit sécurisé).
- Potentiel à 200 000 véhicules : de l'ordre de **35 à 45 milliards FCFA de revenus
  annuels récurrents**.

## Déploiement par phases

1. **Dakar, livraison uniquement** (mois 3–9) : 500 livreurs actifs, marchands ancres,
   paiement Wave, réconciliation COD. La moto-taxi de passagers étant restreinte à Dakar,
   la livraison est le point d'entrée légal et dense.
2. **Une ville régionale, transport de passagers** (mois 9–15) : Mbour ou Thiès, en
   partenariat formel avec la commune et l'association des conducteurs — ChekChek comme
   outil de **formalisation** (gilets, tarifs affichés, assurance, bouton SOS), pas de
   disruption contre les syndicats.
3. **Multi-villes et multimodal** (mois 15–30) : Touba (avant le Magal), Kaolack,
   Saint-Louis, Ziguinchor ; ouverture des taxis, minibus et fret sur le même socle.
4. **Échelle nationale** (mois 30–48) : 200 000 véhicules via les livreurs, les
   motos-taxis régionales, le SaaS de flotte et les véhicules financés par des partenaires.

## Réglementation (engagement précoce)

Déclaration à la **CDP** (loi 2008-12 sur les données personnelles — la géolocalisation
est une donnée personnelle), codes USSD via l'**ARTP**, protocole d'accord avec les
communes et le **Ministère des Transports terrestres/CETUD**, portefeuilles électroniques
adossés à un partenaire agréé **BCEAO**, assurance groupe (zone CIMA).

## Technique (résumé)

Charge de pointe estimée à ~70 000 véhicules connectés simultanément, soit ~10–12 000
messages de position/seconde — une charge modeste et maîtrisable. Architecture : MQTT
(téléphones) + TCP (boîtiers, décodeurs dérivés de Traccar) → Kafka → Redis/H3 (état
temps réel, recherche du véhicule le plus proche en millisecondes) → PostgreSQL/PostGIS
(historique). Cartographie OpenStreetMap auto-hébergée avec gazetteer de repères locaux
(l'adressage par points de repère plutôt que par numéros de rue). Applications
légères (< 20 Mo), tolérantes aux coupures réseau, interface en français avec **guidage
audio en wolof**.

## Prototype

Le dossier `prototype/` du dépôt contient une tranche fonctionnelle : ingestion GPS
(protocole OsmAnd + décodeur binaire GT06), moteur de dispatch multimodal, carte temps
réel, application conducteur navigateur, et simulateur de flotte dakaroise.
