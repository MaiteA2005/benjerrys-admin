const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    throw new Error(
        "VITE_API_URL is niet ingesteld. Voeg de API-URL toe aan je environment variables."
    );
}

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

export const getBases = () => {
    return fetchJson("/bases");
};

export const createBase = (baseData) => {
    return fetchJson("/bases", {
        method: "POST",

        headers: {
        "Content-Type": "application/json"
        },

        body: JSON.stringify(baseData)
    });
};

export const updateBase = (
    baseId,
    baseData
    ) => {
    return fetchJson(
        `/bases/${baseId}`,
        {
        method: "PUT",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(baseData)
        }
    );
};

export const deleteBase = (baseId) => {
    return fetchJson(`/bases/${baseId}`, {
        method: "DELETE"
    });
};

export const getFlavors = () => {
    return fetchJson("/flavors");
};

export const createFlavor = (flavorData) => {
    return fetchJson("/flavors", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify(flavorData)
    });
};

export const updateFlavor = (
    flavorId,
    flavorData
    ) => {
    return fetchJson(
        `/flavors/${flavorId}`,
        {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(flavorData)
        }
    );
};

export const deleteFlavor = (
    flavorId
    ) => {
    return fetchJson(
        `/flavors/${flavorId}`,
        {
        method: "DELETE"
        }
    );
};

export const getToppings = () => {
    return fetchJson("/toppings");
};

export const createTopping = (data) => {
    return fetchJson("/toppings", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
};

export const updateTopping = (
    id,
    data
    ) => {
    return fetchJson(`/toppings/${id}`, {
        method: "PUT",
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
};

export const deleteTopping = (id) => {
    return fetchJson(`/toppings/${id}`, {
        method: "DELETE"
    });
};