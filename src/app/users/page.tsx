import { getUsers } from '@/app/actions/users';
import { UserList } from '@/components/users/UserList';

export const metadata = {
    title: 'Gestión de Usuarios | HiFi Market',
};

export default async function UsersPage() {
    const { success, data } = await getUsers();
    const users = success ? data : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
                <p className="text-sm text-slate-500">Gestión de acceso y roles del sistema.</p>
            </div>

            <UserList initialUsers={users || []} />
        </div>
    );
}
