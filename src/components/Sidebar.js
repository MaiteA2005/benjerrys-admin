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
        <div class="sidebarBrand">
            <img
            class="sidebarLogo"
            src="${logoImage}"
            alt="Ben & Jerry's"
            />

            <p class="sidebarSubtitle">
            Ice Cream Factory
            </p>

            <span class="sidebarBadge">
            Admin
            </span>
        </div>

        <nav
            class="sidebarNavigation"
            aria-label="Adminnavigatie"
        >
            ${navigationItems
            .map(
                (item) => `
                <button
                    class="
                    navigationItem
                    ${
                        activePage === item.id
                        ? "isActive"
                        : ""
                    }
                    "
                    type="button"
                    data-navigation-page="${item.id}"
                >
                    <span
                    class="navIcon"
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

        <div class="sidebarFooter">
            <span class="sidebarFooterLabel">
            Beheeromgeving
            </span>

            <span class="sidebarFooterStatus">
            <span
                class="StatusDot"
                aria-hidden="true"
            ></span>

            API verbonden
            </span>
        </div>
        </aside>
    `;
};