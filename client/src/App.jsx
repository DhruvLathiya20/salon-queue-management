import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/common/Navbar';
import { HomePage } from './pages/HomePage';
import { JoinQueuePage } from './pages/JoinQueuePage';
import { MyStatusPage } from './pages/MyStatusPage';
import { ReceptionPage } from './pages/ReceptionPage';
import { BarberPage } from './pages/BarberPage';
import { DisplayPage } from './pages/DisplayPage';
import { AdminPage } from './pages/AdminPage';

const AppContent = () => {
  const location = useLocation();
  // Hide standard navbar on fullscreen TV display
  const isDisplayPage = location.pathname === '/display';

  return (
    <div className="min-h-screen bg-salon-dark text-salon-textPrimary flex flex-col">
      {!isDisplayPage && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/join" element={<JoinQueuePage />} />
          <Route path="/status/:id" element={<MyStatusPage />} />
          <Route path="/reception" element={<ReceptionPage />} />
          <Route path="/barber/:name" element={<BarberPage />} />
          <Route path="/display" element={<DisplayPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <SocketProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </SocketProvider>
    </LanguageProvider>
  );
}
