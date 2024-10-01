import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { AuthService, User } from '@core/authentication';
import { TranslateModule } from '@ngx-translate/core';
import { LogoutDialogComponent } from 'app/dialog/logout-dialog/logout-dialog.component';
import { WebsocketService } from 'app/services/websocket.service';
import { DialogService } from 'app/utility/dialog.service';
import { Toast, ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-panel',
  template: `
    <div class="matero-user-panel">
      <img class="matero-user-panel-avatar" src="./assets/ims.png" alt="avatar" width="64" />
      <h4 class="matero-user-panel-name">{{ user.name }}</h4>
      <h5 class="matero-user-panel-email">{{ user.email }}</h5>
      <div class="matero-user-panel-icons">
        <button
          mat-icon-button
          routerLink="/profile/overview"
          matTooltip="{{ 'profile' | translate }}"
        >
          <mat-icon>account_circle</mat-icon>
        </button>
        <button
          mat-icon-button
          routerLink="/profile/setting"
          matTooltip="{{ 'edit_profile' | translate }}"
        >
          <mat-icon>edit</mat-icon>
        </button>
        <button mat-icon-button (click)="logout()" matTooltip="{{ 'logout' | translate }}">
          <mat-icon>exit_to_app</mat-icon>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./user-panel.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTooltipModule, TranslateModule],
})
export class UserPanelComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private websocketService = inject(WebsocketService);
  private toastService = inject(ToastrService);

  constructor(public dialog: MatDialog, private dialogService: DialogService) { }

  user!: User;
  logOutDialog!: MatDialogRef<LogoutDialogComponent>;
  dialogSubscription!: Subscription;

  ngOnInit(): void {
    this.auth.user().subscribe(user => (this.user = user));
    this.user.email = "@cms.ims.co.in";
  }

  logout() {
    this.logOutDialog = this.dialog.open(LogoutDialogComponent, {
      width: '300px',
      autoFocus: false,
      data: '',
      disableClose: true
    });
    this.dialogSubscription = this.dialogService.dataObservable$.subscribe((result) => {
      // console.log(result);
      if (result.click === 'logout') {
        this.auth.logout().subscribe(() => {
          this.websocketService.close();
          this.logOutDialog.close();
        });
        this.router.navigateByUrl('/login');
      }
    })
  }

  ngOnDestroy() {
    if (this.dialogSubscription) {
      this.dialogSubscription.unsubscribe();
    }
  }
}
