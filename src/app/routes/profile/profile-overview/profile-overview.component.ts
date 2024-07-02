import { Component, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { CommonModule, NgIf, AsyncPipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormFieldModule, MatFormField, MatLabel, MatHint, MatError } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MtxGridModule } from '@ng-matero/extensions/grid';
import { MtxSelectModule, MtxSelect } from '@ng-matero/extensions/select';
import { PageHeaderComponent } from '@shared';
import { MatIcon } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatNavList } from '@angular/material/list';
import {MatGridListModule} from '@angular/material/grid-list';
import { UserManagementService } from 'app/services/user-management.service';

@Component({
  selector: 'app-profile-overview',
  standalone: true,
  imports: [MatCardModule,
    PageHeaderComponent,
    MatTabsModule,
    MtxGridModule,
    MatDividerModule,
    MatNavList,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    MtxSelectModule,
    MatCheckbox,
    MatFormField,
    MatLabel,
    MtxSelect,
    MatHint,
    MatIcon,
    MatError,
    NgIf,
    AsyncPipe,
    MatTableModule,
    MatGridListModule],
  templateUrl: './profile-overview.component.html',
  styleUrl: './profile-overview.component.css'
})


export class ProfileOverviewComponent {

  private userMgntService = inject(UserManagementService);

  id: any;
  username: any;
  name: any;
  email: any;
  roles:any;
  customerName: any;
  permissions: any

  ngOnInit(){
    this.userMgntService.me().subscribe({
      next : (resp:any) => {
        this.id=resp.id;
        this.name=resp.name;
        this.username=resp.username;
        this.email=resp.email;
        this.customerName=resp.customerName;
        this.roles=resp.roles;
        this.permissions=resp.permissions;
      },error(err) {
        console.log(err);
      },
    })
  }



}
