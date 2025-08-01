import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Navbar */}
        <nav className="bg-gray-800 shadow-md sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <ul className="flex justify-center space-x-8 py-4">
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    isActive
                      ? 'text-cyan-400 font-bold text-lg border-b-2 border-cyan-400 pb-1'
                      : 'text-gray-300 hover:text-white transition-colors duration-200 text-lg'
                  }
                  end
                >
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/checkin"
                  className={({ isActive }) =>
                    isActive
                      ? 'text-cyan-400 font-bold text-lg border-b-2 border-cyan-400 pb-1'
                      : 'text-gray-300 hover:text-white transition-colors duration-200 text-lg'
                  }
                >
                  Check-In Vehicle
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-grow overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/checkin" element={<CheckIn />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;