import { formatCityLabel } from './formatCityLabel';
import { formatPersonNameInitials } from './formatPersonNameInitials';

// Интерфейс для входящих данных из API
interface RawApplication {
    id: number;
    position: string;
    city: string;
    created_at?: string;
    dateStart: string;
    dateWork: string;
    status: { id: number; name: string } | null;
    client: { id: number; name: string } | null;
    executor: { id: number; name: string; role: { id: number; name: string } } | null;
    vacancy?: { id: number; name: string } | null; // vacancy опционально, так как не используется
    responsible?: { id: number; name: string } | null;
}

// Интерфейс для целевых данных (после маппинга)
interface Application {
    id: number;
    title: string;
    region: string;
    createdAt: string;
    closeDate: string;
    status: string;
    customer: string;
    executor: string;
    responsible: string;
    candidates: string;
}
interface Pagination {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
    links: any[];
}

interface ApiResponse {
    message: string;
    data: {
        current_page: number;
        data: RawApplication[];
        first_page_url: string;
        from: number;
        last_page: number;
        last_page_url: string;
        links: any[];
        next_page_url: string | null;
        path: string;
        per_page: number;
        prev_page_url: string | null;
        to: number;
        total: number;
    };
}

export async function fetchApplications(page = 1, params = '') {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;
    params = params != '' ?  `&${params}` : ''

    try {
        const response: ApiResponse = await $fetch(`${config.public.apiBase}/applications?page=${page}${params}`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${authToken}`,
                'X-Auth-User': `${authUser}`
            }
        });

        console.log('Success - 200:', response);
        // Проверяем, что response.data существует и это массив
        if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
            throw new Error('Данные заявок не найдены или имеют неверный формат');
        }

        const applications: Application[] = response.data.data.map((application: RawApplication) => ({
            id: application.id,
            title: application.position,
            region: formatCityLabel(application.city),
            createdAt: application.created_at ?? '',
            closeDate: application.dateWork,
            status: application.status?.name ?? 'Не указан',
            customer: application.client?.name
                ? formatPersonNameInitials(application.client.name)
                : '—',
            executor: application.executor?.name ?? null,
            responsible: application.responsible?.name ?? 'Не указан', // Временное значение
            candidates: '0', // Временное значение
        }));

        const pagination: Pagination = {
            current_page: response.data.current_page,
            total: response.data.total,
            per_page: response.data.per_page,
            last_page: response.data.last_page,
            links: response.data.links,
        }

        return { applications, pagination };
    } catch (error: any) {
        if (error.response.status === 401) {
            alert('Ваша сессия истекла! Пожалуйста, авторизуйтесь снова.');
            useRouter().replace('/auth');
        } else {
            console.error('Ошибка при получении списка заявок:', error);
        }
        throw error;
    }
}