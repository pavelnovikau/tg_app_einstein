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
                
                // Инициализация темы и viewport
                webApp.setHeaderColor('#ffffff');
                webApp.setBackgroundColor('#ffffff');
                
                // Установка готовности приложения
                webApp.ready();
                webApp.expand();

                setTg(webApp);
                setIsReady(true);
                console.log('Telegram WebApp initialized successfully');
            } else if (attempts < maxAttempts) {
                attempts++;
                timeoutId = setTimeout(initTelegram, 100);
                console.log('Waiting for Telegram WebApp to load...', attempts);
            } else {
                console.error('Failed to initialize Telegram WebApp');
                setIsReady(true); // Continue anyway for web testing
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
        tg?.close();
    };

    const onToggleButton = () => {
        if (tg?.MainButton.isVisible) {
            tg.MainButton.hide();
        } else {
            tg.MainButton.show();
        }
    };

    return {
        onClose,
        onToggleButton,
        tg,
        user: tg?.initDataUnsafe?.user,
        queryId: tg?.initDataUnsafe?.query_id,
        isReady,
    };
} 