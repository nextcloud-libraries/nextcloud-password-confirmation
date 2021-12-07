/// <reference types="@nextcloud/typings" />

declare var OC: Nextcloud.v21.OC | Nextcloud.v22.OC;

export default function confirm(): Promise<void> {
    if (typeof OC === 'undefined') {
        return Promise.reject(new Error('OC not defined'));
    } else if (typeof OC.PasswordConfirmation === 'undefined') {
        return Promise.reject(new Error('OC.PasswordConfirmation not defined'));
    }

    if (OC.PasswordConfirmation.requiresPasswordConfirmation()) {
        return new Promise((res, rej) => {
            OC.PasswordConfirmation.requirePasswordConfirmation(res, {}, rej);
        });
    } else {
        return Promise.resolve();
    }
}
