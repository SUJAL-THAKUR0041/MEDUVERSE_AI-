# Meduverse AI

A comprehensive AI-powered healthcare and educational platform built with React and Vite.

## 🚀 Features

### Health Management
- **Health Analytics**: Track and analyze health metrics with interactive charts
- **Medical Assistant**: AI-powered medical consultation and advice
- **Medication Reminders**: Smart reminder system for medication schedules
- **Health Insights**: Personalized health recommendations and insights
- **Medical Journal**: Keep track of medical history and notes
- **Health Profile**: Comprehensive health profile management

### Educational Tools
- **Educational Assistant**: AI-powered learning support
- **Study Hub**: Organized study materials and resources
- **Learning Paths**: Structured learning journeys
- **Material Viewer**: Interactive study material viewer

### Additional Features
- **Task Management**: Organize and track daily tasks
- **Hospital Finder**: Locate nearby healthcare facilities
- **Doctor Network**: Connect with healthcare professionals
- **Telemedicine**: Virtual consultation capabilities
- **AI Chat Assistant**: Powered by Groq AI for intelligent conversations

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS, Radix UI
- **Maps**: Leaflet, React-Leaflet
- **Charts**: Recharts
- **AI**: Groq API (Llama 3.3)
- **State Management**: React Query
- **Routing**: React Router DOM
- **Animations**: Framer Motion

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd meduverse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Add your Groq API key:
     ```
     VITE_GROQ_API_KEY=your_groq_api_key_here
     ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 Configuration

### API Keys
- **Groq API**: Get your API key from [Groq Console](https://console.groq.com/)
- Add `VITE_GROQ_API_KEY` to your environment variables

### Build Configuration
The app uses Vite for building. Configuration can be found in `vite.config.js`.

## 📱 Usage

### Local Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
npm run preview
```

## 🚀 Deployment

### Vercel (Recommended)
1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd Meduverse
   vercel
   ```

3. **Set Environment Variables**
   In Vercel dashboard, add:
   - `VITE_GROQ_API_KEY`: Your Groq API key

4. **Vercel Configuration**
   The `vercel.json` file is configured with:
   - Build command: `npm run build`
   - Output directory: `dist`
   - SPA routing support for React Router

### Other Platforms
The app can be deployed to any static hosting service:
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting

## 📁 Project Structure

```
Meduverse/
├── public/
├── src/
│   ├── api/
│   │   ├── groq.js          # AI API integration
│   │   ├── localStorage.js  # Local storage utilities
│   │   └── mockAuth.js      # Authentication mock
│   ├── components/
│   │   ├── Assistant/       # AI chat components
│   │   ├── Health/          # Health-related components
│   │   ├── Study/           # Educational components
│   │   └── ui/              # Reusable UI components
│   ├── entities/            # Data models/schemas
│   ├── pages/               # Application pages
│   ├── App.jsx              # Main app component
│   ├── Layout.jsx           # App layout
│   ├── main.jsx             # App entry point
│   └── utils.js             # Utility functions
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind CSS config
├── vite.config.js           # Vite configuration
└── README.md                # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Groq](https://groq.com/) for AI API
- [Vercel](https://vercel.com/) for hosting platform
- [React](https://reactjs.org/) community
- [Tailwind CSS](https://tailwindcss.com/) for styling

## 📞 Support

For support, email support@meduverse.com or join our Discord community.

## 🔄 Updates

Stay tuned for regular updates and new features!

---

**Made with ❤️ for better healthcare and education**
