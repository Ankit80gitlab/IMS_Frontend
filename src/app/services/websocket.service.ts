import { inject, Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable } from 'rxjs';
import { AuthService, TokenService } from '@core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '@core/ConfigService';

@Injectable({
  providedIn: 'root'
})


export class WebsocketService {

  private socket$!: WebSocketSubject<any>;
  private baseUrl!: any;
  private tokenService = inject(TokenService);

  constructor(private configService: ConfigService) {
  }

  establishConnection(token:any){
    this.configService.backendUrl$.subscribe(url => {
      this.baseUrl = url;
    });
    let bUrl = new URL(this.baseUrl);
    const url = `ws://` + bUrl.host + `/ws?token=${token}`;
    this.socket$ = webSocket({
      url: url,
      openObserver: {
        next: () => {
          console.log('connetion ok');
        }
      },
    });
  }

  sendMessage(message: string): void {
    this.socket$.next(message);
  }

  recieveMessage(): Observable<any> {
    return this.socket$.asObservable();
  }

  close(): void {
    console.log('connection closed');
    this.socket$.complete();
  }

}
