import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private configUrl = '/assets/backend.json';

    private backendUrlSubject: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(undefined);

    public backendUrl$ = this.backendUrlSubject.asObservable();

    constructor(private http: HttpClient) {
    }

    loadConfig(): Promise<void> {
        const request = new XMLHttpRequest();
        request.open('GET', this.configUrl, false);  // `false`
        request.send();
        if (request.status === 200) {
            this.backendUrlSubject.next(JSON.parse(request.response).url);
            return Promise.resolve();
        } else {
            const error = 'Error loading configuration:';
            console.error(error);
            return Promise.reject();
        }
    };
}
