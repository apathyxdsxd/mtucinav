import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavigatePage from './pages/NavigatePage';
import QRCodesPage from './pages/QRCodesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NavigatePage />} />
        <Route path="/qrcodes" element={<QRCodesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
