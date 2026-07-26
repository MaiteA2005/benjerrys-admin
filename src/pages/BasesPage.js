import {
    getBases,
    createBase,
    updateBase,
    deleteBase
} from "../api/api.js";

import { createModal } from "../components/Modal.js";
import {
    createFeedbackMessage
} from "../components/FeedbackMessage.js";

import {
    escapeHtml,
    formatPrice,
    isValidPrice
} from "../utils/helpers.js";

const getBaseTypeLabel = (type) =>
    ({
        cone: "Hoorntje",
        cup: "Potje"
    })[type] || "Onbekend";

export const renderBasesPage = async (container) => {
    let bases = [];
    let baseToEdit = null;
    let baseToDelete = null;

    container.innerHTML = `
        <header class="admin-header">
        <div>
            <p class="admin-header__eyebrow">Productbeheer</p>
            <h1 class="admin-header__title">Bases</h1>
            <p class="admin-header__description">
            Beheer de beschikbare hoorntjes en potjes.
            </p>
        </div>

        <button
            id="add-base-button"
            class="refresh-button"
            type="button"
        >
            + Nieuwe base
        </button>
        </header>

        <div
        id="base-feedback"
        class="feedback-message"
        hidden
        ></div>

        <section id="bases-container" class="product-grid"></section>

        <div id="base-form-modal" class="modal" hidden>
        <div class="modal__overlay" data-close-base-form></div>

        <section
            class="modal__dialog modal__dialog--form"
            role="dialog"
            aria-modal="true"
        >
            <header class="form-modal__header">
            <div>
                <p class="form-modal__eyebrow">Basebeheer</p>
                <h2 id="base-form-title" class="modal__title">
                Nieuwe base
                </h2>
            </div>

            <button
                class="modal-close-button"
                type="button"
                data-close-base-form
                aria-label="Venster sluiten"
            >
                ×
            </button>
            </header>

            <form id="base-form" class="admin-form" novalidate>
            <label class="admin-field">
                <span class="admin-field__label">Naam</span>
                <input
                id="base-name"
                class="admin-field__input"
                type="text"
                maxlength="50"
                placeholder="Bijvoorbeeld Hoorntje"
                />
                <span id="base-name-error" class="admin-field__error"></span>
            </label>

            <label class="admin-field">
                <span class="admin-field__label">Type</span>
                <select id="base-type" class="admin-field__input">
                <option value="cone">Hoorntje</option>
                <option value="cup">Potje</option>
                </select>
                <span id="base-type-error" class="admin-field__error"></span>
            </label>

            <label class="admin-field">
                <span class="admin-field__label">Prijs</span>
                <div class="price-input">
                <span class="price-input__prefix">€</span>
                <input
                    id="base-price"
                    class="admin-field__input admin-field__input--price"
                    type="number"
                    min="0"
                    step="0.01"
                    value="0"
                />
                </div>
                <span id="base-price-error" class="admin-field__error"></span>
            </label>

            <label class="admin-field">
                <span class="admin-field__label">Model-URL</span>
                <input
                id="base-model-url"
                class="admin-field__input"
                type="text"
                placeholder="/models/cone.glb"
                />
                <span
                id="base-model-url-error"
                class="admin-field__error"
                ></span>
            </label>

            <div class="modal__actions">
                <button
                class="button button--secondary"
                type="button"
                data-close-base-form
                >
                Annuleren
                </button>
                <button
                id="save-base-button"
                class="button button--primary"
                type="submit"
                >
                Base toevoegen
                </button>
            </div>
            </form>
        </section>
        </div>

        <div id="delete-base-modal" class="modal" hidden>
        <div class="modal__overlay" data-close-delete-base></div>

        <section class="modal__dialog" role="dialog" aria-modal="true">
            <h2 class="modal__title">Base verwijderen?</h2>
            <p
            id="delete-base-description"
            class="modal__description"
            ></p>

            <div class="modal__actions">
            <button
                class="button button--secondary"
                type="button"
                data-close-delete-base
            >
                Annuleren
            </button>
            <button
                id="confirm-delete-base-button"
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
    const list = $("#bases-container");
    const form = $("#base-form");
    const nameInput = $("#base-name");
    const typeInput = $("#base-type");
    const priceInput = $("#base-price");
    const modelUrlInput = $("#base-model-url");
    const saveButton = $("#save-base-button");

    const feedback = createFeedbackMessage($("#base-feedback"));

    const clearErrors = () => {
        ["name", "type", "price", "model-url"].forEach((field) => {
        $(`#base-${field}-error`).textContent = "";
        });

        [
        nameInput,
        typeInput,
        priceInput,
        modelUrlInput
        ].forEach((input) => {
        input.classList.remove("admin-field__input--error");
        });
    };

    const resetForm = () => {
        baseToEdit = null;
        form.reset();
        typeInput.value = "cone";
        priceInput.value = "0";
        clearErrors();
    };

    const formModal = createModal({
        element: $("#base-form-modal"),
        closeSelector: "[data-close-base-form]",
        onClose: resetForm
    });

    const deleteModal = createModal({
        element: $("#delete-base-modal"),
        closeSelector: "[data-close-delete-base]",
        onClose: () => {
        baseToDelete = null;
        }
    });

    const openForm = (base = null) => {
        resetForm();
        baseToEdit = base;

        if (base) {
        $("#base-form-title").textContent = "Base bewerken";
        saveButton.textContent = "Wijzigingen opslaan";
        nameInput.value = base.name || "";
        typeInput.value = base.type || "cone";
        priceInput.value = Number(base.price || 0);
        modelUrlInput.value = base.modelUrl || "";
        } else {
        $("#base-form-title").textContent = "Nieuwe base";
        saveButton.textContent = "Base toevoegen";
        }

        formModal.open();
        nameInput.focus();
    };

    const validate = () => {
        clearErrors();
        let valid = true;

        const setError = (field, input, message) => {
        $(`#base-${field}-error`).textContent = message;
        input.classList.add("admin-field__input--error");
        valid = false;
        };

        if (!nameInput.value.trim()) {
        setError("name", nameInput, "Vul een naam in.");
        }

        if (!["cone", "cup"].includes(typeInput.value)) {
        setError("type", typeInput, "Kies een geldig type.");
        }

        if (!isValidPrice(priceInput.value)) {
        setError("price", priceInput, "Vul een geldige prijs in.");
        }

        if (!modelUrlInput.value.trim()) {
        setError(
            "model-url",
            modelUrlInput,
            "Vul een model-URL in."
        );
        }

        return valid;
    };

    const render = () => {
        if (!bases.length) {
        list.innerHTML = `
            <section class="empty-state product-empty-state">
            <h2>Nog geen bases</h2>
            <p>Voeg je eerste hoorntje of potje toe.</p>
            </section>
        `;
        return;
        }

        list.innerHTML = bases.map((base) => `
        <article class="product-card base-card">
            <div class="base-card__visual">
            <span class="base-card__type">
                ${escapeHtml(getBaseTypeLabel(base.type))}
            </span>
            </div>

            <div class="product-card__body">
            <div class="product-card__heading">
                <div>
                <p class="product-card__eyebrow">Ice cream base</p>
                <h2 class="product-card__title">
                    ${escapeHtml(base.name)}
                </h2>
                </div>

                <strong class="product-card__price">
                ${formatPrice(base.price)}
                </strong>
            </div>

            <dl class="product-card__details">
                <div>
                <dt>Type</dt>
                <dd>${escapeHtml(getBaseTypeLabel(base.type))}</dd>
                </div>
                <div>
                <dt>Model</dt>
                <dd class="product-card__model-url">
                    ${escapeHtml(base.modelUrl || "Geen model")}
                </dd>
                </div>
            </dl>

            <div class="product-card__actions">
                <button
                class="product-action-button product-action-button--edit"
                data-edit-base="${base._id}"
                type="button"
                >
                Bewerken
                </button>
                <button
                class="product-action-button product-action-button--delete"
                data-delete-base="${base._id}"
                type="button"
                >
                Verwijderen
                </button>
            </div>
            </div>
        </article>
        `).join("");
    };

    const load = async () => {
        list.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Bases laden...</p>
        </div>
        `;

        try {
        bases = await getBases();
        render();
        } catch (error) {
        list.innerHTML = `
            <section class="error-state">
            <h2>Bases laden mislukt</h2>
            <p>${escapeHtml(error.message)}</p>
            <button
                class="button button--primary"
                data-retry-bases
                type="button"
            >
                Opnieuw proberen
            </button>
            </section>
        `;
        }
    };

    $("#add-base-button").addEventListener(
        "click",
        () => openForm()
    );

    list.addEventListener("click", (event) => {
        if (event.target.closest("[data-retry-bases]")) {
        load();
        return;
        }

        const editButton = event.target.closest("[data-edit-base]");
        const deleteButton = event.target.closest("[data-delete-base]");

        if (editButton) {
        const base = bases.find(
            (item) => item._id === editButton.dataset.editBase
        );
        if (base) openForm(base);
        }

        if (deleteButton) {
        baseToDelete = bases.find(
            (item) => item._id === deleteButton.dataset.deleteBase
        );

        if (baseToDelete) {
            $("#delete-base-description").textContent =
            `“${baseToDelete.name}” wordt definitief verwijderd.`;
            deleteModal.open();
        }
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!validate()) return;

        const data = {
        name: nameInput.value.trim(),
        type: typeInput.value,
        price: Number(priceInput.value),
        modelUrl: modelUrlInput.value.trim()
        };

        saveButton.disabled = true;

        try {
        if (baseToEdit) {
            const updated = await updateBase(baseToEdit._id, data);

            bases = bases.map((item) =>
            item._id === updated._id ? updated : item
            );

            feedback.show("De base is aangepast.");
        } else {
            const created = await createBase(data);
            bases = [created, ...bases];
            feedback.show("De base is toegevoegd.");
        }

        render();
        formModal.close();
        } catch (error) {
        feedback.show(error.message, "error");
        } finally {
        saveButton.disabled = false;
        }
    });

    $("#confirm-delete-base-button").addEventListener(
        "click",
        async () => {
        if (!baseToDelete) return;

        const button = $("#confirm-delete-base-button");
        button.disabled = true;

        try {
            await deleteBase(baseToDelete._id);

            bases = bases.filter(
            (item) => item._id !== baseToDelete._id
            );

            render();
            deleteModal.close();
            feedback.show("De base is verwijderd.");
        } catch (error) {
            feedback.show(error.message, "error");
        } finally {
            button.disabled = false;
        }
        }
    );

    await load();
};
