import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { Menu } from '@core';
import { Token, User } from './interface';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  protected readonly http = inject(HttpClient);

   login(username: string, password: string) {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' });
    return this.http.post<any>("/login",body.toString(), { headers });
   }

  refresh(params: Record<string, any>) {
    return this.http.post<Token>('/refresh', params);
  }

  logout() {
    return this.http.get<any>('/logout', {});
  }

  me() {
    return this.http.get<User>('/userInfo');
  }

  menu() {
    return this.http.get<{ menu: Menu[] }>(window.location.protocol + '//' + window.location.host +'/assets/data/menu.json?_t=' + Date.now()).pipe(map(res => res.menu));
  }
}
