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
                
                try {
                    // Инициализация темы и viewport
                    webApp.setHeaderColor('#ffffff');
                    webApp.setBackgroundColor('#ffffff');
                    
                    // Установка готовности приложения
                    webApp.ready();
                    webApp.expand();
                } catch (error) {
                    console.warn('Some Telegram WebApp methods failed:', error);
                    // Продолжаем работу даже если некоторые методы недоступны
                }

                setTg(webApp);
                setIsReady(true);
                console.log('Telegram WebApp initialized successfully');
            } else if (attempts < maxAttempts) {
                attempts++;
                timeoutId = setTimeout(initTelegram, 100);
                console.log('Waiting for Telegram WebApp to load...', attempts);
            } else {
                console.warn('Running in web mode without Telegram WebApp');
                setIsReady(true); // Продолжаем работу в веб-режиме
            }
        };

        initTelegram();

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, []);

    // Безопасные методы для веб-версии
    const onClose = () => {
        if (tg?.close) {
            tg.close();
        } else {
            console.warn('Close method not available in web mode');
        }
    };

    const onToggleButton = () => {
        if (!tg?.MainButton) {
            console.warn('MainButton not available in web mode');
            return;
        }

        if (tg.MainButton.isVisible) {
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
        isWebMode: !window?.Telegram?.WebApp
    };
} 