export const createModal = ({
    element,
    closeSelector,
    onClose
    }) => {
    const open = () => {
        element.hidden = false;
        document.body.classList.add("modal-open");
    };

    const close = () => {
        element.hidden = true;
        document.body.classList.remove("modal-open");
        onClose?.();
    };

    element.addEventListener("click", (event) => {
        if (event.target.closest(closeSelector)) {
        close();
        }
    });

    return {
        open,
        close
    };
};
