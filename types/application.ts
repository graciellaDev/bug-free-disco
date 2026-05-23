export interface ApplicationHistoryEvent {
    id: string | number;
    eventTitle: string;
    eventContent: string;
    eventLogDateTime: string;
}

export interface Application {
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
    responsible?: { id: number; name: string; role?: { id: number; name: string } } | null;
    approvals?: Array<{
        id?: number;
        description?: string | null;
        executor_id?: number;
        status_id?: number;
        created_at?: string;
    }>;
    history?: ApplicationHistoryEvent[];
}