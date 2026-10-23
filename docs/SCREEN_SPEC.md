# Screen-by-Screen UI/UX Specification
## Project: Eary System – Language Words Hearing Assessment Platform

**Document Version:** 2.0.0  
**Status:** Approved / Active  
**Author / Team:** Eary Frontend & UX Engineering Team  
**Last Updated:** October 2026  

---

## 1. Screen Architecture & Index

| Screen ID | Screen Name | Route Path | Access Level | Primary Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **SCR-01** | Landing & Orientation | `/` | Public | Welcome, value proposition, quick test start |
| **SCR-02** | Authentication (Login/Register) | `/login`, `/register` | Public | Account creation with demographics & secure JWT login |
| **SCR-03** | Test Setup & Calibration | `/test/setup` | Authenticated | Language/Category choice + headphone volume check |
| **SCR-04** | Active Word Discrimination Test | `/test/session` | Authenticated | 20-word binaural spoken word identification engine |
| **SCR-05** | Diagnostic Results & Analysis | `/results/:id` | Authenticated | WRS %, diagnostic tier, phoneme breakdown, PDF export |
| **SCR-06** | Patient Test History | `/history` | Authenticated | Chronological progression list & longitudinal graph |
| **SCR-07** | Admin Word Bank CMS | `/admin/words` | Admin Only | Word bank directory, filterable by language & category |
| **SCR-08** | Admin Word & Distractor Editor | `/admin/words/:id` | Admin Only | Spoken audio uploader & minimal-pair distractor authoring |
| **SCR-09** | Admin User Administration | `/admin/users` | Admin Only | User directory, activation toggling & role management |

---

## 2. Detailed Screen Specifications

---

### SCR-01: Landing & Orientation Page
- **Route**: `/`
- **Access**: Public
- **API Dependencies**: `GET /api/v1/health`

#### Layout & Wireframe
```text
+-----------------------------------------------------------------------+
|  [Logo: Eary]               Language: [AR | EN]      [Login] [Sign Up]|
+-----------------------------------------------------------------------+
|                                                                       |
|             Evaluate Your Speech Discrimination Hearing               |
|         Clinically-informed spoken word hearing assessments           |
|                in Arabic & English across all ages.                   |
|                                                                       |
|                [ > Start Quick Hearing Test ]                         |
|                                                                       |
|  [ Feature: Bilingual ]   [ Feature: Minimal Pairs ]   [ Feature: PDF ]|
+-----------------------------------------------------------------------+
```

#### Key Interactions & Behavior
- Prominent CTA **Start Quick Hearing Test** directs to `/test/setup` (prompting login/signup if unauthenticated).
- Language toggle flips entire app instantly between English (LTR) and Arabic (RTL).

---

### SCR-02: Authentication (Login & Registration)
- **Routes**: `/login`, `/register`
- **Access**: Public
- **API Dependencies**: 
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`

#### Registration Fields & Validation
- **Full Name**: Text, 3–50 chars.
- **Email**: Valid email format.
- **Password**: Min 8 chars, 1 uppercase, 1 number, 1 special character.
- **Phone**: E.164 or local format.
- **Date of Birth (`dob`)**: Date picker (used to recommend `ADULT` vs `CHILD` test category).
- **Gender**: Select dropdown (`Male`, `Female`).
- **Preferred Language**: Toggle (`Arabic`, `English`).

#### Error Handling
- Duplicate email returns field-level error: *"An account with this email already exists"*.
- Inactive user returns `403 Forbidden` banner: *"Your account has been deactivated. Please contact support."*

---

### SCR-03: Test Setup & Audio Calibration
- **Route**: `/test/setup`
- **Access**: Authenticated (`role: user` or `role: admin`)
- **API Dependencies**: None (prepares parameters for `GET /api/v1/tests/session`)

#### Layout & Wireframe
```text
+-----------------------------------------------------------------------+
|  <- Back to Dashboard                           Step 1 of 2: Setup    |
+-----------------------------------------------------------------------+
|                                                                       |
|   1. Select Test Parameters                                           |
|      Language:   ( ) Arabic (الفصحى)        ( ) English               |
|      Category:   ( ) Adult (18+)           ( ) Pediatric (Children)   |
|                                                                       |
|   2. Audio & Headphone Calibration                                    |
|      [ Headphone Recommended Icon ]                                   |
|      "Please put on your headphones and adjust your volume to a       |
|       comfortable conversational level."                              |
|                                                                       |
|      [ ▶ Play Sample Tone ]  ~~~~ Waveform ~~~~                       |
|      [ ] I can hear the audio clearly at a comfortable volume         |
|                                                                       |
|                     [ Begin 20-Word Assessment -> ]                   |
+-----------------------------------------------------------------------+
```

#### State Rules
- **Begin 20-Word Assessment** button is disabled until the user plays the sample tone and checks the confirmation checkbox.

---

### SCR-04: Active Word Discrimination Test Screen
- **Route**: `/test/session`
- **Access**: Authenticated
- **API Dependencies**:
  - `GET /api/v1/tests/session?language={lang}&category={cat}&count=20`
  - `POST /api/v1/tests/submit`

#### Layout & Wireframe
```text
+-----------------------------------------------------------------------+
|  [Exit Test x]           Word 7 of 20                 [Timer: 01:42]  |
|  [==========================----------------------------------------]|
+-----------------------------------------------------------------------+
|                                                                       |
|                               ( ( 🔊 ) )                              |
|                        [  ▶ Replay Audio (1/2)  ]                     |
|                         ~ ~ Animated Wave ~ ~                         |
|                                                                       |
|                  "Select the word you heard clearly:"                 |
|                                                                       |
|         +---------------------------+  +---------------------------+  |
|         |          Option A         |  |          Option B         |  |
|         |           (سمك)           |  |           (شمع)           |  |
|         +---------------------------+  +---------------------------+  |
|         +---------------------------+  +---------------------------+  |
|         |          Option C         |  |          Option D         |  |
|         |           (صمغ)           |  |           (سبك)           |  |
|         +---------------------------+  +---------------------------+  |
|                                                                       |
|                               [ Next Word -> ]                        |
+-----------------------------------------------------------------------+
```

#### Key Rules & State Machine
1. **On Mount**:
   - Client calls `GET /api/v1/tests/session`.
   - Questions arrive with `is_correct` flags stripped.
   - Question 1 auto-plays after 400ms.
2. **Audio Limitation**:
   - Replay button decrements: `Replay (1 left)` $\to$ `Replay disabled`. Max 2 plays per word.
3. **Zero Mid-Test Feedback**:
   - Selecting a card turns it teal. No correct/incorrect visual feedback is disclosed.
4. **On Final Word (20/20)**:
   - Primary button changes to **Submit Assessment**.
   - Submitting sends answers array + `durationSeconds` to `POST /api/v1/tests/submit`.
   - Redirects to `/results/:resultId`.

---

### SCR-05: Diagnostic Results & Phoneme Analysis
- **Route**: `/results/:id`
- **Access**: Authenticated (Owner or Admin)
- **API Dependencies**:
  - `GET /api/v1/reports/:id`
  - `GET /api/v1/reports/:id/pdf`

#### Layout & Wireframe
```text
+-----------------------------------------------------------------------+
|  [Logo: Eary]                                    [Download PDF 📄]    |
+-----------------------------------------------------------------------+
|                                                                       |
|      +---------------------------------------------------------+      |
|      |               SPEECH DISCRIMINATION SCORE               |      |
|      |                                                         |      |
|      |                     ((  95%  ))                         |      |
|      |                                                         |      |
|      |              [ BADGE: EXCELLENT DISCRIMINATION ]        |      |
|      |                                                         |      |
|      |  "Your speech discrimination in Arabic is within normal |      |
|      |   conversational limits. You identified 19 of 20 words."|      |
|      +---------------------------------------------------------+      |
|                                                                       |
|   Phonetic Analysis Breakdown                                         |
|   +-----------------------------------------------------------------+ |
|   | Error Classification: Voicing Confusion (/s/ vs /sh/)           | |
|   | Word: 'سمك'  |  Selected: 'شمع'  |  Category: Place/Voicing     | |
|   +-----------------------------------------------------------------+ |
|                                                                       |
|   Clinical Advisory & Recommendations                                 |
|   - Routine screening recommended in 12 months.                       |
|   - Screening test only; consult an audiologist for medical diagnosis.|
|                                                                       |
|        [ <- Retake Test ]             [ View All Past Results -> ]    |
+-----------------------------------------------------------------------+
```

#### Key Actions
- **Download PDF**: Direct browser download of signed clinical report via `GET /api/v1/reports/:id/pdf`.
- **Badge Colors**:
  - `90% - 100%`: Green (`EXCELLENT`)
  - `76% - 88%`: Blue (`GOOD`)
  - `60% - 74%`: Amber (`FAIR`)
  - `< 60%`: Red (`POOR`)

---

### SCR-06: Patient Assessment History
- **Route**: `/history`
- **Access**: Authenticated
- **API Dependencies**: `GET /api/v1/reports/history`

#### Features
- **Progression Graph**: Line chart showing score trend across test dates.
- **Table of Past Tests**: Columns: Date, Language, Category, Score (%), Tier Badge, Action (`View Details`, `Download PDF`).

---

### SCR-07: Admin Word Bank CMS
- **Route**: `/admin/words`
- **Access**: Admin (`role: admin`)
- **API Dependencies**: 
  - `GET /api/v1/words`
  - `DELETE /api/v1/words/:id`

#### Layout & Controls
- **Filter Bar**: Filter by Language (`All`, `Arabic`, `English`), Category (`All`, `Adult`, `Pediatric`), Status (`Active`, `Inactive`).
- **Data Table**: Columns: Target Word, Audio Player Preview, Language, Category, Options Count, Status Badge, Actions (`Edit`, `Deactivate`).
- **Primary CTA**: `+ Add New Word Item` (opens SCR-08).

---

### SCR-08: Admin Word & Distractor Editor
- **Route**: `/admin/words/new`, `/admin/words/:id`
- **Access**: Admin (`role: admin`)
- **API Dependencies**:
  - `POST /api/v1/words` (multipart/form-data)
  - `PUT /api/v1/words/:id`

#### Form Structure
1. **Target Word**: Text (e.g., `bat` / `سمك`).
2. **IPA / Diacritics**: Optional phonetic transcription (e.g., `/bæt/` / `/سَمَكٌ/`).
3. **Language & Category**: Select dropdowns (`AR` / `EN`, `ADULT` / `CHILD`).
4. **Spoken Audio File Upload**: Drag-and-drop zone accepting `.mp3` or `.wav` (max 5 MB) with instant audio playback preview.
5. **Multiple Choice Options Builder**:
   - Option 1 (Target): Text input, pre-checked `[x] Correct Word`.
   - Option 2 (Distractor 1): Text input, `[ ] Correct`, Phoneme Tag (`voicing`, `place`, `vowel_formant`).
   - Option 3 (Distractor 2): Text input, `[ ] Correct`, Phoneme Tag.
   - Option 4 (Distractor 3): Text input, `[ ] Correct`, Phoneme Tag.
6. **Save Button**: Submits payload to backend.

---

### SCR-09: Admin User Administration
- **Route**: `/admin/users`
- **Access**: Admin (`role: admin`)
- **API Dependencies**:
  - `GET /api/v1/users`
  - `PATCH /api/v1/users/:id/status`

#### Layout & Controls
- Search by Name or Email.
- Filter by Role (`User`, `Admin`) and Status (`Active`, `Inactive`).
- Row Action: Toggle Status (`Activate` / `Deactivate`) with immediate confirmation toast.
