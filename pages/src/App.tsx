import Download from './components/Download';
import Features from './components/Features';
import Footer from './components/Footer';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Screenshots from './components/Screenshots';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
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
