import {
  Component,
  HostBinding,
  Input,
  OnInit,
  ViewEncapsulation,
  booleanAttribute,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {CommonModule} from '@angular/common';
import {MenuService, SettingsService} from '@core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [BreadcrumbComponent, TranslateModule,CommonModule],
})
export class PageHeaderComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly menu = inject(MenuService);
  private readonly settings = inject(SettingsService);

  @HostBinding('class') get hostClasses(): string {
    return this.getShowPageHeader() ? "matero-page-header" : ""
  }

  @Input() title = '';
  @Input() subtitle = '';
  @Input() nav: string[] = [];
  @Input({ transform: booleanAttribute }) hideBreadcrumb = false;

  ngOnInit() {
    this.nav = Array.isArray(this.nav) ? this.nav : [];

    if (this.nav.length === 0) {
      this.genBreadcrumb();
    }

    this.title = this.title || this.nav[this.nav.length - 1];
  }

  genBreadcrumb() {
    const routes = this.router.url.slice(1).split('/');
    this.nav = this.menu.getLevel(routes);
    this.nav.unshift('home');
  };
  getShowPageHeader(): boolean {
    return this.settings.getShowPageHeader();
  }
}
