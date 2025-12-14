interface Executor {
    'id': number;
    'name': string;
    'role': string;
}

interface Team {
    'id': number;
    'name': string;
    'email': string;
    'role': string;
}

interface Division {
    'id': number;
    'department_id': number;
    'division': string;
}

interface ApiExecutor {
    'id': number;
    'name': string;
    'email': string;
    'role': {
        'id': number,
        'name': string
    };
}

interface ApiTeam {
    'id': number;
    'name': string;
    'email': string;
    'role': {
        'id': number,
        'name': string
    };
}

interface ApiDepartment {
    'id': number,
    'name': string,
    'divisions': Array<Division>
}


interface ApiResponseExecutors {
    'message': string;
    'data': [ApiExecutor];
}

interface ApiResponseTeam {
    'message': string;
    'data': [ApiTeam];
}

interface ApiResponseDepartments {
    'message'?: string;
    'data'?: [ApiDepartment];
}

export async function  executorsList() {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;

    const response: ApiResponseExecutors = await $fetch(`${config.public.apiBase}/customer-with-roles/recruiters`, {
    // const response: ApiResponseExecutors = await $fetch(`${config.public.apiBase}/executors/`, {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${authToken}`,
             'X-Auth-User': `${authUser}`
        }
    });

    if (!response.data || !response.data || !Array.isArray(response.data)) {
        throw new Error('Данные исполнителей не найдены или имеют неверный формат');
    }

    const executors: Executor[] = response.data.map((executor: ApiExecutor) => ({
            id: executor.id,
            name: executor.name,
            role: executor.role.name 
        }));

        return { executors };
};

export async function  getDepartments(divisions: boolean = false) {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;

    const response: ApiResponseDepartments = await $fetch(`${config.public.apiBase}/departments`, {
    // const response: ApiResponseExecutors = await $fetch(`${config.public.apiBase}/executors/`, {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${authToken}`,
             'X-Auth-User': `${authUser}`
        }
    });

    if (!response.data || !response.data || !Array.isArray(response.data)) {
        throw new Error('Данные исполнителей не найдены или имеют неверный формат');
    }

    if (divisions) {
        return response.data;
    }
    const departments: Array<any> = [];
     if (response.data.length > 0) {
        response.data.map((item: any) => {
            if (item.divisions.length > 0) {
                item.divisions.map((department: any) => {
                    departments.push({
                        id: department.id,
                        name: department.division,
                        role: item.name
                    })
                })
            }       
        })
     }

    return departments;
};

export async function  responsiblesList() {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;

    const response: ApiResponseExecutors = await $fetch(`${config.public.apiBase}/customer-with-roles/responsibles`, {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${authToken}`,
             'X-Auth-User': `${authUser}`
        }
    });

    if (!response.data || !response.data || !Array.isArray(response.data)) {
        throw new Error('Данные исполнителей не найдены или имеют неверный формат');
    }

    const responsibles: Executor[] = response.data.map((executor: ApiExecutor) => ({
            id: executor.id,
            name: executor.name,
            role: executor.role.name 
        }));

        return responsibles;
};

export async function  employeesList() {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;

    const response: ApiResponseExecutors = await $fetch(`${config.public.apiBase}/customer-with-roles/employees`, {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${authToken}`,
             'X-Auth-User': `${authUser}`
        }
    });

    if (!response.data || !response.data || !Array.isArray(response.data)) {
        throw new Error('Данные исполнителей не найдены или имеют неверный формат');
    }

    const employees: Executor[] = response.data.map((executor: ApiExecutor) => ({
            id: executor.id,
            name: executor.name,
            email: executor.email,
            role: executor.role.name 
        }));

        return employees;
};

export async function  teamList(id: string) {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;

    const response: ApiResponseTeam = await $fetch(`${config.public.apiBase}/team/${id}`, {
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${authToken}`,
             'X-Auth-User': `${authUser}`
        }
    });

    if (!response.data || !response.data || !Array.isArray(response.data)) {
        throw new Error('Данные команды не найдены или имеют неверный формат');
    }

    const employees: Team[] = response.data.map((executor: ApiTeam) => ({
            id: executor.id,
            name: executor.name,
            email: executor.email,
            role: executor.role.name 
        }));

        return employees;
}

export async function removeFromTeam(id: string | number, customerId: number) {
    const config = useRuntimeConfig();
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;

    if (!authToken || !authUser) {
        return { data: null, error: 'Токен авторизации не найден' };
    }

    const params = new URLSearchParams();
    params.append('customer_id', String(customerId));

    try {
        const response = await $fetch(`${config.public.apiBase}/team/${id}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${authToken}`,
                'X-Auth-User': `${authUser}`
            },
            body: params.toString()
        });

        return { data: response, error: null };
    } catch (err: any) {
        console.error('Ошибка при удалении сотрудника из команды:', err);
        
        if (err.response?.status === 401) {
            return { data: null, error: 'Срок сессии истек. Пожалуйста, авторизуйтесь снова.' };
        }

        if (err.response?.status === 422) {
            const validationErrors = err.response._data?.errors || err.response._data?.message;
            return { data: null, error: validationErrors || 'Ошибка валидации данных' };
        }

        return { data: null, error: err.response?._data?.message || 'Ошибка при удалении сотрудника из команды' };
    }
}
    