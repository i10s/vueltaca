# 🏎️ Scalextric Lap Timer

<div align="center">

![Scalextric Lap Timer](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss)

**A camera-based lap timing system for Scalextric and slot car racing**

[Live Demo](https://laptimer.lovable.app) · [Report Bug](https://github.com/yourusername/laptimer/issues) · [Request Feature](https://github.com/yourusername/laptimer/issues)

</div>

---

## ✨ Features

### 🎥 Camera-Based Detection
- **Real-time motion detection** using your device's camera
- **60 FPS processing** for detecting fast-moving cars
- **Dual detection algorithm** - catches both fast passes and normal crossings
- **Adjustable ROI (Region of Interest)** - drag and resize detection zones
- **Auto-calibration** - automatically sets optimal threshold based on lighting

### 🏁 Multi-Lane Racing
- Support for **1-4 simultaneous lanes**
- **Independent tracking** for each lane with color coding
- **Custom racer names and colors** - personalize each lane
- **Real-time position tracking** - see who's winning

### ⏱️ Timing & Statistics
- **Last lap, Best lap, Average lap** times per lane
- **Speed calculation** based on configurable track length (0.1m increments)
- **Live delta display** - difference from best lap
- **Lap time progression charts** with visual trends
- **Automatic outlier filtering** - extreme times (crashes, off-track) are filtered from charts using IQR method
- **Statistics dashboard** - all-time bests, total laps, racing time, racer leaderboard
- **Race history** with all-time records

### 🎮 Race Modes
- **Free mode** - unlimited laps
- **Laps mode** - first to X laps wins (configurable 1-100 laps)
- **Time mode** - race against the clock (1-60 minutes)

### 📱 Mobile-First Design
- **Progressive Web App (PWA)** - install on your home screen
- **Works offline** after first load
- **Wake lock** - screen stays on during racing
- **Haptic feedback** - vibration on lap detection
- **Fullscreen mode** for immersive racing

### 🔊 Audio Features
- **Sound effects** for lap detection and best laps
- **Voice announcements** - optional lap time narration with English voice preference
- **Countdown timer** (3-2-1-GO!) before race start
- **Best lap celebration** with visual and audio feedback

### 📊 Data & Sharing
- **Export to CSV** for analysis
- **Share results** via native share or clipboard
- **Session history** with race summaries
- **Auto-recovery** - resume interrupted races after page refresh
- **Local storage** - your data stays on your device

### ⚡ Performance Optimizations
- **Memoized components** - React.memo for efficient re-renders
- **Cached calculations** - useMemo for expensive operations
- **Optimized speed formatting** - Map-based caching
- **Smart outlier detection** - IQR-based filtering for accurate statistics

---

## 🚀 Quick Start

### Option 1: Use the Live App
Visit **[laptimer.lovable.app](https://laptimer.lovable.app)** and start timing!

### Option 2: Run Locally

```bash
# Clone the repository
git clone https://github.com/yourusername/scalextric-lap-timer.git

# Navigate to the project
cd scalextric-lap-timer

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📖 How to Use

### Setup
1. **Position your phone/camera** above the finish line, pointing down
2. **Grant camera permission** when prompted
3. **Adjust the ROI boxes** to cover the finish line area for each lane
4. Use **Auto-Calibrate** to set the optimal detection threshold
5. **Set track length** (0.1m - 50m) for accurate speed calculations

### Racing
1. Select your **race mode** (Free/Laps/Time)
2. Configure **lap count** or **time limit** as needed
3. Press **Start** - a 3-2-1 countdown will begin
4. Race! Laps are automatically detected and timed
5. Press **Stop** when done - results are saved automatically

### Tips for Best Detection
- Ensure **good lighting** on the track
- Position ROI boxes on a **contrasting area** (e.g., white finish line)
- Make ROI boxes **as small as possible** while still covering the lane
- Use **Debug mode** to see detection scores in real-time
- Adjust **Threshold** if you get false positives or missed detections
- **Outlier filtering** automatically excludes crash/off-track times from charts

---

## 🛠️ Technology Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with memo optimization |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Styling with design tokens |
| **shadcn/ui** | UI components |
| **Recharts** | Lap time charts with outlier filtering |
| **Web APIs** | Camera, Wake Lock, Vibration, Speech Synthesis |

---

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome (Android) | ✅ Full support |
| Safari (iOS) | ✅ Full support |
| Chrome (Desktop) | ✅ Full support |
| Firefox | ✅ Full support |
| Edge | ✅ Full support |

> **Note:** Camera access requires HTTPS or localhost

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

---

<div align="center">

**Made with ❤️ for slot car enthusiasts**

⭐ Star this repo if you find it useful!

</div>
