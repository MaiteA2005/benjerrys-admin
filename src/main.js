import "./style.css";

import logoImage from "./assets/b&j-logo.svg";

import {
  getOrders,
  updateOrderStatus,
  deleteOrder
} from "./api/api.js";

const app = document.querySelector("#app");

const statusOptions = [
  "te verwerken",
  "in bereiding",
  "klaar",
  "verzonden",
  "geannuleerd"
];

let orders = [];
let selectedStatus = "alle";
let searchValue = "";

app.innerHTML = `
  <div class="admin-layout">
    <aside class="sidebar">
      <div class="sidebar__brand">
        <img
          class="sidebar__logo"
          src="${logoImage}"
          alt="Ben & Jerry's"
        />

        <p class="sidebar__subtitle">
          Ice Cream Factory
        </p>

        <span class="sidebar__badge">
          Admin
        </span>
      </div>

      <nav class="sidebar__navigation">
        <button
          class="navigation-item navigation-item--active"
          type="button"
        >
          <span class="navigation-item__icon">
            ◫
          </span>

          Bestellingen
        </button>
      </nav>
    </aside>

    <main class="admin-main">
      <header class="admin-header">
        <div>
          <p class="admin-header__eyebrow">
            Dashboard
          </p>

          <h1 class="admin-header__title">
            Bestellingen
          </h1>

          <p class="admin-header__description">
            Bekijk en beheer alle bestellingen
            uit de ice cream factory.
          </p>
        </div>

        <button
          id="refresh-button"
          class="refresh-button"
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
            <span class="visually-hidden">
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
            <span class="visually-hidden">
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
          id="feedback-message"
          class="feedback-message"
          hidden
        ></div>

        <div
          id="orders-container"
          class="orders-container"
        >
          <div class="loading-state">
            <div class="loading-spinner"></div>

            <p>
              Bestellingen laden...
            </p>
          </div>
        </div>
      </section>
    </main>
  </div>

  <div
    id="delete-modal"
    class="modal"
    hidden
  >
    <div
      class="modal__overlay"
      data-close-modal
    ></div>

    <section
      class="modal__dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <h2
        id="delete-modal-title"
        class="modal__title"
      >
        Bestelling verwijderen?
      </h2>

      <p class="modal__description">
        Deze actie kan niet ongedaan worden
        gemaakt.
      </p>

      <div class="modal__actions">
        <button
          id="cancel-delete-button"
          class="button button--secondary"
          type="button"
        >
          Annuleren
        </button>

        <button
          id="confirm-delete-button"
          class="button button--danger"
          type="button"
        >
          Verwijderen
        </button>
      </div>
    </section>
  </div>
`;

const ordersContainer =
  document.querySelector(
    "#orders-container"
  );

const statisticsContainer =
  document.querySelector(
    "#statistics"
  );

const refreshButton =
  document.querySelector(
    "#refresh-button"
  );

const searchInput =
  document.querySelector(
    "#search-input"
  );

const statusFilter =
  document.querySelector(
    "#status-filter"
  );

const feedbackMessage =
  document.querySelector(
    "#feedback-message"
  );

const deleteModal =
  document.querySelector(
    "#delete-modal"
  );

const cancelDeleteButton =
  document.querySelector(
    "#cancel-delete-button"
  );

const confirmDeleteButton =
  document.querySelector(
    "#confirm-delete-button"
  );

let orderToDelete = null;

function capitalize(value) {
  if (!value) {
    return "";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

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
  if (!order?._id) {
    return "Onbekend";
  }

  return order._id
    .slice(-6)
    .toUpperCase();
};

const getFlavorName = (
  flavorItem
) => {
  if (!flavorItem) {
    return "Onbekende smaak";
  }

  if (flavorItem.flavor?.name) {
    return flavorItem.flavor.name;
  }

  return (
    flavorItem.customName ||
    "Eigen smaak"
  );
};

const getFlavorColor = (
  flavorItem
) => {
  if (!flavorItem) {
    return "#d9d9d9";
  }

  return (
    flavorItem.flavor?.color ||
    flavorItem.customColor ||
    "#d9d9d9"
  );
};

const getStatusClass = (status) => {
  return String(status || "")
    .toLowerCase()
    .replaceAll(" ", "-");
};

const showFeedback = (
  message,
  type = "success"
) => {
  feedbackMessage.hidden = false;
  feedbackMessage.textContent = message;
  feedbackMessage.className =
    `feedback-message feedback-message--${type}`;

  window.setTimeout(() => {
    feedbackMessage.hidden = true;
  }, 3500);
};

const renderStatistics = () => {
  const total = orders.length;

  const processing = orders.filter(
    (order) =>
      order.status === "te verwerken"
  ).length;

  const preparing = orders.filter(
    (order) =>
      order.status === "in bereiding"
  ).length;

  const ready = orders.filter(
    (order) =>
      order.status === "klaar"
  ).length;

  statisticsContainer.innerHTML = `
    <article class="statistic-card">
      <span class="statistic-card__label">
        Totaal
      </span>

      <strong class="statistic-card__value">
        ${total}
      </strong>
    </article>

    <article class="statistic-card">
      <span class="statistic-card__label">
        Te verwerken
      </span>

      <strong class="statistic-card__value">
        ${processing}
      </strong>
    </article>

    <article class="statistic-card">
      <span class="statistic-card__label">
        In bereiding
      </span>

      <strong class="statistic-card__value">
        ${preparing}
      </strong>
    </article>

    <article class="statistic-card">
      <span class="statistic-card__label">
        Klaar
      </span>

      <strong class="statistic-card__value">
        ${ready}
      </strong>
    </article>
  `;
};

const getFilteredOrders = () => {
  const normalizedSearch =
    searchValue.trim().toLowerCase();

  return orders.filter((order) => {
    const matchesStatus =
      selectedStatus === "alle" ||
      order.status === selectedStatus;

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

    const matchesSearch =
      !normalizedSearch ||
      searchableText.includes(
        normalizedSearch
      );

    return (
      matchesStatus &&
      matchesSearch
    );
  });
};

const renderFlavorList = (
  flavors = []
) => {
  if (!flavors.length) {
    return `
      <p class="empty-value">
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

const renderOrders = () => {
  const filteredOrders =
    getFilteredOrders();

  if (!filteredOrders.length) {
    ordersContainer.innerHTML = `
      <section class="empty-state">
        <div class="empty-state__icon">
          🍨
        </div>

        <h2>
          Geen bestellingen gevonden
        </h2>

        <p>
          Er zijn geen bestellingen die
          overeenkomen met je filters.
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
            <header class="order-card__header">
              <div>
                <div class="order-card__heading">
                  <h2 class="order-card__title">
                    Bestelling
                    #${getShortOrderId(order)}
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

                <p class="order-card__date">
                  ${formatDate(
                    order.createdAt
                  )}
                </p>
              </div>

              <strong class="order-card__price">
                ${formatPrice(
                  order.totalPrice
                )}
              </strong>
            </header>

            <div class="order-card__content">
              <section class="order-detail">
                <h3 class="order-detail__title">
                  Klant
                </h3>

                <p class="order-detail__primary">
                  ${escapeHtml(
                    order.customerName
                  )}
                </p>

                <p class="order-detail__secondary">
                  ${escapeHtml(
                    order.address?.street
                  )}
                  ${escapeHtml(
                    order.address?.houseNumber
                  )}
                  <br />
                  ${escapeHtml(
                    order.address?.postalCode
                  )}
                  ${escapeHtml(
                    order.address?.city
                  )}
                </p>
              </section>

              <section class="order-detail">
                <h3 class="order-detail__title">
                  IJsje
                </h3>

                <p class="order-detail__primary">
                  Basis:
                  <strong>
                    ${escapeHtml(
                      order.iceCreamBase
                        ?.name ||
                      "Onbekend"
                    )}
                  </strong>
                </p>

                <div class="flavor-list">
                  ${renderFlavorList(
                    order.flavors
                  )}
                </div>

                <p class="order-detail__secondary">
                  Toppings:
                  ${escapeHtml(
                    renderToppings(
                      order.toppings
                    )
                  )}
                </p>
              </section>

              <section class="order-detail order-detail--actions">
                <label class="status-field">
                  <span class="status-field__label">
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
                  class="delete-button"
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

const renderDashboard = () => {
  renderStatistics();
  renderOrders();
};

const loadOrders = async () => {
  ordersContainer.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>

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

    renderDashboard();
  } catch (error) {
    console.error(error);

    ordersContainer.innerHTML = `
      <section class="error-state">
        <h2>
          Bestellingen laden mislukt
        </h2>

        <p>
          ${escapeHtml(error.message)}
        </p>

        <button
          id="retry-button"
          class="button button--primary"
          type="button"
        >
          Opnieuw proberen
        </button>
      </section>
    `;

    document
      .querySelector("#retry-button")
      ?.addEventListener(
        "click",
        loadOrders
      );
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent =
      "Vernieuwen";
  }
};

ordersContainer.addEventListener(
  "change",
  async (event) => {
    const select = event.target.closest(
      "[data-status-select]"
    );

    if (!select) {
      return;
    }

    const orderId =
      select.dataset.orderId;

    const newStatus =
      select.value;

    const originalOrder =
      orders.find(
        (order) =>
          order._id === orderId
      );

    if (!originalOrder) {
      return;
    }

    const previousStatus =
      originalOrder.status;

    select.disabled = true;

    try {
      const updatedOrder =
        await updateOrderStatus(
          orderId,
          newStatus
        );

      orders = orders.map((order) =>
        order._id === orderId
          ? updatedOrder
          : order
      );

      renderDashboard();

      showFeedback(
        "De status is aangepast."
      );
    } catch (error) {
      console.error(error);

      select.value = previousStatus;

      showFeedback(
        error.message ||
          "Status aanpassen mislukt.",
        "error"
      );
    } finally {
      select.disabled = false;
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
      "modal-open"
    );
  }
);

const closeDeleteModal = () => {
  deleteModal.hidden = true;
  orderToDelete = null;

  document.body.classList.remove(
    "modal-open"
  );
};

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

    const orderId = orderToDelete;

    confirmDeleteButton.disabled = true;
    confirmDeleteButton.textContent =
      "Verwijderen...";

    try {
      await deleteOrder(orderId);

      orders = orders.filter(
        (order) =>
          order._id !== orderId
      );

      closeDeleteModal();
      renderDashboard();

      showFeedback(
        "De bestelling is verwijderd."
      );
    } catch (error) {
      console.error(error);

      showFeedback(
        error.message ||
          "Bestelling verwijderen mislukt.",
        "error"
      );
    } finally {
      confirmDeleteButton.disabled =
        false;

      confirmDeleteButton.textContent =
        "Verwijderen";
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

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape" &&
      !deleteModal.hidden
    ) {
      closeDeleteModal();
    }
  }
);

loadOrders();