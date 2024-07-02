import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import screenfull from 'screenfull';

import { BrandingComponent } from '../widgets/branding.component';
import { NotificationComponent } from '../widgets/notification.component';
import { UserComponent } from '../widgets/user.component';
import { SettingsService } from '@core/bootstrap/settings.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    BrandingComponent,
    NotificationComponent,
    UserComponent,
  ],
})
export class HeaderComponent {
  @HostBinding('class') class = 'matero-header';

  @Input() showToggle = true;
  @Input() showBranding = false;

  @Output() toggleSidenav = new EventEmitter<void>();
  @Output() toggleSidenavNotice = new EventEmitter<void>();
  private readonly settings = inject(SettingsService);
  
  darkTheme: boolean=this.settings.themeColor == 'dark' ? true : false;
  ngOnInit() {
    this.darkTheme=this.settings.themeColor == 'dark' ? true : false; 
    console.log("dark", this.darkTheme)
  }
  toggleFullscreen() {
    if (screenfull.isEnabled) {
      screenfull.toggle();
    }
  }

  darkMode(){
    if(this.darkTheme){
      this.settings.themeColor="light";
      this.settings.options.theme ="light"
    }else{
      this.settings.themeColor="dark";
      this.settings.options.theme ="dark"
    }
     this.darkTheme=!this.darkTheme;
     this.settings.setTheme();
  }
}
