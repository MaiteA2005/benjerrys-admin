export const createFeedbackMessage = (element) => {
    let timeoutId;

    const show = (message, type = "success") => {
        window.clearTimeout(timeoutId);

        element.hidden = false;
        element.textContent = message;
        element.className =
        `feedbackMessage feedbackMessage--${type}`;

        timeoutId = window.setTimeout(() => {
        element.hidden = true;
        }, 3500);
    };

    const hide = () => {
        window.clearTimeout(timeoutId);
        element.hidden = true;
    };

    return {
        show,
        hide
    };
};
