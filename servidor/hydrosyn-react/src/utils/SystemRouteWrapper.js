import { useParams, Navigate } from "react-router-dom";
import { RoleSystemProvider, useRoleSystem } from "./RoleSystemContext";


function ProtectedSystem({ children }) {
    const { role, loading } = useRoleSystem();

    if (loading) return <p></p>;

    if (role === "none") return <Navigate to="/dashboard" replace />;

    return children;
}

export function SystemRouteWrapper({ children }) {
    const { systemId } = useParams();

    return (
        <RoleSystemProvider systemId={systemId}>
            <ProtectedSystem>{children}</ProtectedSystem>
        </RoleSystemProvider>
    );
}
