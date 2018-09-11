export default function confirm() {
    if (typeof OC === 'undefined') {
        return Promise.reject(new Error('OC not defined'));
    } else if (typeof OC.PasswordConfirmation === 'undefined') {
        return Promise.reject(new Error('OC.PasswordConfirmation not defined'));
    }

    if (OC.PasswordConfirmation.requiresPasswordConfirmation()) {
        return new Promise((res, _rej) => {
            OC.PasswordConfirmation.requirePasswordConfirmation(res);
        });
    } else {
        return Promise.resolve();
    }
}
