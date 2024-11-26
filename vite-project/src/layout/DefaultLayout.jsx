import { Navigate, Outlet } from "react-router-dom";
import { useStateContext } from "../contexts/ContextProvider";
import { useDarkMode } from '../contexts/DarkModeContext';
import { useEffect, useState } from "react";
import UsuariosApiService from '../services/UsuariosApiService';
import LogApiService from "../services/LogApiService";
import Aside from "../components/aside";
import Header from "../components/header";


export default function DefaultLayout() {
    const { user, token, setUser, setToken } = useStateContext();
    const [isAsideOpen, setIsAsideOpen] = useState(true);
    const { darkMode } = useDarkMode();


    const toggleAside = () => {
        setIsAsideOpen(!isAsideOpen);
    };

    const onLogout = async (ev) => {
        ev.preventDefault();
        if (!user) {
            console.error("No user data available for logout.");
            return;
        }

        try {
            await LogApiService.logoutUser(user);
            setUser({});
            setToken(null);
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    useEffect(() => {
        if (!token) {
            console.log("No token available, unable to fetch user data.");
            return;
        }

        const fetchUserData = async () => {
            try {
                const response = await UsuariosApiService.getUserByToken();
                if (response && response.data) {
                    setUser(response.data);
                } else {
                    throw new Error("No user data received");
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
            }
        };

        fetchUserData();
    }, [setUser, token]);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex flex-col h-screen">
            <Header toggleAside={toggleAside} onLogout={onLogout} user={user} />
            <div className="flex flex-1 overflow-hidden">
                {isAsideOpen && <Aside />}
                <main className={`flex-1 p-6 overflow-auto ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}