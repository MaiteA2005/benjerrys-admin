import logoImage from "../assets/b&j-logo.svg";

import dashboardIconWhite from "../assets/icons/dashboardIcon_wit.svg";
import dashboardIconBlack from "../assets/icons/dashboardIcon_zwart.svg";

import ordersIconWhite from "../assets/icons/bestellingenIcon_wit.svg";
import ordersIconBlack from "../assets/icons/bestellingenIcon_zwart.svg";

import basesIconWhite from "../assets/icons/basesIcon_wit.svg";
import basesIconBlack from "../assets/icons/basesIcon_zwart.svg";

import flavorsIconWhite from "../assets/icons/smakenIcon_wit.svg";
import flavorsIconBlack from "../assets/icons/smakenIcon_zwart.svg";

import toppingsIconWhite from "../assets/icons/toppingsIcon_wit.svg";
import toppingsIconBlack from "../assets/icons/toppingsIcon_zwart.svg";

const navigationItems = [
    {
        id: "dashboard",
        label: "Dashboard",
        iconWhite: dashboardIconWhite,
        iconBlack: dashboardIconBlack
    },
    {
        id: "orders",
        label: "Bestellingen",
        iconWhite: ordersIconWhite,
        iconBlack: ordersIconBlack
    },
    {
        id: "bases",
        label: "Bases",
        iconWhite: basesIconWhite,
        iconBlack: basesIconBlack
    },
    {
        id: "flavors",
        label: "Smaken",
        iconWhite: flavorsIconWhite,
        iconBlack: flavorsIconBlack
    },
    {
        id: "toppings",
        label: "Toppings",
        iconWhite: toppingsIconWhite,
        iconBlack: toppingsIconBlack
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
                    .map((item) => {
                        const isActive =
                            activePage === item.id;

                        const icon = isActive
                            ? item.iconBlack
                            : item.iconWhite;

                        return `
                            <button
                                class="navigationItem ${
                                    isActive ? "isActive" : ""
                                }"
                                type="button"
                                data-navigation-page="${item.id}"
                            >
                                <img
                                    class="navIcon"
                                    src="${icon}"
                                    alt=""
                                    aria-hidden="true"
                                />

                                <span>
                                    ${item.label}
                                </span>
                            </button>
                        `;
                    })
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