# SceneSolver Frontend

Modern forensic intelligence frontend for SceneSolver, designed with a high-tech dark visual aesthetic inspired by tactical forensic laboratories and powered by CLIP and Vision Transformer (ViT) deep learning backends.

---

## Design System & Architecture

- **Visual Theme**: Cyber-forensic dark palette (`#08080c`, `#0b0c12`), ambient cursor glow, scanlines, and film-grain overlays.
- **Accents**: Calibrated forensic color taxonomy:
  - Arson: Amber (`#fbbf24`)
  - Burglary: Cyan (`#22d3ee`)
  - Homicide: Rose (`#fb7185`)
  - Vehicle Theft: Sky (`#38bdf8`)
  - Vandalism: Violet (`#a78bfa`)
  - Narcotics: Emerald (`#34d399`)
- **Key Visual Components**:
  - `ConfidenceGauge`: Animated circular SVG gauge rendering calibrated model confidence.
  - `EvidenceCard`: Real-time interactive canvas with toggleable ViT attention map and telemetry feed.
  - `ScrambleText` & `Typewriter`: Terminal-style declassification text and typewriter effect for AI summaries.
  - `SceneArt`: Vector illustrations of forensic crime scene topologies (alley, warehouse, room, garage).

---

## Preserved Functionality

All original application capabilities and API integrations remain intact:
1. **User Authentication**:
   - Email/password local registration and login (`POST /api/auth/local/register`, `POST /api/auth/local/login`).
   - OTP email verification modal with resend capabilities (`POST /api/auth/local/verify-otp`, `POST /api/auth/local/resend-otp`).
   - Single Sign-On via Google OAuth (`GET /api/auth/google`, `/auth/callback`).
   - Protected route guards.
2. **Case Intake & AI Inference**:
   - Case metadata ingestion (Title, Location, Date, Time).
   - Batch upload of 4–15 images or 1 video file with drag-and-drop validation.
   - Dual-backend pipeline:
     1. Python Flask ML inference (`POST /upload` on port 5001) for CLIP classification and ViT evidence extraction.
     2. Node/Express backend (`POST /api/upload` on port 5000) for persistent file storage and Gemini narrative synthesis.
3. **Case Summary & Dossier Export**:
   - Primary classification display with model confidence gauge.
   - Visual evidence token list with confidence bars.
   - Structured AI investigation breakdown.
   - Export to PDF (`html2pdf.js`), JSON export, and clipboard copy.
4. **Case History Archive**:
   - Persistent case index per authenticated user (`GET /api/upload/user`).
   - Detailed dossier inspector with image modal zoom and embedded video playback.
   - Append additional media to existing cases.

---

## Getting Started

### Prerequisites
- Node.js >= 18 (Tested on Node 20 & 24)
- npm or pnpm

### Installation
```bash
cd frontend
npm install
```

### Environment Configuration
Configure endpoints in `src/config.js` or via `.env`:
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_FLASK_URL=http://127.0.0.1:5001
```

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Running Tests
Execute unit and validation test suites with Node.js native test runner:
```bash
npm test
```

### Linting
```bash
npm run lint
```
