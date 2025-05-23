// utils/fetchCandidatesFull.ts

interface ApiResponse {
    data: {
        data: any[];
        total: number;
        current_page: number;
        last_page: number;
        per_page: number;
    };
}

export async function fetchCandidatesFull(page = 1) {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;

    try {
        const response: ApiResponse = await $fetch(`${config.public.apiBase}/candidates`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${authToken}`,
                'X-Auth-User': `${authUser}`
            },
            query: { page }
        });

        return {
            candidates: response?.data?.data || [],
            pagination: {
                total: response.data.total,
                currentPage: response.data.current_page,
                lastPage: response.data.last_page,
                perPage: response.data.per_page
            }
        };
    } catch (error: any) {
        if (error.response.status === 401) {
            alert('Ваша сессия истекла! Пожалуйста, авторизуйтесь снова.');
            useRouter().replace('/auth');
        } else {
            console.error('Ошибка при получении кандидатов:', error);
        }
        return {
            candidates: [],
            pagination: { total: 0, currentPage: 1, lastPage: 1, perPage: 15 }
        };
    }
}