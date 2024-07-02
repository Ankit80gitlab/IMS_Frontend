import {APP_INITIALIZER} from '@angular/core';

import {TranslateLangService} from './bootstrap/translate-lang.service';

export function TranslateLangServiceFactory(translateLangService: TranslateLangService) {
    return () => translateLangService.load();
}

import {StartupService} from './bootstrap/startup.service';
import {ConfigService} from "@core/ConfigService";

export function loadBackendConfig(configService: ConfigService) {
    return (): Promise<any> => {
        return configService.loadConfig();
    };
}

export function StartupServiceFactory(startupService: StartupService) {
    return () => startupService.load();
}

export const appInitializerProviders = [
    {
        provide: APP_INITIALIZER,
        useFactory: loadBackendConfig,
        deps: [ConfigService],
        multi: true
    },
    {
        provide: APP_INITIALIZER,
        useFactory: TranslateLangServiceFactory,
        deps: [TranslateLangService],
        multi: true,
    },
    {
        provide: APP_INITIALIZER,
        useFactory: StartupServiceFactory,
        deps: [StartupService],
        multi: true,
    },
];
