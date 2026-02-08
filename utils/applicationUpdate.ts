interface Application {
    id: number;
    created_at: string;
    updated_at: string;
    position: string;
    division: string;
    count: number;
    salaryFrom: number;
    salaryTo: number;
    currency: string;
    require: string;
    duty: string;
    reason: string;
    dateStart: string;
    dateWork: string;
    city: string;
    client: { id: number; name: string } | null;
    vacancy: { id: number; name: string } | null;
    status: { id: number; name: string } | null;
    executor: { id: number; name: string, role: { id: number; name: string } } | null;
}

interface NotData {
    'message': string;
}


export async function fetchApplicationUpdate(data: any, id: number) {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;

    try {
        const response: Application | NotData= await $fetch(`${config.public.apiBase}/applications/${id}`, {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${authToken}`,
                'X-Auth-User': `${authUser}`,
                
            },
            body: data
        });

           console.log('fetch in update', response);
        if (!response || typeof response !== 'object' || Array.isArray(response)) {
            throw new Error('Response is not a valid Application object');
        }
        
        return response;
    } catch (error) {
        console.error('Missed data. Error occured:', error);
        throw error;
    }
}

export async function fetchVacancyUpdate(data: any, id: number) {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;

    try {
        const response = await $fetch(`${config.public.apiBase}/vacancies/${id}`, {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${authToken}`,
                'X-Auth-User': `${authUser}`,
            },
            body: data
        });

        console.log('fetch vacancy update', response);
        if (!response || typeof response !== 'object' || Array.isArray(response)) {
            throw new Error('Response is not a valid Vacancy object');
        }
        
        return { data: response, error: null };
    } catch (error: any) {
        console.error('Vacancy update error:', error);
        return { 
            data: null, 
            error: error.response?._data?.message || error.message || 'Ошибка при обновлении вакансии' 
        };
    }
}