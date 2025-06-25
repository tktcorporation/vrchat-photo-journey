import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Screenshots from './components/Screenshots';
import Download from './components/Download';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="app">
      <Hero />
      <Features />
      <HowItWorks />
      <Screenshots />
      <Download />
      <Footer />
    </div>
  );
}

export default App;
