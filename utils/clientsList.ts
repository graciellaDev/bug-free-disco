interface Client {
    'id': number;
    'name': string;
    'email': string;
    'role': string;
    'role_id'?: number;
    'phone'?: string;
    'position'?: string;
    'city'?: string;
    'departmentName'?: string;
}

interface ApiResponseClientItem {
    id: number;
    name: string;
    email: string;
    role?: { id: number; name: string };
    role_id?: number;
    phone?: string;
    position?: string;
    city?: string;
    departments?: { id: number; name: string }[];
}

interface ApiResponseClients {
    'message': string;
    'data': ApiResponseClientItem[];
}

const ROLE_SECTION_ORDER: Record<string, string> = {
  'Администратор': 'Администраторы',
  'Рекрутер': 'Рекрутеры',
  'Заказчик': 'Заказчики',
  'Клиент': 'Заказчики', // в API роль приходит как «Клиент»
};

export async function clientsList(nameList: string = 'clients', getParams?: string) {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;

    try {
        const response: ApiResponseClients = await $fetch(`${config.public.apiBase}/customer-with-roles/${nameList}/?${getParams || ''}`, {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${authToken}`,
                'X-Auth-User': `${authUser}`
            }
        });
        const isEmployees = nameList === 'employees';
        const clients: Client[] = response.data.map((client: ApiResponseClientItem) => {
            const roleName = client.role?.name ?? '';
            const roleId = client.role?.id ?? client.role_id;
            const departmentName = client.departments?.[0]?.name;
            return {
                id: client.id,
                name: client.name,
                email: client.email,
                role: isEmployees ? roleName : (roleName || 'Менеджер'),
                ...(isEmployees && roleId !== undefined ? { role_id: roleId } : {}),
                ...(client.phone !== undefined ? { phone: client.phone } : {}),
                ...(client.position !== undefined ? { position: client.position } : {}),
                ...(client.city !== undefined ? { city: client.city } : {}),
                ...(departmentName !== undefined ? { departmentName } : {}),
            };
        });

        return { clients, errors: null };
    } catch (error) {
        console.error('Missed data. Error occured:', error);
        return { clients: [], errors: 'Ошибка получения списка' };
    }
}

/** Группировка списка по роли для разделов таблицы. Порядок: Администраторы, Рекрутеры, Заказчики. */
export function groupClientsByRoleSection(clients: Client[]): { sectionTitle: string; users: Client[] }[] {
    const byRole: Record<string, Client[]> = {};
    for (const c of clients) {
        const roleName = c.role || 'Рекрутер';
        const sectionTitle = ROLE_SECTION_ORDER[roleName] ?? roleName;
        if (!byRole[sectionTitle]) byRole[sectionTitle] = [];
        byRole[sectionTitle].push(c);
    }
    const order = ['Администраторы', 'Рекрутеры', 'Заказчики'];
    return order
        .filter((title) => byRole[title]?.length)
        .map((title) => ({ sectionTitle: title, users: byRole[title] }));
}