import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Shop from './components/Shop/Shop';
import AdminPanel from './components/Admin/AdminPanel';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shop />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}
