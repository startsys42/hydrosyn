import { useParams, Navigate } from "react-router-dom";
import { RoleSystemProvider, useRoleSystem } from "./RoleSystemContext";

// Componente que valida el rol
function ProtectedSystem({ children }) {
    const { role, loading } = useRoleSystem();

    if (loading) return <p></p>;

    if (role === "none") return <Navigate to="/dashboard" replace />;

    return children; // owner o member
}

// Wrapper que envuelve provider + validación
export function SystemRouteWrapper({ children }) {
    const { systemId } = useParams();

    return (
        <RoleSystemProvider systemId={systemId}>
            <ProtectedSystem>{children}</ProtectedSystem>
        </RoleSystemProvider>
    );
}
