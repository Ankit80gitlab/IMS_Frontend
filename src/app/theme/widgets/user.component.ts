import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, Subscription, tap } from 'rxjs';

import { AuthService, SettingsService, User } from '@core';
import { WebsocketService } from 'app/services/websocket.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LogoutDialogComponent } from 'app/dialog/logout-dialog/logout-dialog.component';
import { DialogService } from 'app/utility/dialog.service';

@Component({
  selector: 'app-user',
  template: `
    <button class="r-full" mat-button [matMenuTriggerFor]="menu">
      <img matButtonIcon class="avatar r-full" src="./assets/ims.png" width="24" alt="avatar" />
      <span class="m-x-8">{{ user.name }}</span>
    </button>

    <mat-menu #menu="matMenu">
      <button routerLink="/profile/overview" mat-menu-item>
        <mat-icon>account_circle</mat-icon>
        <span>{{ 'profile' | translate }}</span>
      </button>
      <button mat-menu-item (click)="logout()">
        <mat-icon>exit_to_app</mat-icon>
        <span>{{ 'logout' | translate }}</span>
      </button>
    </mat-menu>
  `,
  styles: [
    `.avatar {
        width: 24px;
        height: 24px;
      }
    `,
  ],
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatMenuModule, TranslateModule],
})

// <button routerLink="/profile/settings" mat-menu-item>
//         <mat-icon>edit</mat-icon>
//         <span>{{ 'edit_profile' | translate }}</span>
//       </button>
//       <button mat-menu-item (click)="restore()">
//         <mat-icon>restore</mat-icon>
//         <span>{{ 'restore_defaults' | translate }}</span>
//       </button>

export class UserComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly settings = inject(SettingsService);
  private readonly webSocketService = inject(WebsocketService);


  constructor(public dialog: MatDialog, private dialogService: DialogService) {

  }

  user!: User;

  ngOnInit(): void {
    this.auth
      .user()
      .pipe(
        tap(user => (this.user = user)),
        debounceTime(10)
      )
      .subscribe(() => this.cdr.detectChanges());
  }

  // logout() {
  //   this.auth.logout().subscribe(() => {
  //     this.router.navigateByUrl('/login');
  //   });
  //   this.webSocketService.close();
  // }

  logOutDialog!: MatDialogRef<LogoutDialogComponent>;
  dialogSubscription!: Subscription;

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
          this.webSocketService.close();
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

  restore() {
    this.settings.reset();
    window.location.reload();
  }
}
