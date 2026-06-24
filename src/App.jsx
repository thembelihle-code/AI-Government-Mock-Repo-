import { Routes, Route, Navigate } from 'react-router-dom';
import { CitizenServicesPage } from './pages/Citizen/CitizenServicesPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/citizen" replace />} />
      <Route path="/citizen" element={<CitizenServicesPage />} />
    </Routes>
  );
}