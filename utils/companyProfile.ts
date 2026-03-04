const getAuthHeaders = () => {
  const authToken = useCookie('auth_token').value;
  const authUser = useCookie('auth_user').value;
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${authToken}`,
    'X-Auth-User': `${authUser}`,
  };
};

export const getCompanyProfile = async () => {
  const config = useRuntimeConfig();
  try {
    const response = await $fetch<{ message: string; data: { name?: string; site?: string; company_description?: string; logo?: string; logo_url?: string | null } }>(
      `${config.public.apiBase}/company-profile`,
      { headers: getAuthHeaders() }
    );
    return { data: response?.data ?? null, error: null };
  } catch (e: any) {
    return { data: null, error: e?.data?.message || e?.message || 'Ошибка загрузки' };
  }
};

export const updateCompanyProfile = async (payload: {
  name?: string;
  site?: string;
  company_description?: string;
  logo?: File | null;
  removeLogo?: boolean;
}) => {
  const config = useRuntimeConfig();
  const formData = new FormData();
  if (payload.name !== undefined) formData.append('name', payload.name);
  if (payload.site !== undefined) formData.append('site', payload.site);
  if (payload.company_description !== undefined) formData.append('company_description', payload.company_description);
  if (payload.logo instanceof File) formData.append('logo', payload.logo);
  if (payload.removeLogo) formData.append('remove_logo', '1');

  try {
    const response = await $fetch<{ message: string; data: any }>(`${config.public.apiBase}/company-profile`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    return { data: response?.data ?? null, error: null };
  } catch (e: any) {
    return { data: null, error: e?.data?.message || e?.message || 'Ошибка сохранения' };
  }
};
