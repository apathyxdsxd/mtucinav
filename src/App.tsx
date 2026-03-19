import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavigatePage from './pages/NavigatePage';
import QRCodesPage from './pages/QRCodesPage';

function Background() {
  return (
    <div className="page-bg">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Background />
      <div className="page-content">
        <Routes>
          <Route path="/" element={<NavigatePage />} />
          <Route path="/qrcodes" element={<QRCodesPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
