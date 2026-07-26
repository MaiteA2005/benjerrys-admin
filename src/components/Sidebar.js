import logoImage from "../assets/b&j-logo.svg";

const navigationItems = [
    {
        id: "dashboard",
        label: "Dashboard",
        icon: "⌂"
    },
    {
        id: "orders",
        label: "Bestellingen",
        icon: "▣"
    },
    {
        id: "bases",
        label: "Bases",
        icon: "▽"
    },
    {
        id: "flavors",
        label: "Smaken",
        icon: "●"
    },
    {
        id: "toppings",
        label: "Toppings",
        icon: "✦"
    }
];

export const renderSidebar = (
    activePage = "dashboard"
    ) => {
    return `
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

        <nav
            class="sidebar__navigation"
            aria-label="Adminnavigatie"
        >
            ${navigationItems
            .map(
                (item) => `
                <button
                    class="
                    navigation-item
                    ${
                        activePage === item.id
                        ? "navigation-item--active"
                        : ""
                    }
                    "
                    type="button"
                    data-navigation-page="${item.id}"
                >
                    <span
                    class="navigation-item__icon"
                    aria-hidden="true"
                    >
                    ${item.icon}
                    </span>

                    <span>
                    ${item.label}
                    </span>
                </button>
                `
            )
            .join("")}
        </nav>

        <div class="sidebar__footer">
            <span class="sidebar__footer-label">
            Beheeromgeving
            </span>

            <span class="sidebar__footer-status">
            <span
                class="sidebar__status-dot"
                aria-hidden="true"
            ></span>

            API verbonden
            </span>
        </div>
        </aside>
    `;
};