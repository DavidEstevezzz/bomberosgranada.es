import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UsuariosApiService from "../services/UsuariosApiService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faEdit,
    faInfoCircle,
    faEllipsisH,
} from "@fortawesome/free-solid-svg-icons";
import EditUserModal from "../components/editUserModal";
import AddUserModal from "../components/addUserModal";
import RequirementModal from "../components/RequirementModal";
import { useDarkMode } from "../contexts/DarkModeContext";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);
    const { darkMode } = useDarkMode();
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await UsuariosApiService.getUsuarios();
            if (response.data) {
                setUsers(response.data);
                setError(null);
            } else {
                throw new Error("No user data returned from the API");
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setError("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleRoleFilterChange = (event) => {
        setRoleFilter(event.target.value);
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleAddUserClick = () => {
        setIsAddModalOpen(true);
    };

    const handleRequireClick = (user) => {
        setSelectedUser(user);
        setIsRequirementModalOpen(true);
    };

    const handleUpdateUser = async (updatedUser) => {
        try {
            const response = await UsuariosApiService.updateUsuario(
                updatedUser.id_empleado,
                updatedUser,
            );
            setUsers((prev) =>
                prev.map((user) =>
                    user.id_empleado === updatedUser.id_empleado
                        ? response.data
                        : user,
                ),
            );
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Failed to update user:", error);
            if (error.response && error.response.data) {
                alert(
                    "Error: " + Object.values(error.response.data).join("\n"),
                );
            }
        }
    };

    const handleAddUser = async (newUser) => {
        try {
            fetchUsers();
            setIsAddModalOpen(false);
        } catch (error) {
            if (error.response && error.response.data) {
                alert(
                    "Error: " + Object.values(error.response.data).join("\n"),
                );
            }
        }
    };

    const handleDetailClick = (user) => {
        navigate(`/users/${user.id_empleado}`);
    };

    const normalizeString = (str) => {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    };

    const filteredUsers = users.filter((user) => {
        const normalizedSearchTerm = normalizeString(searchTerm);
        return (
            (normalizeString(user.nombre).includes(normalizedSearchTerm) ||
                normalizeString(user.apellido).includes(normalizedSearchTerm) ||
                normalizeString(user.email).includes(normalizedSearchTerm) ||
                normalizeString(user.telefono).includes(
                    normalizedSearchTerm,
                )) &&
            (roleFilter === "" || user.role_name === roleFilter)
        );
    });

    const uniqueRoles = [...new Set(users.map((user) => user.role_name))];

    const cardContainerClass = `min-h-[calc(100vh-6rem)] w-full mx-auto max-w-full overflow-hidden rounded-3xl border shadow-xl backdrop-blur transition-colors duration-300 ${
  darkMode ? 'border-slate-800 bg-slate-900/80 text-slate-100' : 'border-slate-200 bg-white/90 text-slate-900'
}`;
    const sectionCardClass = `rounded-2xl border px-5 py-6 transition-colors ${
        darkMode
            ? "border-slate-800 bg-slate-900/60"
            : "border-slate-200 bg-slate-50/70"
    }`;
    const subtleTextClass = darkMode ? "text-slate-300" : "text-slate-600";
    const inputBaseClass = `w-full rounded-2xl border px-4 py-3 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 ${
        darkMode
            ? "border-slate-700 bg-slate-900/60 text-slate-100 placeholder-slate-400"
            : "border-slate-200 bg-white text-slate-900 placeholder-slate-500"
    }`;
    const actionButtonBaseClass = `inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 ${
        darkMode ? "focus:ring-offset-slate-900" : "focus:ring-offset-white"
    }`;

    if (loading) {
        return (
                <div
                    className={`${cardContainerClass} flex items-center justify-center py-16`}
                >
                    <p className="text-sm font-medium">Cargando usuarios...</p>
                </div>
        );
    }

    if (error) {
        return (
                <div
                    className={`${cardContainerClass} flex items-center justify-center py-16`}
                >
                    <p className="text-sm font-semibold text-red-500">
                        Error: {error}
                    </p>
                </div>
        );
    }

    return (
        <>
      
            <div className={cardContainerClass}>
                <div
                    className={`bg-gradient-to-r px-8 py-10 text-white transition-colors duration-300 ${
                        darkMode
                            ? "from-primary-900/90 via-primary-700/90 to-primary-500/80"
                            : "from-primary-400 via-primary-500 to-primary-600"
                    }`}
                >
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
                        Gestión de personal
                    </p>
                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold">Usuarios</h1>
                            <p
                                className={`mt-2 max-w-2xl text-sm ${
                                    darkMode ? "text-white/80" : "text-slate-800/80"
                                }`}
                            >
                                Consulta y administra la información de todos
                                los usuarios del sistema.
                            </p>
                        </div>
                        <button
                            onClick={handleAddUserClick}
                            className={`${actionButtonBaseClass} ${
                                darkMode
                                    ? "bg-primary-500/90 text-white hover:bg-primary-400"
                                    : "bg-primary-500 text-white hover:bg-primary-600"
                            }`}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            <span>Añadir usuario</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-8 px-6 py-8 sm:px-10">
                    <div className={sectionCardClass}>
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex-1 space-y-2">
                                <label
                                    htmlFor="search"
                                    className={`text-sm font-medium ${subtleTextClass}`}
                                >
                                    Buscar por nombre, apellidos, email o
                                    teléfono
                                </label>
                                <div className="relative">
                                    <input
                                        id="search"
                                        type="text"
                                        placeholder="Buscar usuarios"
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className={inputBaseClass}
                                    />
                                    <FontAwesomeIcon
                                        icon={faEllipsisH}
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 text-base ${subtleTextClass}`}
                                    />
                                </div>
                            </div>
                            <div className="w-full space-y-2 lg:w-64">
                                <label
                                    htmlFor="role"
                                    className={`text-sm font-medium ${subtleTextClass}`}
                                >
                                    Filtrar por rol
                                </label>
                                <select
                                    id="role"
                                    value={roleFilter}
                                    onChange={handleRoleFilterChange}
                                    className={inputBaseClass}
                                >
                                    <option value="">Todos los roles</option>
                                    {uniqueRoles.map((role) => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <p className={`mt-4 text-sm ${subtleTextClass}`}>
                            Mostrando{" "}
                            <span className="font-semibold text-primary-500">
                                {filteredUsers.length}
                            </span>{" "}
                            de{" "}
                            <span className="font-semibold">
                                {users.length}
                            </span>{" "}
                            usuarios registrados
                        </p>
                    </div>

                    <div className={sectionCardClass}>
                        {filteredUsers.length > 0 ? (
                            <div
                                className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${
                                    darkMode
                                        ? "border-slate-800 bg-slate-950/60"
                                        : "border-slate-200 bg-white"
                                }`}
                            >
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                                        <thead
                                            className={
                                                darkMode
                                                    ? "bg-slate-900/60"
                                                    : "bg-slate-50"
                                            }
                                        >
                                            <tr>
                                                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                                    Usuario
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                                    Rol
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                                    Teléfono
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                                    Puesto
                                                </th>
                                                <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                            {filteredUsers.map((user) => {
                                                const userName =
                                                    user.nombre || "";
                                                const userInitial = userName
                                                    .charAt(0)
                                                    .toUpperCase();
                                                return (
                                                    <tr
                                                        key={user.id_empleado}
                                                        className={
                                                            darkMode
                                                                ? "hover:bg-slate-900/60"
                                                                : "hover:bg-slate-50/80"
                                                        }
                                                    >
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-4">
                                                                <div
                                                                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-base font-semibold text-white shadow-inner ${
                                                                        darkMode
                                                                            ? "bg-primary-500/90"
                                                                            : "bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600"
                                                                    }`}
                                                                >
                                                                    {
                                                                        userInitial
                                                                    }
                                                                </div>
                                                                <div>
                                                                    <p className="text-base font-semibold">
                                                                        {
                                                                            user.nombre
                                                                        }{" "}
                                                                        {
                                                                            user.apellido
                                                                        }
                                                                    </p>
                                                                    <p
                                                                        className={`mt-1 text-sm ${subtleTextClass}`}
                                                                    >
                                                                        {
                                                                            user.email
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5 text-base font-medium">
                                                            {user.role_name}
                                                        </td>
                                                        <td className="px-6 py-5 text-base font-medium">
                                                            {user.telefono ||
                                                                "Sin especificar"}
                                                        </td>
                                                        <td className="px-6 py-5 text-base font-medium">
                                                            {user.puesto ||
                                                                "Sin especificar"}
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-wrap items-center justify-end gap-3">
                                                                <button
                                                                    onClick={() =>
                                                                        handleEditClick(
                                                                            user,
                                                                        )
                                                                    }
                                                                    className={`${actionButtonBaseClass} ${
                                                                        darkMode
                                                                            ? "bg-primary-500/80 text-white hover:bg-primary-400"
                                                                            : "bg-primary-500 text-white hover:bg-primary-600"
                                                                    }`}
                                                                >
                                                                    <FontAwesomeIcon
                                                                        icon={
                                                                            faEdit
                                                                        }
                                                                    />
                                                                    <span>
                                                                        Editar
                                                                    </span>
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleRequireClick(
                                                                            user,
                                                                        )
                                                                    }
                                                                    className={`${actionButtonBaseClass} ${
                                                                        darkMode
                                                                            ? "bg-emerald-500/80 text-white hover:bg-emerald-400"
                                                                            : "bg-emerald-500 text-white hover:bg-emerald-600"
                                                                    }`}
                                                                >
                                                                    <span>
                                                                        Requerir
                                                                    </span>
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleDetailClick(
                                                                            user,
                                                                        )
                                                                    }
                                                                    className={`${actionButtonBaseClass} ${
                                                                        darkMode
                                                                            ? "bg-slate-800 text-slate-100 hover:bg-slate-700"
                                                                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                                    }`}
                                                                >
                                                                    <FontAwesomeIcon
                                                                        icon={
                                                                            faInfoCircle
                                                                        }
                                                                    />
                                                                    <span>
                                                                        Detalle
                                                                    </span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                                <p className="text-base font-semibold">
                                    No se encontraron usuarios con los filtros
                                    seleccionados.
                                </p>
                                <p className={`text-sm ${subtleTextClass}`}>
                                    Ajusta los criterios de búsqueda o
                                    restablece los filtros para ver todos los
                                    registros.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modales */}
            {selectedUser && (
                <EditUserModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    user={selectedUser}
                    onUpdate={handleUpdateUser}
                />
            )}
            <AddUserModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddUser}
            />

            {selectedUser && (
                <RequirementModal
                    isOpen={isRequirementModalOpen}
                    onClose={() => setIsRequirementModalOpen(false)}
                    employee={selectedUser}
                />
            )}
        </>
    );
};

export default Users;
