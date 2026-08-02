export const createModal = ({
    element,
    closeSelector,
    onClose
    }) => {
    const open = () => {
        element.hidden = false;
        document.body.classList.add("modalOpen");
    };

    const close = () => {
        element.hidden = true;
        document.body.classList.remove("modalOpen");
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
