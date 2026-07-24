const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

const fetchJson = async (
    endpoint,
    options = {}
    ) => {
    const response = await fetch(
        `${API_URL}${endpoint}`,
        options
    );

    if (!response.ok) {
        const errorData = await response
        .json()
        .catch(() => ({}));

        throw new Error(
        errorData.message ||
            `Request mislukt met status ${response.status}`
        );
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
};

export const getOrders = () => {
    return fetchJson("/orders");
};

export const updateOrderStatus = (
    orderId,
    status
    ) => {
    return fetchJson(
        `/orders/${orderId}/status`,
        {
        method: "PATCH",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            status
        })
        }
    );
};

export const deleteOrder = (
    orderId
    ) => {
    return fetchJson(`/orders/${orderId}`, {
        method: "DELETE"
    });
};