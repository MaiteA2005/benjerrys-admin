import "./styles/main.css";
import "./styles/dashboard.css";
import "./styles/orders.css";
import "./styles/products.css";
import "./styles/flavors.css";
import "./styles/toppings.css";

import logoImage from "./assets/b&j-logo.svg";

import {
  renderSidebar
} from "./components/Sidebar.js";

import {
  renderDashboardPage
} from "./pages/DashboardPage.js";

import {
  renderOrdersPage
} from "./pages/OrdersPage.js";

import {
  renderBasesPage
} from "./pages/BasesPage.js";

import {
  renderFlavorsPage
} from "./pages/FlavorsPage.js";

import {
  renderToppingsPage
} from "./pages/ToppingsPage.js";

const app =
  document.querySelector("#app");

const validPages = [
  "dashboard",
  "orders",
  "bases",
  "flavors",
  "toppings"
];

const getCurrentPage = () => {
  const requestedPage =
    window.location.hash
      .replace("#", "")
      .trim();

  return validPages.includes(
    requestedPage
  )
    ? requestedPage
    : "dashboard";
};

const renderApplication =
  async () => {
    const currentPage =
      getCurrentPage();

    app.innerHTML = `
      <div class="admin-layout">
        ${renderSidebar(
          currentPage
        )}

        <main
          id="page-content"
          class="admin-main"
        ></main>
      </div>
    `;

    const pageContent =
      document.querySelector(
        "#page-content"
      );

    document
      .querySelectorAll(
        "[data-navigation-page]"
      )
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const page =
              button.dataset
                .navigationPage;

            window.location.hash =
              page;
          }
        );
      });

    switch (currentPage) {
      case "orders":
        await renderOrdersPage(
          pageContent
        );
        break;

      case "bases":
        await renderBasesPage(
          pageContent
        );
        break;

      case "flavors":
        await renderFlavorsPage(
          pageContent
        );
        break;
      
      case "toppings":
        await renderToppingsPage(
          pageContent
        );
        break;

      case "dashboard":
      default:
        await renderDashboardPage(
          pageContent
        );
        break;
    }
  };

window.addEventListener(
  "hashchange",
  renderApplication
);

renderApplication();