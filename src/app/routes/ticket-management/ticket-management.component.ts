import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '@shared';
import {
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ProductMangementService } from 'app/services/product-mangement.service';
import { CommonModule } from '@angular/common'
import { MatDialogModule } from '@angular/material/dialog';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-ticket-management',
  standalone: true,
  imports: [
    MatCardModule,
    PageHeaderComponent,
    MtxGridModule,
    MatFormFieldModule,
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatIcon
  ],
  templateUrl: './ticket-management.component.html',
  styleUrl: './ticket-management.component.css'
})
export class TicketManagementComponent {
  // [x: string]: any;
  columnSortable = true;
  rowHover = false;
  rowStriped = false;
  showPaginator = true;
  isLoading = false;
  pageNo: number = 0;
  pageSize: number = 50;
  selectedValue: any;
  options: string[] = ['Option 1', 'Option 2', 'Option 3'];
  columns: MtxGridColumn[] = [
    {
      header: 'S.No',
      field: 'sNo',
      minWidth: 50,
      width: '100px',
    },
    {
      header: 'Tracker',
      field: 'type',
      sortable: true,
      minWidth: 100,
      width: '100px',
    },
    {
      header: 'Issue Related',
      field: 'issue_related',
      sortable: true,
      minWidth: 100,
      width: '100px',
    },
    {
      header: 'Priority',
      field: 'priority',
      sortable: true,
      minWidth: 100,
      width: '100px',
    },
    {
      header: 'Status',
      field: 'status',
      sortable: true,
      minWidth: 100,
      width: '100px',
    },
    {
      header: 'Assignee',
      field: 'assignee',
      sortable: true,
      minWidth: 100,
      width: '100px',
    },
    {
      field: 'operation',
      minWidth: 140,
      width: '140px',
      pinned: 'right',
      type: 'button',
      buttons: [
        {
          type: 'icon',
          icon: 'edit',
          tooltip: 'Edit the customer',
          // click: record => ,
        },
        {
          type: 'icon',
          color: 'warn',
          icon: 'delete',
          tooltip: 'Delete the customer',
          // click: record => this.openDeleteConfirmation(record),
        },
      ],
    },
  ];
  list: any[] = [{"sNo":1,"type":"Software","issue_related":"hardware","assignee":"Shiv",
  "priority":"High","status":"New"
  }];
  filters: Array<any> = []
  onPaginateChange(event: any) {
  }
  
  toggleDropdown(selectElement: any) {
    selectElement.toggle();
  }
}
