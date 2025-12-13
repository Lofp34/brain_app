interface RequestOptions extends RequestInit {
    token?: string;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (options.token) {
        headers.Authorization = `Bearer ${options.token}`;
    }

    const response = await fetch(path, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        const message = data?.error || 'Request failed';
        throw new Error(message);
    }

    return data as T;
}
