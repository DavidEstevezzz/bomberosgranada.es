import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faBell, faSignOutAlt, faTh, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import LogApiService from '../services/LogApiService';
import { useStateContext } from '../contexts/ContextProvider';
import { useDarkMode } from '../contexts/DarkModeContext';
import logo from '../assets/logo.png';

const Header = ({ toggleAside }) => {
  const navigate = useNavigate();
  const { user, setToken, setUser } = useStateContext(); 
  const { darkMode, toggleDarkMode } = useDarkMode();

  const handleLogout = async () => {
    try {
      await LogApiService.logoutUser();
      setUser(null); 
      setToken(null); 
      navigate('/login'); 
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <header className={`flex items-center justify-between p-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-200 text-black'}`}>
      <div className="flex items-center">
        <button onClick={toggleAside} className="text-gray-300 hover:text-white focus:outline-none">
          <FontAwesomeIcon icon={faBars} className="w-6 h-6" />
        </button>
        <img src={logo} alt="Flowbite Logo" className="w-8 h-8 ml-3" />
        <span className="text-2xl font-semibold ml-3">Bomberos GRX</span>
      </div>
      <div className="flex items-center space-x-4">
        
        <button onClick={handleLogout} className="text-gray-300 hover:text-white focus:outline-none">
          <FontAwesomeIcon icon={faSignOutAlt} className="w-6 h-6" />
        </button>
        <button onClick={toggleDarkMode} className="text-gray-300 hover:text-white focus:outline-none">
          <FontAwesomeIcon icon={darkMode ? faSun : faMoon} className="w-6 h-6" />
        </button>
        {user && ( 
          <Link to={`/users/${user.id_empleado}`}>
            <img
              src="https://via.placeholder.com/40"
              alt="User Avatar"
              className="w-10 h-10 rounded-full"
            />
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
