import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketServiceService {

  private client: Client;
  private messageSubject: Subject<string> = new Subject<string>();

  constructor() {

    this.client = new Client();


    this.client.onConnect = (frame) => {
      this.client.subscribe('/topic/greetings', (message: Message) => {
        this.messageSubject.next(message.body);
      });
    };
    this.client.activate();
  }

  sendMessage(message: string) {
    this.client.publish({destination: '/app/hello', body: message});
  }

  getMessages(): Observable<string> {
    return this.messageSubject.asObservable();
  }


}
