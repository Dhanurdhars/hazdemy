import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './styles.css';
import Layout from './components/Layout';
import Home from './pages/Home';
import Training from './pages/Training';
import Course from './pages/Course';
import Paths from './pages/Paths';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import { About, Careers, Services } from './pages/Info';
import Admin from './pages/Admin';
import { loadCatalog } from './data/catalog';
import Privacy from './pages/Privacy'

await loadCatalog();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="training" element={<Training />} />
          <Route path="course/:code" element={<Course />} />
          <Route path="paths" element={<Paths />} />
          <Route path="services" element={<Services />} />
          <Route path="about" element={<About />} />
          <Route path="careers" element={<Careers />} />
          <Route path="contact" element={<Contact />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
