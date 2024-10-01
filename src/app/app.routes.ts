import { Routes } from '@angular/router';
import { authGuard } from '@core';
import { AdminLayoutComponent } from '@theme/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from '@theme/auth-layout/auth-layout.component';
import { DashboardComponent } from './routes/dashboard/dashboard.component';
import { Error403Component } from './routes/sessions/403.component';
import { Error404Component } from './routes/sessions/404.component';
import { Error500Component } from './routes/sessions/500.component';
import { LoginComponent } from './routes/sessions/login/login.component';
import { RegisterComponent } from './routes/sessions/register/register.component';
import { ProductManagementComponent } from './routes/product-management/product-management.component';
import {RoleManagementComponent} from "./routes/role-management/role-management.component";
import {TicketManagementComponent} from "./routes/ticket-management/ticket-management.component";
import {DeviceConfigurationComponent} from "./routes/device-configuration/device-configuration.component";
import {MapviewComponent} from "./routes/mapview/mapview.component";
import {CustomerManagementComponent} from "./routes/customer-management/customer-management.component";
import { MyComponent } from './routes/user-management/user-management.component';
import { ProfileSettingComponent } from './routes/profile/profile-setting/profile-setting.component';
import { ProfileOverviewComponent } from './routes/profile/profile-overview/profile-overview.component';
import { TicketDetailComponent } from './routes/ticket-detail/ticket-detail.component';
import { TicketAttachmentComponent } from './routes/ticket-attachment/ticket-attachment.component';
import { ResetPasswordComponent } from './routes/sessions/reset-password/reset-password.component';
import { ForgotUsernameComponent } from './routes/sessions/forgot-username/forgot-username.component';
import { Mapv2Component } from './routes/mapv2/mapv2.component';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      // { path: '', redirectTo: 'profile/overview', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'admin', component: RoleManagementComponent },
      { path: '403', component: Error403Component },
      { path: '404', component: Error404Component },
      { path: '500', component: Error500Component },
      { path: 'productManagement', component: ProductManagementComponent },
      { path: 'userManagement', component: MyComponent },
      { path: 'roleManagement', component: RoleManagementComponent },
      { path: 'ticketManagement', component: TicketManagementComponent },
      { path: 'deviceConfiguration', component: DeviceConfigurationComponent },
      { path: 'mapView', component: MapviewComponent },
      { path: 'customerManagement', component: CustomerManagementComponent },
      { path: 'profile/overview', component: ProfileOverviewComponent },
      { path: 'profile/setting', component: ProfileSettingComponent },
      { path: 'ticketDetail/:id', component: TicketDetailComponent },
      { path: 'ticketDetail/subticket/:id', component: TicketDetailComponent },
      { path: 'attachments/:id', component: TicketAttachmentComponent },
      { path: 'ticketDetail', component: TicketDetailComponent },
      { path: 'mapView2', component: Mapv2Component },
    ],
  },
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'resetPassword', component: ResetPasswordComponent },
      { path: 'forgetPassword', component: ResetPasswordComponent },
      { path: 'forgotUsername', component: ForgotUsernameComponent },

    ],
  },
  { path: '**', redirectTo: 'dashboard' },
  { path: 'product', component: ProductManagementComponent },
  
];
