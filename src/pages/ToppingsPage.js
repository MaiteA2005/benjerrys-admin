import {
    getToppings,
    createTopping,
    updateTopping,
    deleteTopping
} from "../api/api.js";

import { createModal } from "../components/modal.js";
import {
    createFeedbackMessage
} from "../components/feedbackMessage.js";

import {
    escapeHtml,
    formatPrice,
    isValidHexColor,
    isValidPrice
} from "../utils/helpers.js";

const DEFAULT_COLOR = "#c58a52";

export const renderToppingsPage = async (container) => {
    let toppings = [];
    let toppingToEdit = null;
    let toppingToDelete = null;

    container.innerHTML = `
        <header class="admin-header">
        <div>
            <p class="admin-header__eyebrow">Productbeheer</p>
            <h1 class="admin-header__title">Toppings</h1>
            <p class="admin-header__description">
            Beheer de toppings die klanten aan hun ijsje kunnen toevoegen.
            </p>
        </div>

        <button
            id="add-topping-button"
            class="refresh-button"
            type="button"
        >
            + Nieuwe topping
        </button>
        </header>

        <div
        id="topping-feedback"
        class="feedback-message"
        hidden
        ></div>

        <section
        id="toppings-container"
        class="product-grid topping-grid"
        ></section>

        <div id="topping-form-modal" class="modal" hidden>
        <div
            class="modal__overlay"
            data-close-topping-form
        ></div>

        <section
            class="modal__dialog modal__dialog--form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="topping-form-title"
        >
            <header class="form-modal__header">
            <div>
                <p class="form-modal__eyebrow">Toppingbeheer</p>
                <h2 id="topping-form-title" class="modal__title">
                Nieuwe topping
                </h2>
            </div>

            <button
                class="modal-close-button"
                type="button"
                data-close-topping-form
                aria-label="Venster sluiten"
            >
                ×
            </button>
            </header>

            <form id="topping-form" class="admin-form" novalidate>
            <section class="topping-form-preview">
                <div
                id="topping-preview-visual"
                class="topping-form-preview__visual"
                >
                <span></span><span></span><span></span>
                <span></span><span></span>
                </div>

                <div>
                <p class="topping-form-preview__label">Voorbeeld</p>
                <strong
                    id="topping-preview-name"
                    class="topping-form-preview__name"
                >
                    Nieuwe topping
                </strong>
                <span
                    id="topping-preview-color"
                    class="topping-form-preview__color"
                ></span>
                </div>
            </section>

            <label class="admin-field">
                <span class="admin-field__label">Naam</span>
                <input
                id="topping-name"
                class="admin-field__input"
                type="text"
                maxlength="50"
                placeholder="Bijvoorbeeld Chocolate Fudge"
                />
                <span
                id="topping-name-error"
                class="admin-field__error"
                ></span>
            </label>

            <label class="admin-field">
                <span class="admin-field__label">Kleur</span>
                <div class="admin-color-picker">
                <input
                    id="topping-color"
                    class="admin-color-picker__input"
                    type="color"
                    value="${DEFAULT_COLOR}"
                />
                <span
                    id="topping-color-value"
                    class="admin-color-picker__value"
                ></span>
                </div>
                <span
                id="topping-color-error"
                class="admin-field__error"
                ></span>
            </label>

            <label class="admin-field">
                <span class="admin-field__label">Prijs</span>
                <div class="price-input">
                <span class="price-input__prefix">€</span>
                <input
                    id="topping-price"
                    class="admin-field__input admin-field__input--price"
                    type="number"
                    min="0"
                    step="0.01"
                    value="0"
                />
                </div>
                <span
                id="topping-price-error"
                class="admin-field__error"
                ></span>
            </label>

            <div class="modal__actions">
                <button
                class="button button--secondary"
                type="button"
                data-close-topping-form
                >
                Annuleren
                </button>
                <button
                id="save-topping-button"
                class="button button--primary"
                type="submit"
                >
                Topping toevoegen
                </button>
            </div>
            </form>
        </section>
        </div>

        <div id="delete-topping-modal" class="modal" hidden>
        <div
            class="modal__overlay"
            data-close-delete-topping
        ></div>

        <section class="modal__dialog" role="dialog" aria-modal="true">
            <h2 class="modal__title">Topping verwijderen?</h2>
            <p
            id="delete-topping-description"
            class="modal__description"
            ></p>

            <div class="modal__actions">
            <button
                class="button button--secondary"
                type="button"
                data-close-delete-topping
            >
                Annuleren
            </button>
            <button
                id="confirm-delete-topping-button"
                class="button button--danger"
                type="button"
            >
                Verwijderen
            </button>
            </div>
        </section>
        </div>
    `;

    const $ = (selector) => container.querySelector(selector);

    const list = $("#toppings-container");
    const form = $("#topping-form");
    const nameInput = $("#topping-name");
    const colorInput = $("#topping-color");
    const priceInput = $("#topping-price");
    const saveButton = $("#save-topping-button");
    const formTitle = $("#topping-form-title");

    const feedback = createFeedbackMessage(
        $("#topping-feedback")
    );

    const clearErrors = () => {
        ["name", "color", "price"].forEach((field) => {
        $(`#topping-${field}-error`).textContent = "";
        });

        nameInput.classList.remove("admin-field__input--error");
        priceInput.classList.remove("admin-field__input--error");
    };

    const updatePreview = () => {
        const color = colorInput.value || DEFAULT_COLOR;

        $("#topping-preview-name").textContent =
        nameInput.value.trim() || "Nieuwe topping";

        $("#topping-preview-color").textContent =
        color.toUpperCase();

        $("#topping-color-value").textContent =
        color.toUpperCase();

        $("#topping-preview-visual").style.setProperty(
        "--topping-color",
        color
        );
    };

    const resetForm = () => {
        toppingToEdit = null;
        form.reset();
        colorInput.value = DEFAULT_COLOR;
        priceInput.value = "0";
        clearErrors();
        updatePreview();
    };

    const formModal = createModal({
        element: $("#topping-form-modal"),
        closeSelector: "[data-close-topping-form]",
        onClose: resetForm
    });

    const deleteModal = createModal({
        element: $("#delete-topping-modal"),
        closeSelector: "[data-close-delete-topping]",
        onClose: () => {
        toppingToDelete = null;
        }
    });

    const openForm = (topping = null) => {
        resetForm();
        toppingToEdit = topping;

        if (topping) {
        formTitle.textContent = "Topping bewerken";
        saveButton.textContent = "Wijzigingen opslaan";
        nameInput.value = topping.name || "";
        colorInput.value = isValidHexColor(topping.color)
            ? topping.color
            : DEFAULT_COLOR;
        priceInput.value = Number(topping.price || 0);
        } else {
        formTitle.textContent = "Nieuwe topping";
        saveButton.textContent = "Topping toevoegen";
        }

        updatePreview();
        formModal.open();
        nameInput.focus();
    };

    const validate = () => {
        clearErrors();
        let valid = true;

        if (!nameInput.value.trim()) {
        $("#topping-name-error").textContent =
            "Vul een naam in.";
        nameInput.classList.add("admin-field__input--error");
        valid = false;
        }

        if (!isValidHexColor(colorInput.value)) {
        $("#topping-color-error").textContent =
            "Kies een geldige kleur.";
        valid = false;
        }

        if (!isValidPrice(priceInput.value)) {
        $("#topping-price-error").textContent =
            "Vul een geldige prijs in.";
        priceInput.classList.add("admin-field__input--error");
        valid = false;
        }

        return valid;
    };

    const render = () => {
        if (!toppings.length) {
        list.innerHTML = `
            <section class="empty-state product-empty-state">
            <h2>Nog geen toppings</h2>
            <p>Voeg je eerste topping toe.</p>
            </section>
        `;
        return;
        }

        list.innerHTML = toppings.map((topping) => {
        const color = isValidHexColor(topping.color)
            ? topping.color
            : DEFAULT_COLOR;

        return `
            <article class="product-card topping-card">
            <div
                class="topping-card__visual"
                style="--topping-color:${escapeHtml(color)}"
            >
                <div class="topping-card__pieces">
                <span></span><span></span><span></span>
                <span></span><span></span>
                </div>
                <span class="topping-card__color-code">
                ${escapeHtml(color.toUpperCase())}
                </span>
            </div>

            <div class="product-card__body">
                <div class="product-card__heading">
                <div>
                    <p class="product-card__eyebrow">Ice cream topping</p>
                    <h2 class="product-card__title">
                    ${escapeHtml(topping.name)}
                    </h2>
                </div>
                <strong class="product-card__price">
                    ${formatPrice(topping.price)}
                </strong>
                </div>

                <div class="product-card__actions">
                <button
                    class="product-action-button product-action-button--edit"
                    data-edit-topping="${topping._id}"
                    type="button"
                >
                    Bewerken
                </button>
                <button
                    class="product-action-button product-action-button--delete"
                    data-delete-topping="${topping._id}"
                    type="button"
                >
                    Verwijderen
                </button>
                </div>
            </div>
            </article>
        `;
        }).join("");
    };

    const load = async () => {
        list.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Toppings laden...</p>
        </div>
        `;

        try {
        toppings = await getToppings();
        render();
        } catch (error) {
        list.innerHTML = `
            <section class="error-state">
            <h2>Toppings laden mislukt</h2>
            <p>${escapeHtml(error.message)}</p>
            <button
                class="button button--primary"
                data-retry-toppings
                type="button"
            >
                Opnieuw proberen
            </button>
            </section>
        `;
        }
    };

    $("#add-topping-button").addEventListener(
        "click",
        () => openForm()
    );

    nameInput.addEventListener("input", updatePreview);
    colorInput.addEventListener("input", updatePreview);

    list.addEventListener("click", (event) => {
        if (event.target.closest("[data-retry-toppings]")) {
        load();
        return;
        }

        const editButton = event.target.closest("[data-edit-topping]");
        const deleteButton = event.target.closest("[data-delete-topping]");

        if (editButton) {
        const topping = toppings.find(
            (item) => item._id === editButton.dataset.editTopping
        );
        if (topping) openForm(topping);
        }

        if (deleteButton) {
        toppingToDelete = toppings.find(
            (item) => item._id === deleteButton.dataset.deleteTopping
        );

        if (toppingToDelete) {
            $("#delete-topping-description").textContent =
            `“${toppingToDelete.name}” wordt definitief verwijderd.`;
            deleteModal.open();
        }
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!validate()) return;

        const data = {
        name: nameInput.value.trim(),
        color: colorInput.value,
        price: Number(priceInput.value)
        };

        saveButton.disabled = true;

        try {
        if (toppingToEdit) {
            const updated = await updateTopping(
            toppingToEdit._id,
            data
            );

            toppings = toppings.map((item) =>
            item._id === updated._id ? updated : item
            );

            feedback.show("De topping is aangepast.");
        } else {
            const created = await createTopping(data);
            toppings = [created, ...toppings];
            feedback.show("De topping is toegevoegd.");
        }

        render();
        formModal.close();
        } catch (error) {
        feedback.show(error.message, "error");
        } finally {
        saveButton.disabled = false;
        }
    });

    $("#confirm-delete-topping-button").addEventListener(
        "click",
        async () => {
        if (!toppingToDelete) return;

        const button = $("#confirm-delete-topping-button");
        button.disabled = true;

        try {
            await deleteTopping(toppingToDelete._id);

            toppings = toppings.filter(
            (item) => item._id !== toppingToDelete._id
            );

            render();
            deleteModal.close();
            feedback.show("De topping is verwijderd.");
        } catch (error) {
            feedback.show(error.message, "error");
        } finally {
            button.disabled = false;
        }
        }
    );

    await load();
};
