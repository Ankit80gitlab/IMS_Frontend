import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { DatePipe, NgStyle } from '@angular/common';
import { TicketManagementService } from 'app/services/ticket-management.service';
import { Router } from '@angular/router';
import { WebsocketService } from 'app/services/websocket.service';
import { SharedWebSocketService } from 'app/services/shared-websocket.service';
import { TokenService } from '@core';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.html',
  styleUrl: './notification.css',
  standalone: true,
  imports: [MatBadgeModule, MatButtonModule, MatIconModule, MatListModule, MatMenuModule, NgStyle],
  providers: [DatePipe]
})
export class NotificationComponent {

  private ticketService = inject(TicketManagementService);
  private webSocketService = inject(WebsocketService);
  private tokenService = inject(TokenService);

  constructor(private datePipe: DatePipe, private router: Router, private cdr: ChangeDetectorRef, private sharedWebsocketService: SharedWebSocketService) { }

  notifications: any = [];

  ngOnInit() {
    this.webSocketService.establishConnection(this.tokenService.getBearerToken());
    this.webSocketService.recieveMessage().subscribe({
      next: (resp) => {
        // console.log(resp);
        if (resp != null) {
          if (resp.created === "ticket") {
            this.initializeNotification();
            this.sharedWebsocketService.changeData(resp);
          }
        }
      }
    })
    this.initializeNotification();
  }

  initializeNotification() {
    this.ticketService.ticketNotification().subscribe({
      next: (resp) => {
        // console.log(resp);
        if (resp.status === "success") {
          this.notifications.length = 0;
          for (let i of resp.data) {
            let date = new Date(i.createdTime);
            let message = 'New ticket assigned on ' + this.datePipe.transform(date, 'yyyy-MM-dd') + ' at ' + this.datePipe.transform(date, 'HH:mm a');
            let notify = { id: i.ticketId, message: message, createdTime: i.createdTime };
            this.notifications.push(notify);
          }
          this.notifications.sort((a: any, b: any) => {
            return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime();
          });
          this.cdr.detectChanges();
        }
      }, error(err) {
        console.log(err);
      },
    })
  }

  ngOnDestroy() {
    // console.log("destroyed");
    
  }

  handleClick(ticketId: any) {
    // console.log(ticketId);
    const frmData = new FormData();
    frmData.append("id", ticketId);
    frmData.append("isViewed", "true");
    this.ticketService.updateTicket(frmData).subscribe({
      next: (resp) => {
        if (resp.status === 'success') {
          this.initializeNotification();
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate(['/ticketDetail/' + ticketId]);
          });
          // this.router.navigateByUrl('/ticketDetail/' + ticketId);
        }
      },
      error(err) {
        console.log(err);
      },
    })
  }
}
