import {
    getOrders,
    updateOrderStatus,
    deleteOrder
} from "../api/api.js";

const statusOptions = [
    "te verwerken",
    "in bereiding",
    "klaar",
    "verzonden",
    "geannuleerd"
];

const capitalize = (value) => {
    if (!value) {
        return "";
    }

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
};

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

const getFlavorName = (
    flavorItem
    ) => {
    return (
        flavorItem?.flavor?.name ||
        flavorItem?.customName ||
        "Eigen smaak"
    );
};

const getFlavorColor = (
    flavorItem
    ) => {
    return (
        flavorItem?.flavor?.color ||
        flavorItem?.customColor ||
        "#d9d9d9"
    );
};

const getStatusClass = (status) => {
    return String(status || "")
        .toLowerCase()
        .replaceAll(" ", "-");
};

const renderFlavorList = (
    flavors = []
    ) => {
    if (!flavors.length) {
        return `
        <p class="emptyValue">
            Geen smaken gevonden
        </p>
        `;
    }

    return flavors
        .map(
        (flavorItem, index) => `
            <div class="flavor-item">
            <span
                class="flavor-item__color"
                style="
                background-color:
                ${escapeHtml(
                    getFlavorColor(
                    flavorItem
                    )
                )}
                "
            ></span>

            <span>
                Smaak ${index + 1}:
                <strong>
                ${escapeHtml(
                    getFlavorName(
                    flavorItem
                    )
                )}
                </strong>
            </span>
            </div>
        `
        )
        .join("");
};

const renderToppings = (
    toppings = []
    ) => {
    if (!toppings.length) {
        return "Geen toppings";
    }

    return toppings
        .map((topping) => topping.name)
        .join(", ");
};

export const renderOrdersPage =
    async (container) => {
        let orders = [];
        let selectedStatus = "alle";
        let searchValue = "";
        let orderToDelete = null;

        container.innerHTML = `
        <header class="admin-header">
            <div>
            <p class="adminSubtitle">
                Orderbeheer
            </p>

            <h1 class="adminTitle">
                Bestellingen
            </h1>

            <p class="adminDescription">
                Bekijk en beheer alle bestellingen
                uit de ice cream factory.
            </p>
            </div>

            <button
            id="refreshButton"
            class="refreshButton"
            type="button"
            >
            Vernieuwen
            </button>
        </header>

        <section
            id="statistics"
            class="statistics"
        ></section>

        <section class="orders-section">
            <div class="orders-toolbar">
            <label class="search-field">
                <span class="visuallyHidden">
                Bestellingen zoeken
                </span>

                <input
                id="search-input"
                class="search-field__input"
                type="search"
                placeholder="Zoek op naam, gemeente of bestelling..."
                />
            </label>

            <label class="filter-field">
                <span class="visuallyHidden">
                Filter op status
                </span>

                <select
                id="status-filter"
                class="filter-field__select"
                >
                <option value="alle">
                    Alle statussen
                </option>

                ${statusOptions
                    .map(
                    (status) => `
                        <option value="${status}">
                        ${capitalize(status)}
                        </option>
                    `
                    )
                    .join("")}
                </select>
            </label>
            </div>

            <div
            id="feedbackMessage"
            class="feedbackMessage"
            hidden
            ></div>

            <div
            id="orders-container"
            class="orders-container"
            ></div>
        </section>

        <div
            id="delete-modal"
            class="modal"
            hidden
        >
            <div
            class="modalOverlay"
            data-close-modal
            ></div>

            <section
            class="modalDialog"
            role="dialog"
            aria-modal="true"
            >
            <h2 class="modalTitle">
                Bestelling verwijderen?
            </h2>

            <p class="modalDescription">
                Deze actie kan niet ongedaan
                worden gemaakt.
            </p>

            <div class="modalActions">
                <button
                id="cancel-deleteButton"
                class="button button secondary"
                type="button"
                >
                Annuleren
                </button>

                <button
                id="confirm-deleteButton"
                class="button danger"
                type="button"
                >
                Verwijderen
                </button>
            </div>
            </section>
        </div>
        `;

        const ordersContainer =
        container.querySelector(
            "#orders-container"
        );

        const statisticsContainer =
        container.querySelector(
            "#statistics"
        );

        const refreshButton =
        container.querySelector(
            "#refreshButton"
        );

        const searchInput =
        container.querySelector(
            "#search-input"
        );

        const statusFilter =
        container.querySelector(
            "#status-filter"
        );

        const feedbackMessage =
        container.querySelector(
            "#feedbackMessage"
        );

        const deleteModal =
        container.querySelector(
            "#delete-modal"
        );

        const cancelDeleteButton =
        container.querySelector(
            "#cancel-deleteButton"
        );

        const confirmDeleteButton =
        container.querySelector(
            "#confirm-deleteButton"
        );

        const showFeedback = (
        message,
        type = "success"
        ) => {
        feedbackMessage.hidden = false;
        feedbackMessage.textContent =
            message;

        feedbackMessage.className =
            `feedbackMessage feedbackMessage--${type}`;
        };

        const renderStatistics = () => {
        const getCount = (status) =>
            orders.filter(
            (order) =>
                order.status === status
            ).length;

        statisticsContainer.innerHTML = `
            <article class="statistic-card">
            <span class="statistic-card__label">
                Totaal
            </span>

            <strong class="statistic-card__value">
                ${orders.length}
            </strong>
            </article>

            <article class="statistic-card">
            <span class="statistic-card__label">
                Te verwerken
            </span>

            <strong class="statistic-card__value">
                ${getCount("te verwerken")}
            </strong>
            </article>

            <article class="statistic-card">
            <span class="statistic-card__label">
                In bereiding
            </span>

            <strong class="statistic-card__value">
                ${getCount("in bereiding")}
            </strong>
            </article>

            <article class="statistic-card">
            <span class="statistic-card__label">
                Klaar
            </span>

            <strong class="statistic-card__value">
                ${getCount("klaar")}
            </strong>
            </article>
        `;
        };

        const getFilteredOrders = () => {
        const normalizedSearch =
            searchValue
            .trim()
            .toLowerCase();

        return orders.filter((order) => {
            const matchesStatus =
            selectedStatus === "alle" ||
            order.status ===
                selectedStatus;

            const searchableText = [
            order.customerName,
            order.address?.street,
            order.address?.houseNumber,
            order.address?.postalCode,
            order.address?.city,
            order.iceCreamBase?.name,
            order.status,
            order._id,
            getShortOrderId(order),
            ...(order.flavors || []).map(
                getFlavorName
            )
            ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

            return (
            matchesStatus &&
            (
                !normalizedSearch ||
                searchableText.includes(
                normalizedSearch
                )
            )
            );
        });
        };

        const renderOrders = () => {
        const filteredOrders =
            getFilteredOrders();

        if (!filteredOrders.length) {
            ordersContainer.innerHTML = `
            <section class="emptyState">
                <h2>
                Geen bestellingen gevonden
                </h2>

                <p>
                Pas je zoekopdracht of
                statusfilter aan.
                </p>
            </section>
            `;

            return;
        }

        ordersContainer.innerHTML =
            filteredOrders
            .map(
                (order) => `
                <article
                    class="order-card"
                    data-order-id="${order._id}"
                >
                    <header
                    class="order-card__header"
                    >
                    <div>
                        <div
                        class="order-card__heading"
                        >
                        <h2
                            class="order-card__title"
                        >
                            Bestelling
                            #${getShortOrderId(
                            order
                            )}
                        </h2>

                        <span
                            class="
                            status-badge
                            status-badge--${getStatusClass(
                                order.status
                            )}
                            "
                        >
                            ${capitalize(
                            order.status
                            )}
                        </span>
                        </div>

                        <p
                        class="order-card__date"
                        >
                        ${formatDate(
                            order.createdAt
                        )}
                        </p>
                    </div>

                    <strong
                        class="order-card__price"
                    >
                        ${formatPrice(
                        order.totalPrice
                        )}
                    </strong>
                    </header>

                    <div
                    class="order-card__content"
                    >
                    <section
                        class="order-detail"
                    >
                        <h3
                        class="order-detail__title"
                        >
                        Klant
                        </h3>

                        <p
                        class="order-detail__primary"
                        >
                        ${escapeHtml(
                            order.customerName
                        )}
                        </p>

                        <p
                        class="order-detail__secondary"
                        >
                        ${escapeHtml(
                            order.address?.street
                        )}
                        ${escapeHtml(
                            order.address
                            ?.houseNumber
                        )}
                        <br />

                        ${escapeHtml(
                            order.address
                            ?.postalCode
                        )}
                        ${escapeHtml(
                            order.address?.city
                        )}
                        </p>
                    </section>

                    <section
                        class="order-detail"
                    >
                        <h3
                        class="order-detail__title"
                        >
                        IJsje
                        </h3>

                        <p
                        class="order-detail__primary"
                        >
                        Basis:
                        <strong>
                            ${escapeHtml(
                            order
                                .iceCreamBase
                                ?.name ||
                                "Onbekend"
                            )}
                        </strong>
                        </p>

                        <div
                        class="flavor-list"
                        >
                        ${renderFlavorList(
                            order.flavors
                        )}
                        </div>

                        <p
                        class="order-detail__secondary"
                        >
                        Toppings:
                        ${escapeHtml(
                            renderToppings(
                            order.toppings
                            )
                        )}
                        </p>
                    </section>

                    <section
                        class="
                        order-detail
                        order-detail--actions
                        "
                    >
                        <label
                        class="status-field"
                        >
                        <span
                            class="status-field__label"
                        >
                            Status
                        </span>

                        <select
                            class="status-field__select"
                            data-status-select
                            data-order-id="${order._id}"
                        >
                            ${statusOptions
                            .map(
                                (status) => `
                                <option
                                    value="${status}"
                                    ${
                                    status ===
                                    order.status
                                        ? "selected"
                                        : ""
                                    }
                                >
                                    ${capitalize(
                                    status
                                    )}
                                </option>
                                `
                            )
                            .join("")}
                        </select>
                        </label>

                        <button
                        class="deleteButton"
                        type="button"
                        data-delete-order
                        data-order-id="${order._id}"
                        >
                        Verwijderen
                        </button>
                    </section>
                    </div>
                </article>
                `
            )
            .join("");
        };

        const renderPage = () => {
        renderStatistics();
        renderOrders();
        };

        const loadOrders = async () => {
        ordersContainer.innerHTML = `
            <div class="loadingState">
            <div class="loadingSpinner"></div>

            <p>
                Bestellingen laden...
            </p>
            </div>
        `;

        refreshButton.disabled = true;
        refreshButton.textContent =
            "Laden...";

        try {
            orders = await getOrders();
            renderPage();
        } catch (error) {
            console.error(error);

            ordersContainer.innerHTML = `
            <section class="errorState">
                <h2>
                Bestellingen laden mislukt
                </h2>

                <p>
                ${escapeHtml(error.message)}
                </p>
            </section>
            `;
        } finally {
            refreshButton.disabled = false;
            refreshButton.textContent =
            "Vernieuwen";
        }
        };

        const closeDeleteModal = () => {
        deleteModal.hidden = true;
        orderToDelete = null;

        document.body.classList.remove(
            "modalOpen"
        );
        };

        ordersContainer.addEventListener(
        "change",
        async (event) => {
            const select =
            event.target.closest(
                "[data-status-select]"
            );

            if (!select) {
            return;
            }

            try {
            const updatedOrder =
                await updateOrderStatus(
                select.dataset.orderId,
                select.value
                );

            orders = orders.map((order) =>
                order._id ===
                updatedOrder._id
                ? updatedOrder
                : order
            );

            renderPage();

            showFeedback(
                "De status is aangepast."
            );
            } catch (error) {
            showFeedback(
                error.message,
                "error"
            );

            await loadOrders();
            }
        }
        );

        ordersContainer.addEventListener(
        "click",
        (event) => {
            const deleteButton =
            event.target.closest(
                "[data-delete-order]"
            );

            if (!deleteButton) {
            return;
            }

            orderToDelete =
            deleteButton.dataset.orderId;

            deleteModal.hidden = false;

            document.body.classList.add(
            "modalOpen"
            );
        }
        );

        deleteModal.addEventListener(
        "click",
        (event) => {
            if (
            event.target.matches(
                "[data-close-modal]"
            )
            ) {
            closeDeleteModal();
            }
        }
        );

        cancelDeleteButton.addEventListener(
        "click",
        closeDeleteModal
        );

        confirmDeleteButton.addEventListener(
        "click",
        async () => {
            if (!orderToDelete) {
            return;
            }

            try {
            await deleteOrder(
                orderToDelete
            );

            orders = orders.filter(
                (order) =>
                order._id !==
                orderToDelete
            );

            closeDeleteModal();
            renderPage();

            showFeedback(
                "De bestelling is verwijderd."
            );
            } catch (error) {
            showFeedback(
                error.message,
                "error"
            );
            }
        }
        );

        searchInput.addEventListener(
        "input",
        (event) => {
            searchValue =
            event.target.value;

            renderOrders();
        }
        );

        statusFilter.addEventListener(
        "change",
        (event) => {
            selectedStatus =
            event.target.value;

            renderOrders();
        }
        );

        refreshButton.addEventListener(
        "click",
        loadOrders
        );

        await loadOrders();
    };