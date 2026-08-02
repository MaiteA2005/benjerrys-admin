import {
    getOrders
} from "../api/api.js";

const escapeHtml = (value = "") => {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
};

const formatPrice = (price) => {
    return new Intl.NumberFormat(
        "nl-BE",
        {
        style: "currency",
        currency: "EUR"
        }
    ).format(Number(price || 0));
};

const formatDate = (dateValue) => {
    if (!dateValue) {
        return "Onbekende datum";
    }

    return new Intl.DateTimeFormat(
        "nl-BE",
        {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
        }
    ).format(new Date(dateValue));
};

const getShortOrderId = (order) => {
    return order?._id
        ? order._id.slice(-6).toUpperCase()
        : "Onbekend";
};

const getTodayOrders = (orders) => {
    const today = new Date();

    return orders.filter((order) => {
        if (!order.createdAt) {
        return false;
        }

        const orderDate = new Date(
        order.createdAt
        );

        return (
        orderDate.getDate() ===
            today.getDate() &&
        orderDate.getMonth() ===
            today.getMonth() &&
        orderDate.getFullYear() ===
            today.getFullYear()
        );
    });
};

const getStatusCount = (
    orders,
    status
    ) => {
    return orders.filter(
        (order) => order.status === status
    ).length;
};

const calculateRevenue = (orders) => {
    return orders
        .filter(
        (order) =>
            order.status !== "geannuleerd"
        )
        .reduce(
        (total, order) =>
            total +
            Number(order.totalPrice || 0),
        0
        );
};

const renderRecentOrders = (orders) => {
    const recentOrders = [...orders]
        .sort(
        (firstOrder, secondOrder) =>
            new Date(secondOrder.createdAt) -
            new Date(firstOrder.createdAt)
        )
        .slice(0, 5);

    if (!recentOrders.length) {
        return `
        <div class="dashboard-empty">
            <p>
            Er zijn nog geen bestellingen.
            </p>
        </div>
        `;
    }

    return recentOrders
        .map(
        (order) => `
            <article class="recent-order">
            <div>
                <div class="recent-order__heading">
                <strong>
                    #${getShortOrderId(order)}
                </strong>

                <span
                    class="
                    status-badge
                    status-badge--${String(
                        order.status || ""
                    )
                        .toLowerCase()
                        .replaceAll(" ", "-")}
                    "
                >
                    ${escapeHtml(
                    order.status || "Onbekend"
                    )}
                </span>
                </div>

                <p class="recent-order__customer">
                ${escapeHtml(
                    order.customerName ||
                    "Onbekende klant"
                )}
                </p>

                <p class="recent-order__meta">
                ${formatDate(order.createdAt)}
                </p>
            </div>

            <strong class="recent-order__price">
                ${formatPrice(
                order.totalPrice
                )}
            </strong>
            </article>
        `
        )
        .join("");
};

export const renderDashboardPage =
    async (container) => {
        container.innerHTML = `
        <header class="admin-header">
            <div>
            <p class="adminSubtitle">
                Overzicht
            </p>

            <h1 class="adminTitle">
                Dashboard
            </h1>

            <p class="adminDescription">
                Bekijk in één oogopslag wat er
                gebeurt in de ice cream factory.
            </p>
            </div>

            <button
            id="dashboard-refreshButton"
            class="refreshButton"
            type="button"
            >
            Vernieuwen
            </button>
        </header>

        <div
            id="dashboard-content"
            class="dashboard-content"
        >
            <div class="loadingState">
            <div class="loadingSpinner"></div>

            <p>
                Dashboard laden...
            </p>
            </div>
        </div>
        `;

        const dashboardContent =
        container.querySelector(
            "#dashboard-content"
        );

        const refreshButton =
        container.querySelector(
            "#dashboard-refreshButton"
        );

        const loadDashboard = async () => {
        refreshButton.disabled = true;
        refreshButton.textContent =
            "Laden...";

        dashboardContent.innerHTML = `
            <div class="loadingState">
            <div class="loadingSpinner"></div>

            <p>
                Dashboard laden...
            </p>
            </div>
        `;

        try {
            const orders = await getOrders();

            const todayOrders =
            getTodayOrders(orders);

            const totalRevenue =
            calculateRevenue(orders);

            dashboardContent.innerHTML = `
            <section class="dashboard-statistics">
                <article
                class="
                    dashboard-stat-card
                    dashboard-stat-card--featured
                "
                >
                <span
                    class="dashboard-stat-card__label"
                >
                    Bestellingen vandaag
                </span>

                <strong
                    class="dashboard-stat-card__value"
                >
                    ${todayOrders.length}
                </strong>

                <span
                    class="dashboard-stat-card__detail"
                >
                    ${orders.length}
                    in totaal
                </span>
                </article>

                <article class="dashboard-stat-card">
                <span
                    class="dashboard-stat-card__label"
                >
                    Totale omzet
                </span>

                <strong
                    class="dashboard-stat-card__value"
                >
                    ${formatPrice(totalRevenue)}
                </strong>

                <span
                    class="dashboard-stat-card__detail"
                >
                    Zonder geannuleerde bestellingen
                </span>
                </article>

                <article class="dashboard-stat-card">
                <span
                    class="dashboard-stat-card__label"
                >
                    Te verwerken
                </span>

                <strong
                    class="dashboard-stat-card__value"
                >
                    ${getStatusCount(
                    orders,
                    "te verwerken"
                    )}
                </strong>

                <span
                    class="dashboard-stat-card__detail"
                >
                    Wachten op verwerking
                </span>
                </article>

                <article class="dashboard-stat-card">
                <span
                    class="dashboard-stat-card__label"
                >
                    In bereiding
                </span>

                <strong
                    class="dashboard-stat-card__value"
                >
                    ${getStatusCount(
                    orders,
                    "in bereiding"
                    )}
                </strong>

                <span
                    class="dashboard-stat-card__detail"
                >
                    Worden momenteel gemaakt
                </span>
                </article>

                <article class="dashboard-stat-card">
                <span
                    class="dashboard-stat-card__label"
                >
                    Klaar
                </span>

                <strong
                    class="dashboard-stat-card__value"
                >
                    ${getStatusCount(
                    orders,
                    "klaar"
                    )}
                </strong>

                <span
                    class="dashboard-stat-card__detail"
                >
                    Klaar voor verzending
                </span>
                </article>
            </section>

            <section class="dashboard-grid">
                <article class="dashboard-panel">
                <header
                    class="dashboard-panel__header"
                >
                    <div>
                    <p
                        class="dashboard-panel__eyebrow"
                    >
                        Activiteit
                    </p>

                    <h2>
                        Recente bestellingen
                    </h2>
                    </div>

                    <button
                    class="text-button"
                    type="button"
                    data-go-to-orders
                    >
                    Bekijk alles
                    </button>
                </header>

                <div class="recent-orders">
                    ${renderRecentOrders(
                    orders
                    )}
                </div>
                </article>

                <aside
                class="
                    dashboard-panel
                    dashboard-panel--summary
                "
                >
                <p
                    class="dashboard-panel__eyebrow"
                >
                    Statusoverzicht
                </p>

                <h2>
                    Bestelworkflow
                </h2>

                <div class="workflow-list">
                    <div class="workflow-item">
                    <span
                        class="
                        workflow-item__indicator
                        workflow-item__indicator--processing
                        "
                    ></span>

                    <span>
                        Te verwerken
                    </span>

                    <strong>
                        ${getStatusCount(
                        orders,
                        "te verwerken"
                        )}
                    </strong>
                    </div>

                    <div class="workflow-item">
                    <span
                        class="
                        workflow-item__indicator
                        workflow-item__indicator--preparing
                        "
                    ></span>

                    <span>
                        In bereiding
                    </span>

                    <strong>
                        ${getStatusCount(
                        orders,
                        "in bereiding"
                        )}
                    </strong>
                    </div>

                    <div class="workflow-item">
                    <span
                        class="
                        workflow-item__indicator
                        workflow-item__indicator--ready
                        "
                    ></span>

                    <span>
                        Klaar
                    </span>

                    <strong>
                        ${getStatusCount(
                        orders,
                        "klaar"
                        )}
                    </strong>
                    </div>

                    <div class="workflow-item">
                    <span
                        class="
                        workflow-item__indicator
                        workflow-item__indicator--sent
                        "
                    ></span>

                    <span>
                        Verzonden
                    </span>

                    <strong>
                        ${getStatusCount(
                        orders,
                        "verzonden"
                        )}
                    </strong>
                    </div>
                </div>
                </aside>
            </section>
            `;

            dashboardContent
            .querySelector(
                "[data-go-to-orders]"
            )
            ?.addEventListener(
                "click",
                () => {
                window.location.hash =
                    "orders";
                }
            );
        } catch (error) {
            console.error(error);

            dashboardContent.innerHTML = `
            <section class="errorState">
                <h2>
                Dashboard laden mislukt
                </h2>

                <p>
                ${escapeHtml(error.message)}
                </p>

                <button
                id="dashboard-retry-button"
                class="button buttonPrimary"
                type="button"
                >
                Opnieuw proberen
                </button>
            </section>
            `;

            dashboardContent
            .querySelector(
                "#dashboard-retry-button"
            )
            ?.addEventListener(
                "click",
                loadDashboard
            );
        } finally {
            refreshButton.disabled = false;
            refreshButton.textContent =
            "Vernieuwen";
        }
        };

        refreshButton.addEventListener(
        "click",
        loadDashboard
        );

        await loadDashboard();
    };