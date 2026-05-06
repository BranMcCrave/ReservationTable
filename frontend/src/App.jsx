import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import ReserveForm from './pages/ReserveForm.jsx';
import Confirmation from './pages/Confirmation.jsx';
import HostDashboard from './pages/HostDashboard.jsx';

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reserve" element={<ReserveForm />} />
          <Route path="/confirmation/:id" element={<Confirmation />} />
          <Route path="/host" element={<HostDashboard />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </div>
  );
}
