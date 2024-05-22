import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '@shared';
import { MtxGrid, MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { Sort } from '@angular/material/sort';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormGroupDirective } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { MtxSelect } from '@ng-matero/extensions/select';
import { ProductMangementService } from 'app/services/product-mangement.service';
import { CustomerManagementService } from 'app/services/customer-management.service';
export interface CustomerElement {
  name: string;
  id: number;
  state: string;
  city: string;
  sNo: number;
}
@Component({
  selector: 'app-customer-management',
  standalone: true,
  imports: [
    MatCardModule,
    PageHeaderComponent,
    MtxGridModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    CommonModule,
    MtxSelect,
  ],
  templateUrl: './customer-management.component.html',
  styleUrl: './customer-management.component.css',
})
export class CustomerManagementComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastrService);
  private custmgntServ = inject(CustomerManagementService);
  pageNo: number = 0;
  pageSize: number = 50;
  totalRecords: number = 0;
  customerForm!: FormGroup;
  @ViewChild('input')
  input!: ElementRef;
  @ViewChild('grid')
  grid!: MtxGrid;
  private prodmgntServ = inject(ProductMangementService);
  products: any;
  columns: MtxGridColumn[] = [
    {
      header: 'S.No',
      field: 'sNo',
      minWidth: 100,
      width: '100px',
    },
    {
      header: 'Name',
      field: 'name',
      sortable: true,
      minWidth: 100,
      width: '100px',
    },
    {
      header: 'State',
      field: 'state',
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
          click: record => this.edit(record),
        },
        {
          type: 'icon',
          color: 'warn',
          icon: 'delete',
          tooltip: 'Delete the customer',
          pop: {
            title: 'Confirm delete?',
            closeText: 'No',
            okText: 'Yes',
          },
          click: record => this.deleteCustomerApi(record),
        },
      ],
    },
  ];
  list: any[] = [];
  isLoading = false;
  columnSortable = true;
  rowHover = true;
  rowStriped = true;
  showPaginator = true;
  editorTitle: string = 'Add Customer';
  buttonText: string = 'Save';
  ngOnInit(): void {
    this.getData();
    this.getProducts();
  }
  constructor() {
    this.customerForm = this.fb.nonNullable.group({
      id: [],
      sNo: [],
      name: ['', [Validators.required]],
      state: ['', [Validators.required]],
      city: ['', [Validators.required]],
      productIds: [[]],
    });
  }
  getProducts() {
    this.prodmgntServ.getProducts().subscribe({
      next: (resp: any) => {
        let i = 0;
        this.products = resp.data;
      },
      error: (err: any) => {
        console.log(err);
        alert('SOMETHING_WENT_WRONG_TRY_AGAIN_LATER');
      },
    });
  }
  edit(value: any) {
    this.editorTitle = 'Update Customer';
    this.buttonText = 'Update';
    this.customerForm.patchValue(value);
  }

  changeSort($event: Sort) {}
  onPaginateChange(event: any) {
    console.log('paginate', event);
    if (event.pageSize != this.pageSize) {
      this.list=[]
      this.pageNo = 0;
      this.pageSize = event.pageSize;
      // this.getData();
    } else if (event.pageIndex >= this.pageNo) {
      // this.getData();
    }
  }

  onSubmit(formGroupDirective: FormGroupDirective) {
    if (this.customerForm.valid) {
      this.editorTitle = 'Add Customer';
      this.buttonText = 'Save';
      this.customerForm.reset()
      formGroupDirective.resetForm();
    }
  }
  addNew(formGroupDirective: FormGroupDirective) {
    this.customerForm.reset();
    formGroupDirective.resetForm();
    this.editorTitle = 'Add Customer';
    this.buttonText = 'Save';
  }
  getData() {
    this.custmgntServ.getAllCustomer(this.pageNo, this.pageSize).subscribe({
      next: (resp: any) => {
        console.log(resp);
        let i = 0;
        if (resp.data.length == 0) {
          this.toast.success('No Customers Found');
        }
        resp.data.forEach((customer: CustomerElement) => {
          customer.sNo = this.pageSize * this.pageNo + i + 1;
          this.list.push(customer);
          i++;
        });
        this.grid.dataSource.data = this.list;
        this.pageNo = this.pageNo + 1;
        this.totalRecords = this.totalRecords + this.pageSize + 1;
      },
      error: (err: any) => {
        console.log(err);
        alert('SOMETHING_WENT_WRONG_TRY_AGAIN_LATER');
      },
    });
  }
  addCustomer(formGroupDirective: FormGroupDirective) {
    if (this.buttonText === 'Update') {
      this.custmgntServ.updateCustomer(this.customerForm.value).subscribe({
        next: resp => {
          if (resp.status == 'error') {
            this.toast.error(resp.message);
          } else {
            this.list.forEach(item => {
              if (item.id == this.customerForm.value.id) {
                item.name = this.customerForm.value.name;
                item.state = this.customerForm.value.state;
                item.city = this.customerForm.value.city;
                item.id = this.customerForm.value.id;
                item.productIds =this.customerForm.value.productIds;  
              }
            });
            this.grid.dataSource.data = this.list;
            this.toast.success(resp.message);
          }
          this.customerForm.reset();
          formGroupDirective.resetForm();
          this.addNew(formGroupDirective);
          // this.loading = false;
        },
        error: err => {
          console.log(err);
          alert('SOMETHING_WENT_WRONG_TRY_AGAIN_LATER ' + err);
          // this.loading = false;
        },
      });
    } else {
      this.custmgntServ.createCustomer(this.customerForm.value).subscribe({
        next: resp => {
          if (resp.status == 'error') {
            this.toast.error(resp.message);
          } else {
            if(this.list.length < this.pageSize){
            this.customerForm.value.id = resp.data;
            this.customerForm.value.sNo = this.list.length + 1;
            this.list.push(this.customerForm.value);
          }
            this.grid.dataSource.data = this.list;
            this.customerForm.reset();
            formGroupDirective.resetForm();
            this.toast.success(resp.message);
          }
          // this.loading = false;
        },
        error: err => {
          console.log(err);
          this.toast.error(err.message);
          alert('SOMETHING_WENT_WRONG_TRY_AGAIN_LATER');
          // this.loading = false;
        },
      });
    }
  }
  Fetch(){
    this.getData();
  }

  deleteCustomerApi(record: any) {
    let id= record.id;
    const formData = new FormData();
    formData.append('customerId', id);
    // this.loading = true;
    this.list.forEach((item, index) => {
      if (item.id === id) {
        this.list.splice(index, 1); // Remove 1 element at the current index
      }
    });
    this.grid.dataSource.data =this.list;
    this.custmgntServ.deleteCustomer(id).subscribe({
      next: resp => {
        this.toast.success(resp.message);
        // this.loading = false;
      },
      error: err => {
        console.log(err);
        alert('SOMETHING_WENT_WRONG_TRY_AGAIN_LATER');
        // this.loading = false;
      },
    });
  }
}
