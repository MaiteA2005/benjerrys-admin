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

        const orderDate =
            new Date(order.createdAt);

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
        (order) =>
            order.status === status
    ).length;
};

const calculateRevenue = (orders) => {
    return orders
        .filter(
            (order) =>
                order.status !==
                "geannuleerd"
        )
        .reduce(
            (total, order) =>
                total +
                Number(
                    order.totalPrice || 0
                ),
            0
        );
};

const getStatusClass = (status = "") => {
    return String(status)
        .toLowerCase()
        .replaceAll(" ", "-");
};

const renderRecentOrders = (
    orders
) => {
    const recentOrders = [...orders]
        .sort(
            (
                firstOrder,
                secondOrder
            ) =>
                new Date(
                    secondOrder.createdAt
                ) -
                new Date(
                    firstOrder.createdAt
                )
        )
        .slice(0, 5);

    if (!recentOrders.length) {
        return `
            <div class="emptyState">
                <p>
                    Er zijn nog geen
                    bestellingen.
                </p>
            </div>
        `;
    }

    return recentOrders
        .map(
            (order) => `
                <article
                    class="recentOrder"
                >
                    <div>
                        <div
                            class="
                                recentOrderHeading
                            "
                        >
                            <strong>
                                #${getShortOrderId(
                                    order
                                )}
                            </strong>

                            <span
                                class="
                                    statusBadge
                                    statusBadge--${getStatusClass(
                                        order.status
                                    )}
                                "
                            >
                                ${escapeHtml(
                                    order.status ||
                                    "Onbekend"
                                )}
                            </span>
                        </div>

                        <p
                            class="
                                recentOrderCustomer
                            "
                        >
                            ${escapeHtml(
                                order.customerName ||
                                "Onbekende klant"
                            )}
                        </p>

                        <p
                            class="
                                recentOrderMeta
                            "
                        >
                            ${formatDate(
                                order.createdAt
                            )}
                        </p>
                    </div>

                    <strong
                        class="
                            recentOrderPrice
                        "
                    >
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
            <header
                class="admin-header"
            >
                <div>
                    <p
                        class="adminSubtitle"
                    >
                        Overzicht
                    </p>

                    <h1
                        class="adminTitle"
                    >
                        Dashboard
                    </h1>

                    <p
                        class="adminDescription"
                    >
                        Bekijk in één oogopslag
                        wat er gebeurt in de
                        ice cream factory.
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
                id="dashboardContent"
                class="dashboardContent"
            >
                <div
                    class="loadingState"
                >
                    <div
                        class="
                            loadingSpinner
                        "
                    ></div>

                    <p>
                        Dashboard laden...
                    </p>
                </div>
            </div>
        `;

        const dashboardContent =
            container.querySelector(
                "#dashboardContent"
            );

        const refreshButton =
            container.querySelector(
                "#dashboard-refreshButton"
            );

        const loadDashboard =
            async () => {
                refreshButton.disabled =
                    true;

                refreshButton.textContent =
                    "Laden...";

                dashboardContent.innerHTML = `
                    <div
                        class="loadingState"
                    >
                        <div
                            class="
                                loadingSpinner
                            "
                        ></div>

                        <p>
                            Dashboard laden...
                        </p>
                    </div>
                `;

                try {
                    const orders =
                        await getOrders();

                    const todayOrders =
                        getTodayOrders(
                            orders
                        );

                    const totalRevenue =
                        calculateRevenue(
                            orders
                        );

                    dashboardContent.innerHTML = `
                        <section
                            class="
                                dashboardStatistics
                            "
                        >
                            <article
                                class="
                                    dashboardStatCard
                                    dashboardStatCardFeatured
                                "
                            >
                                <span
                                    class="
                                        dashboardStatCardLabel
                                    "
                                >
                                    Bestellingen vandaag
                                </span>

                                <strong
                                    class="
                                        dashboardStatCardValue
                                    "
                                >
                                    ${todayOrders.length}
                                </strong>

                                <span
                                    class="
                                        dashboardStatCardDetail
                                    "
                                >
                                    ${orders.length}
                                    in totaal
                                </span>
                            </article>

                            <article
                                class="
                                    dashboardStatCard
                                "
                            >
                                <span
                                    class="
                                        dashboardStatCardLabel
                                    "
                                >
                                    Totale omzet
                                </span>

                                <strong
                                    class="
                                        dashboardStatCardValue
                                    "
                                >
                                    ${formatPrice(
                                        totalRevenue
                                    )}
                                </strong>

                                <span
                                    class="
                                        dashboardStatCardDetail
                                    "
                                >
                                    Zonder geannuleerde
                                    bestellingen
                                </span>
                            </article>

                            <article
                                class="
                                    dashboardStatCard
                                "
                            >
                                <span
                                    class="
                                        dashboardStatCardLabel
                                    "
                                >
                                    Te verwerken
                                </span>

                                <strong
                                    class="
                                        dashboardStatCardValue
                                    "
                                >
                                    ${getStatusCount(
                                        orders,
                                        "te verwerken"
                                    )}
                                </strong>

                                <span
                                    class="
                                        dashboardStatCardDetail
                                    "
                                >
                                    Wachten op verwerking
                                </span>
                            </article>

                            <article
                                class="
                                    dashboardStatCard
                                "
                            >
                                <span
                                    class="
                                        dashboardStatCardLabel
                                    "
                                >
                                    In bereiding
                                </span>

                                <strong
                                    class="
                                        dashboardStatCardValue
                                    "
                                >
                                    ${getStatusCount(
                                        orders,
                                        "in bereiding"
                                    )}
                                </strong>

                                <span
                                    class="
                                        dashboardStatCardDetail
                                    "
                                >
                                    Worden momenteel
                                    gemaakt
                                </span>
                            </article>

                            <article
                                class="
                                    dashboardStatCard
                                "
                            >
                                <span
                                    class="
                                        dashboardStatCardLabel
                                    "
                                >
                                    Klaar
                                </span>

                                <strong
                                    class="
                                        dashboardStatCardValue
                                    "
                                >
                                    ${getStatusCount(
                                        orders,
                                        "klaar"
                                    )}
                                </strong>

                                <span
                                    class="
                                        dashboardStatCardDetail
                                    "
                                >
                                    Klaar voor verzending
                                </span>
                            </article>
                        </section>

                        <section
                            class="
                                dashboardGrid
                            "
                        >
                            <article
                                class="
                                    dashboardPanel
                                "
                            >
                                <header
                                    class="
                                        dashboardPanelHeader
                                    "
                                >
                                    <div>
                                        <p
                                            class="
                                                dashboardPanelSubtitle
                                            "
                                        >
                                            Activiteit
                                        </p>

                                        <h2>
                                            Recente bestellingen
                                        </h2>
                                    </div>

                                    <button
                                        class="
                                            textButton
                                        "
                                        type="button"
                                        data-go-to-orders
                                    >
                                        Bekijk alles
                                    </button>
                                </header>

                                <div
                                    class="
                                        recentOrders
                                    "
                                >
                                    ${renderRecentOrders(
                                        orders
                                    )}
                                </div>
                            </article>

                            <aside
                                class="
                                    dashboardPanel
                                    dashboardPanelSummary
                                "
                            >
                                <p
                                    class="
                                        dashboardPanelSubtitle
                                    "
                                >
                                    Statusoverzicht
                                </p>

                                <h2>
                                    Bestelworkflow
                                </h2>

                                <div
                                    class="
                                        workflowList
                                    "
                                >
                                    <div
                                        class="
                                            workflowItem
                                        "
                                    >
                                        <span
                                            class="
                                                workflowItemIndicator
                                                processing
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

                                    <div
                                        class="
                                            workflowItem
                                        "
                                    >
                                        <span
                                            class="
                                                workflowItemIndicator
                                                preparing
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

                                    <div
                                        class="
                                            workflowItem
                                        "
                                    >
                                        <span
                                            class="
                                                workflowItemIndicator
                                                ready
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

                                    <div
                                        class="
                                            workflowItem
                                        "
                                    >
                                        <span
                                            class="
                                                workflowItemIndicator
                                                sent
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

                                    <div
                                        class="
                                            workflowItem
                                        "
                                    >
                                        <span
                                            class="
                                                workflowItemIndicator
                                                cancelled
                                            "
                                        ></span>

                                        <span>
                                            Geannuleerd
                                        </span>

                                        <strong>
                                            ${getStatusCount(
                                                orders,
                                                "geannuleerd"
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
                        <section
                            class="errorState"
                        >
                            <h2>
                                Dashboard laden
                                mislukt
                            </h2>

                            <p>
                                ${escapeHtml(
                                    error.message
                                )}
                            </p>

                            <button
                                id="
                                    dashboard-retry-button
                                "
                                class="
                                    button
                                    buttonPrimary
                                "
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
                    refreshButton.disabled =
                        false;

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