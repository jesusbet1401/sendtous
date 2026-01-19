export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
                <p className="text-sm text-slate-500">Ajustes generales del sistema y preferencias de usuario.</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h2 className="text-lg font-medium text-slate-900 mb-4">Perfil</h2>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        La gestión de perfil y cambio de contraseña estará disponible próximamente.
                        Por ahora, contacta al administrador para cambios.
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h2 className="text-lg font-medium text-slate-900 mb-4">Sistema</h2>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        Versión del Sistema: 1.0.0
                    </p>
                </div>
            </div>
        </div>
    );
}
