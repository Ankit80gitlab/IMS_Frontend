import {HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {ConfigService} from "@core/ConfigService";


@Injectable()
export class BaseUrlInterceptor implements HttpInterceptor {

    private baseUrl!: string | undefined;

    constructor(private configService: ConfigService) {
        configService.backendUrl$.subscribe(url => {
            this.baseUrl = url;
        });
    }

    private hasScheme = (url: string) => this.baseUrl && new RegExp('^http(s)?://', 'i').test(url);

    intercept(request: HttpRequest<unknown>, next: HttpHandler) {
        return this.hasScheme(request.url) === false
            ? next.handle(request.clone({url: this.prependBaseUrl(request.url)}))
            : next.handle(request);
    }

    private prependBaseUrl(url: string) {
        return [this.baseUrl?.replace(/\/$/g, ''), url.replace(/^\.?\//, '')]
            .filter(val => val)
            .join('/');
    }
}
