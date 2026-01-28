# 🚀 LiveTrack: Real-Time Synchronization & Safety Platform
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.3-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)
**LiveTrack** is a high-performance, real-time location synchronization platform designed for safety, group coordination, and social interaction. Built with a "Performance-First" mindset, it offers sub-second latency for tracking movements across the globe.
---
## ✨ Key Features
### 🌐 Real-Time Synchronization
- **Sub-second Location Updates:** Powered by WebSockets (Socket.io) for fluid marker movements.
- **Connection Recovery:** Robust state restoration for users with intermittent network signals.
- **Predictive Telemetry:** Intelligent velocity calculation and activity detection (Walking 🚶, Driving 🚗, Stationary 🏠).
### 🚨 Safety Intelligence
- **Persistent SOS:** Server-backed emergency signals that remain active even if the browser is refreshed or closed.
- **Proximity Alerts:** Automatic "Toast" notifications when group members are within 100 meters.
- **Emergency Helplines:** Integrated one-tap access to critical emergency contacts.
### 🗺️ Collaborative Mapping
- **Instant Meeting Points:** Double-click anywhere to drop a "Waypoint" synced across the entire party.
- **Party System:** Secure, code-based rooms for instant group tracking without complex sign-ups.
- **Host Controls:** Creators have the authority to moderate members and manage the map state.
### 🎨 Premium User Experience
- **Glassmorphic UI:** Modern design built with Tailwind CSS 4 and Radix UI.
- **Fluid Animations:** High-end transitions powered by Framer Motion, GSAP, and a subtle Three.js integration for visual depth.
---
## 🛠️ Technical Stack
- **Frontend:** [Next.js 16](https://nextjs.org/), [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/), [Lucide Icons](https://lucide.dev/)
- **Mapping:** [Leaflet.js](https://leafletjs.com/), [OpenStreetMap](https://www.openstreetmap.org/)
- **Animation:** [Framer Motion](https://www.framer.com/motion/), [GSAP](https://greensock.com/gsap/), [Three.js](https://threejs.org/)
- **Backend:** [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/), [Socket.io](https://socket.io/)
- **State Management:** Custom Server-side `PartyManager` logic
---
## 🚀 Getting Started
### Prerequisites
- Node.js (v18+)
- npm or yarn
### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/SiddharthChaturvedii/Real-Time-Tracker.git
   cd Real-Time-Tracker
Setup Backend:

npm install
# Start the server (runs on port 3000)
node app.js
Setup Frontend:

cd frontend
npm install
# Run development server
npm run dev
Environment Variables: Create a .env.local in the frontend directory:

NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
📂 Project Structure
├── app.js               # Express server & Socket.io logic
├── managers/            # Server-side state (PartyManager)
├── utils/               # Server validators & loggers
└── frontend/            # Next.js Application
    ├── app/             # Application routes & layout
    ├── components/      # UI & Mapping components
    └── lib/             # API & Socket client utilities
🤝 Contributing
Contributions are welcome! If you have a feature request or bug report, please open an issue or submit a pull request.

📜 License
This project is licensed under the 

ISC License
.

Built with ❤️ for a safer, more connected world.

