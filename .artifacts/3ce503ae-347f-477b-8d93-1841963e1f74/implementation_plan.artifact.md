# Renommage de l'application vers "Learn Polish with Kasia"

Ce plan détaille les modifications nécessaires pour mettre à jour l'identité visuelle, la marque interne et les identifiants techniques (Android/iOS) du projet.

## User Review Required

> [!IMPORTANT]
> **Validation des constantes `appConfig.ts`** : Veuillez valider les nouvelles valeurs proposées pour les URLs et métadonnées avant application.

> [!WARNING]
> **Changement de dossier Java** : Le dossier `android/app/src/main/java/com/polonaisfacile/learn` sera déplacé vers `android/app/src/main/java/com/polishwithkasia/app`.

## Valeurs actuelles vs proposées (appConfig.ts)

| Constante | Valeur Actuelle | Nouvelle Valeur Proposée |
| :--- | :--- | :--- |
| `SUPPORT_EMAIL` | `support@polonaisfacile.app` | `support@polishwithkasia.app` |
| `WEBSITE` | `https://polonaisfacile.app` | `https://polishwithkasia.app` |
| `PLAY_STORE` | `...id=com.votreapp.polonaisfacile` | `...id=com.polishwithkasia.app` |
| `APP_STORE` | `.../polonais-facile/id000000000` | `.../polish-with-kasia/id000000000` |
| `NAME` | `Polonais Facile` | `Polish with Kasia` |
| `BUNDLE_ID` | `com.votreapp.polonaisfacile` | `com.polishwithkasia.app` |

## Proposed Changes

### Configuration Globale & Expo

#### [MODIFY] [app.json](file:///C:/dev/Learn_Polish_with_Kasia/app.json)
- Mise à jour du `scheme` : `polonaisfacile` → `polishwithkasia`.
- Vérification du `name` ("Learn Polish with Kasia") et `slug` ("polish-with-kasia").
- **Note** : Le champ `owner` ("polonais-facile") ne sera PAS modifié.

#### [MODIFY] [appConfig.ts](file:///C:/dev/Learn_Polish_with_Kasia/src/config/appConfig.ts)
- Mise à jour des constantes `URLS` et `APP_META` selon validation utilisateur.

---

### Android

#### [MODIFY] [build.gradle](file:///C:/dev/Learn_Polish_with_Kasia/android/app/build.gradle)
- `namespace`: `com.polonaisfacile.learn` → `com.polishwithkasia.app`
- `applicationId`: `com.polonaisfacile.learn` → `com.polishwithkasia.app`

#### [MODIFY] [AndroidManifest.xml](file:///C:/dev/Learn_Polish_with_Kasia/android/app/src/main/AndroidManifest.xml)
- Mise à jour des schemes d'URL : `polonaisfacile` → `polishwithkasia` et `exp+polonais-facile` → `exp+polish-with-kasia`.

#### [MODIFY] [strings.xml](file:///C:/dev/Learn_Polish_with_Kasia/android/app/src/main/res/values/strings.xml)
- `app_name`: `Polonais Facile` → `Learn Polish with Kasia`

#### [MOVE] Dossiers Java/Kotlin
- Renommage de `android/app/src/main/java/com/polonaisfacile/learn` vers `android/app/src/main/java/com/polishwithkasia/app`.

#### [MODIFY] [MainActivity.kt](file:///C:/dev/Learn_Polish_with_Kasia/android/app/src/main/java/com/polonaisfacile/learn/MainActivity.kt)
- Mise à jour de la déclaration `package`.

#### [MODIFY] [MainApplication.kt](file:///C:/dev/Learn_Polish_with_Kasia/android/app/src/main/java/com/polonaisfacile/learn/MainApplication.kt)
- Mise à jour de la déclaration `package`.

---

### Interface Utilisateur (UI)

#### [MODIFY] [profile.tsx](file:///C:/dev/Learn_Polish_with_Kasia/app/(tabs)/profile.tsx)
- Texte de version : `Polonais Facile` → `Polish with Kasia`.

#### [MODIFY] [onboarding.tsx](file:///C:/dev/Learn_Polish_with_Kasia/app/onboarding.tsx)
- Titre de l'écran : `Polonais Facile` → `Polish with Kasia`.

## Verification Plan

### Automated Tests
- `npx expo lint` pour vérifier les imports.
- `cd android && ./gradlew clean` pour valider la structure Android.

### Manual Verification
- Vérification visuelle du nom dans l'écran de profil et d'onboarding.
- Test de l'ouverture de l'application via le nouveau scheme `polishwithkasia://`.
