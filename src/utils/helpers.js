export const formatPrice = (price) =>
    new Intl.NumberFormat("nl-NL", {
        style: "currency",
        currency: "EUR"
    }).format(Number(price || 0));

export const formatDate = (date) =>
    new Intl.DateTimeFormat("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(new Date(date));

export const escapeHtml = (value = "") =>
    String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

export const isValidHexColor = (color = "") =>
    /^#[0-9a-fA-F]{6}$/.test(color);

export const isValidPrice = (price) =>
    price !== "" &&
    !Number.isNaN(Number(price)) &&
    Number(price) >= 0;
