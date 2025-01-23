import React, { useState, useEffect } from 'react';

export function useTelegram() {
    const [tg, setTg] = useState(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        let timeoutId;
        const maxAttempts = 10;
        let attempts = 0;

        const initTelegram = () => {
            if (window?.Telegram?.WebApp) {
                const webApp = window.Telegram.WebApp;
                setTg(webApp);
                webApp.ready();
                setIsReady(true);
                console.log('Telegram WebApp initialized successfully');
            } else if (attempts < maxAttempts) {
                attempts++;
                timeoutId = setTimeout(initTelegram, 100);
                console.log('Waiting for Telegram WebApp to load...', attempts);
            } else {
                console.error('Failed to initialize Telegram WebApp');
                setIsReady(true); // Continue anyway
            }
        };

        initTelegram();

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, []);

    const onClose = () => {
        tg.close()
    }

    const onToggleButton = () => {
        if (tg.MainButton.isVisible) {
            tg.MainButton.hide();
        } else {
            tg.MainButton.show();
        }
    }

    return {
        onClose,
        onToggleButton,
        tg,
        user: tg?.initDataUnsafe?.user,
        queryId: tg?.initDataUnsafe?.query_id,
        isReady,
    }
} 