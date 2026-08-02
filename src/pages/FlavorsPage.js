import {
    getFlavors,
    createFlavor,
    updateFlavor,
    deleteFlavor
} from "../api/api.js";

import { createModal } from "../components/Modal.js";
import {
    createFeedbackMessage
} from "../components/FeedbackMessage.js";

import {
    escapeHtml,
    formatPrice,
    isValidHexColor,
    isValidPrice
} from "../utils/helpers.js";

const DEFAULT_COLOR = "#edb8cc";

export const renderFlavorsPage = async (container) => {
    let flavors = [];
    let flavorToEdit = null;
    let flavorToDelete = null;

    container.innerHTML = `
        <header class="admin-header">
        <div>
            <p class="adminSubtitle">Productbeheer</p>
            <h1 class="adminTitle">Smaken</h1>
            <p class="adminDescription">
            Beheer de namen, kleuren en prijzen van de beschikbare smaken.
            </p>
        </div>

        <button
            id="add-flavor-button"
            class="refreshButton"
            type="button"
        >
            + Nieuwe smaak
        </button>
        </header>

        <div
        id="flavor-feedback"
        class="feedbackMessage"
        hidden
        ></div>

        <section
        id="flavors-container"
        class="product-grid flavor-grid"
        ></section>

        <div id="flavor-form-modal" class="modal" hidden>
        <div
            class="modalOverlay"
            data-close-flavor-form
        ></div>

        <section
            class="modalDialog modalDialogForm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="flavor-form-title"
        >
            <header class="formHeader">
            <div>
                <p class="formSubtitle">Smaakbeheer</p>
                <h2 id="flavor-form-title" class="modalTitle">
                Nieuwe smaak
                </h2>
            </div>

            <button
                class="closeButton"
                type="button"
                data-close-flavor-form
                aria-label="Venster sluiten"
            >
                ×
            </button>
            </header>

            <form id="flavor-form" class="adminForm" novalidate>
            <section class="flavor-form-preview">
                <div
                id="flavor-preview-scoop"
                class="flavor-form-preview__scoop"
                ></div>

                <div>
                <p class="flavor-form-preview__label">Voorbeeld</p>
                <strong
                    id="flavor-preview-name"
                    class="flavor-form-preview__name"
                >
                    Nieuwe smaak
                </strong>
                <span
                    id="flavor-preview-color"
                    class="flavor-form-preview__color"
                ></span>
                </div>
            </section>

            <label class="formField">
                <span class="fieldLabel">Naam</span>
                <input
                id="flavor-name"
                class="fieldInput"
                type="text"
                maxlength="50"
                placeholder="Bijvoorbeeld Chocolate Fudge"
                />
                <span
                id="flavor-name-error"
                class="formFieldError"
                ></span>
            </label>

            <label class="formField">
                <span class="fieldLabel">Kleur</span>
                <div class="admin-color-picker">
                <input
                    id="flavor-color"
                    class="admin-color-picker__input"
                    type="color"
                    value="${DEFAULT_COLOR}"
                />
                <span
                    id="flavor-color-value"
                    class="admin-color-picker__value"
                ></span>
                </div>
                <span
                id="flavor-color-error"
                class="formFieldError"
                ></span>
            </label>

            <label class="formField">
                <span class="fieldLabel">Prijs</span>
                <div class="priceInput">
                <span class="priceInputPrefix">€</span>
                <input
                    id="flavor-price"
                    class="fieldInput fieldInputPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value="0"
                />
                </div>
                <span
                id="flavor-price-error"
                class="formFieldError"
                ></span>
            </label>

            <div class="modalActions">
                <button
                class="button button secondary"
                type="button"
                data-close-flavor-form
                >
                Annuleren
                </button>
                <button
                id="save-flavor-button"
                class="button buttonPrimary"
                type="submit"
                >
                Smaak toevoegen
                </button>
            </div>
            </form>
        </section>
        </div>

        <div id="delete-flavor-modal" class="modal" hidden>
        <div
            class="modalOverlay"
            data-close-delete-flavor
        ></div>

        <section class="modalDialog" role="dialog" aria-modal="true">
            <h2 class="modalTitle">Smaak verwijderen?</h2>
            <p
            id="delete-flavor-description"
            class="modalDescription"
            ></p>

            <div class="modalActions">
            <button
                class="button button secondary"
                type="button"
                data-close-delete-flavor
            >
                Annuleren
            </button>
            <button
                id="confirm-delete-flavor-button"
                class="button danger"
                type="button"
            >
                Verwijderen
            </button>
            </div>
        </section>
        </div>
    `;

    const $ = (selector) => container.querySelector(selector);

    const list = $("#flavors-container");
    const form = $("#flavor-form");
    const nameInput = $("#flavor-name");
    const colorInput = $("#flavor-color");
    const priceInput = $("#flavor-price");
    const saveButton = $("#save-flavor-button");
    const formTitle = $("#flavor-form-title");

    const feedback = createFeedbackMessage(
        $("#flavor-feedback")
    );

    const clearErrors = () => {
        ["name", "color", "price"].forEach((field) => {
        $(`#flavor-${field}-error`).textContent = "";
        });

        nameInput.classList.remove("fieldInput--error");
        priceInput.classList.remove("fieldInput--error");
    };

    const updatePreview = () => {
        const color = colorInput.value || DEFAULT_COLOR;

        $("#flavor-preview-name").textContent =
        nameInput.value.trim() || "Nieuwe smaak";

        $("#flavor-preview-color").textContent =
        color.toUpperCase();

        $("#flavor-color-value").textContent =
        color.toUpperCase();

        $("#flavor-preview-scoop").style.backgroundColor = color;
    };

    const resetForm = () => {
        flavorToEdit = null;
        form.reset();
        colorInput.value = DEFAULT_COLOR;
        priceInput.value = "0";
        clearErrors();
        updatePreview();
    };

    const formModal = createModal({
        element: $("#flavor-form-modal"),
        closeSelector: "[data-close-flavor-form]",
        onClose: resetForm
    });

    const deleteModal = createModal({
        element: $("#delete-flavor-modal"),
        closeSelector: "[data-close-delete-flavor]",
        onClose: () => {
        flavorToDelete = null;
        }
    });

    const openForm = (flavor = null) => {
        resetForm();
        flavorToEdit = flavor;

        if (flavor) {
        formTitle.textContent = "Smaak bewerken";
        saveButton.textContent = "Wijzigingen opslaan";
        nameInput.value = flavor.name || "";
        colorInput.value = isValidHexColor(flavor.color)
            ? flavor.color
            : DEFAULT_COLOR;
        priceInput.value = Number(flavor.price || 0);
        } else {
        formTitle.textContent = "Nieuwe smaak";
        saveButton.textContent = "Smaak toevoegen";
        }

        updatePreview();
        formModal.open();
        nameInput.focus();
    };

    const validate = () => {
        clearErrors();
        let valid = true;

        if (!nameInput.value.trim()) {
        $("#flavor-name-error").textContent =
            "Vul een naam in.";
        nameInput.classList.add("fieldInput--error");
        valid = false;
        }

        if (!isValidHexColor(colorInput.value)) {
        $("#flavor-color-error").textContent =
            "Kies een geldige kleur.";
        valid = false;
        }

        if (!isValidPrice(priceInput.value)) {
        $("#flavor-price-error").textContent =
            "Vul een geldige prijs in.";
        priceInput.classList.add("fieldInput--error");
        valid = false;
        }

        return valid;
    };

    const render = () => {
        if (!flavors.length) {
        list.innerHTML = `
            <section class="emptyState product-emptyState">
            <h2>Nog geen smaken</h2>
            <p>Voeg je eerste smaak toe.</p>
            </section>
        `;
        return;
        }

        list.innerHTML = flavors.map((flavor) => {
        const color = isValidHexColor(flavor.color)
            ? flavor.color
            : DEFAULT_COLOR;

        return `
            <article class="product-card flavor-card">
            <div
                class="flavor-card__visual"
                style="--flavor-color:${escapeHtml(color)}"
            >
                <div class="flavor-card__scoop"></div>
                <span class="flavor-card__color-code">
                ${escapeHtml(color.toUpperCase())}
                </span>
            </div>

            <div class="product-card__body">
                <div class="product-card__heading">
                <div>
                    <p class="product-card__eyebrow">Ice cream flavor</p>
                    <h2 class="product-card__title">
                    ${escapeHtml(flavor.name)}
                    </h2>
                </div>
                <strong class="product-card__price">
                    ${formatPrice(flavor.price)}
                </strong>
                </div>

                <div class="product-card__actions">
                <button
                    class="product-action-button product-action-button--edit"
                    data-edit-flavor="${flavor._id}"
                    type="button"
                >
                    Bewerken
                </button>
                <button
                    class="product-action-button product-action-button--delete"
                    data-delete-flavor="${flavor._id}"
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
        <div class="loadingState">
            <div class="loadingSpinner"></div>
            <p>Smaken laden...</p>
        </div>
        `;

        try {
        flavors = await getFlavors();
        render();
        } catch (error) {
        list.innerHTML = `
            <section class="errorState">
            <h2>Smaken laden mislukt</h2>
            <p>${escapeHtml(error.message)}</p>
            <button
                class="button buttonPrimary"
                data-retry-flavors
                type="button"
            >
                Opnieuw proberen
            </button>
            </section>
        `;
        }
    };

    $("#add-flavor-button").addEventListener(
        "click",
        () => openForm()
    );

    nameInput.addEventListener("input", updatePreview);
    colorInput.addEventListener("input", updatePreview);

    list.addEventListener("click", (event) => {
        if (event.target.closest("[data-retry-flavors]")) {
        load();
        return;
        }

        const editButton = event.target.closest("[data-edit-flavor]");
        const deleteButton = event.target.closest("[data-delete-flavor]");

        if (editButton) {
        const flavor = flavors.find(
            (item) => item._id === editButton.dataset.editFlavor
        );
        if (flavor) openForm(flavor);
        }

        if (deleteButton) {
        flavorToDelete = flavors.find(
            (item) => item._id === deleteButton.dataset.deleteFlavor
        );

        if (flavorToDelete) {
            $("#delete-flavor-description").textContent =
            `“${flavorToDelete.name}” wordt definitief verwijderd.`;
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
        if (flavorToEdit) {
            const updated = await updateFlavor(
            flavorToEdit._id,
            data
            );

            flavors = flavors.map((item) =>
            item._id === updated._id ? updated : item
            );

            feedback.show("De smaak is aangepast.");
        } else {
            const created = await createFlavor(data);
            flavors = [created, ...flavors];
            feedback.show("De smaak is toegevoegd.");
        }

        render();
        formModal.close();
        } catch (error) {
        feedback.show(error.message, "error");
        } finally {
        saveButton.disabled = false;
        }
    });

    $("#confirm-delete-flavor-button").addEventListener(
        "click",
        async () => {
        if (!flavorToDelete) return;

        const button = $("#confirm-delete-flavor-button");
        button.disabled = true;

        try {
            await deleteFlavor(flavorToDelete._id);

            flavors = flavors.filter(
            (item) => item._id !== flavorToDelete._id
            );

            render();
            deleteModal.close();
            feedback.show("De smaak is verwijderd.");
        } catch (error) {
            feedback.show(error.message, "error");
        } finally {
            button.disabled = false;
        }
        }
    );

    await load();
};
