import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '@shared';
import { MtxGrid, MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { Sort } from '@angular/material/sort';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
import { distinctUntilChanged, filter, fromEvent, Subscription } from 'rxjs';
import {
  BehaviorSubject,
  catchError,
  debounceTime,
  Observable,
  of,
  Subject,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { Constant } from 'app/utility/constant';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DeleteDialogComponent } from 'app/dialog/delete-dialog/delete-dialog.component';
import { CustomerUsersManagementComponent } from '../customer-users-management/customer-users-management.component';
import { DialogService } from 'app/utility/dialog.service';
export interface CustomerElement {
  name: string;
  id: number;
  state: string;
  city: string;
  sNo: number;
}

export interface ProductBasic {
  id: number,
  productName: string
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
    FormsModule,
  ],
  templateUrl: './customer-management.component.html',
  styleUrl: './customer-management.component.css',
})
export class CustomerManagementComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastrService);
  private custmgntServ = inject(CustomerManagementService);
  customerUserComponent!: MatDialogRef<CustomerUsersManagementComponent>;
  customerProductComponent!: MatDialogRef<CustomerUsersManagementComponent>;

  pageNo: number = 0;
  pageSize: number = 50;
  totalRecords: number = 0;
  customerForm!: FormGroup;
  searchTerm: string = '';

  @ViewChild('input') input!: ElementRef;
  @ViewChild('grid') grid!: MtxGrid;
  @ViewChild('grid2') grid2!: MtxGrid;

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
          click: record => this.openDeleteConfirmation(record),
        },
      ],
    },
  ];
  list: any[] = [];
  loading: boolean = false;
  isLoading: boolean = false;
  columnSortable = true;
  rowHover = true;
  rowStriped = true;
  showPaginator = false;
  editorTitle: string = 'Add Customer';
  buttonText: string = 'Save';
  private productSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  product$: Observable<Object[]> = this.productSubject.asObservable();
  private productSearchTerms = new Subject<string>();
  productSearchTermValue: string = '';
  productIds: number[] = [];
  customerSearchTermValue: string = '';

  ngOnInit(): void {
    this.loadCustomers();
    this.productSearchTerms
      .pipe(
        debounceTime(300),
        tap(() => (this.loading = true)),
        switchMap(term => {
          this.productSearchTermValue = term;
          return this.loadProducts(term);
        })
      )
      .subscribe(products => {
        this.productSubject.next(products);
        this.loading = false;
      });
    this.loadProducts()
      .pipe(take(1))
      .subscribe(initialItems => {
        const currentItems = this.productSubject.getValue();
        const updatedItems = currentItems.concat(initialItems);
        this.productSubject.next(updatedItems);
      });
  }
  ngAfterViewInit() {
    this.addScrollEventListener();
    fromEvent(this.input.nativeElement, 'keyup')
      .pipe(
        filter(Boolean),
        debounceTime(500),
        distinctUntilChanged(),
        tap(text => {
          this.list = [];
          this.pageNo = 0;
          this.loadCustomers(this.searchTerm, 0);
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.removeScrollEventListener();
    this.dialogSubscription?.unsubscribe();
  }

  constructor(private dialog1: MatDialog, private dialogService: DialogService) {
    this.customerForm = this.fb.nonNullable.group({
      id: [],
      sNo: [],
      name: ['', [Validators.required]],
      state: ['', [Validators.required]],
      city: ['', [Validators.required]],
      productIds: [[]],
    });
  }

  loadCustomers(term: string = '', pageNo: number = 0) {
    this.custmgntServ.getAllCustomer(term, pageNo, this.pageSize).subscribe({
      next: response => {
        if (response.status == Constant.SUCCESS) {
          let i = 0;
          response.data.forEach((customer: CustomerElement) => {
            customer.sNo = this.pageSize * pageNo + i + 1;
            this.list.push(customer);
            i++;
          });
          this.grid.dataSource.data = this.list;
          this.totalRecords = this.totalRecords + this.pageSize + 1;
        }
      },
      error: err => {
        console.log(err);
      },
    });
  }

  currentSelectedCustomer: any;

  edit(customer: any) {
    this.currentSelectedCustomer = customer;
    let customerProductIds: any = [];
    let customerProducts = customer.products;
    for (let i of customerProducts) {
      let product = { id: i.id, productName: i.productName };
      customerProductIds.push(product);
    }
    this.allAddedProductDtos = customerProductIds;
    this.grid2.dataSource.data = this.allAddedProductDtos;

    this.customerForm.patchValue({
      sNo: customer.sNo,
      id: customer.id,
      name: customer.name,
      state: customer.state,
      city: customer.city,
      productIds: customerProductIds
    })

    this.editorTitle = 'Update Customer';
    this.buttonText = 'Update';
    this.columns2.find(col => { if (col.header === "Edit") { col.hide = false; } });
  }

  changeSort($event: Sort) { }

  onPaginateChange(event: any) {
    this.list = [];
    this.pageNo = 0;
    this.pageSize = event.pageSize;
    this.loading = true;
  }

  onSubmit(formGroupDirective: FormGroupDirective) {
    if (this.customerForm.valid) {
      this.editorTitle = 'Add Customer';
      this.buttonText = 'Save';
      this.columns2.find(col => { if (col.header === "Edit") { col.hide = true } });
      this.customerForm.reset();
      formGroupDirective.resetForm();
    }
  }

  addNew(formGroupDirective: FormGroupDirective) {
    this.customerForm.reset();
    formGroupDirective.resetForm();
    this.editorTitle = 'Add Customer';
    this.buttonText = 'Save';
    this.columns2.find(col => { if (col.header === "Edit") { col.hide = true } });
    this.allAddedProductDtos = [];
    this.dialogData = null;
  }

  columns2: MtxGridColumn[] = [
    {
      header: 'Product',
      field: 'productName',
    },
    {
      hide: true,
      header: 'Edit',
      field: 'editOperation',
      type: 'button',
      buttons: [
        {
          disabled: false,
          type: 'icon',
          icon: 'edit',
          tooltip: 'Edit',
          click: product => this.editProduct(product)
        },
      ],
    },
    {
      header: 'Remove',
      field: 'operation',
      type: 'button',
      buttons: [
        {
          type: 'icon',
          color: 'warn',
          icon: 'delete',
          tooltip: 'Delete',
          click: product => this.removeProduct(product)
        },
      ],
    },
  ];

  editProduct(product: any) {
    let currentProductIds: any = [];
    this.custmgntServ.getAllCustomerProduct(0, 0, this.currentSelectedCustomer.id).subscribe({
      next: response => {
        if (response.status == Constant.SUCCESS) {
          response.data.forEach((item: any) => {
            currentProductIds.push(item.id);
          })

          if (currentProductIds.includes(product.id)) {
            this.custmgntServ.getCustomerProductDetails(0, 0, this.currentSelectedCustomer.id, product.id).subscribe({
              next: resp => {
                if (resp.status == 'error') {
                  this.toast.error(resp.message);
                } else {
                  this.customerProductComponent = this.dialog1.open(CustomerUsersManagementComponent, {
                    data: { 'product': resp.data, 'customerId': this.currentSelectedCustomer.id }, autoFocus: false, disableClose: true
                  });
                  this.dialogSubscription = this.dialogService.dataObservable$.pipe(take(1)).subscribe((result) => {
                    if (result) {
                      if (result.click === "save") {
                        this.custmgntServ.updateCustomerProductDetails(this.currentSelectedCustomer.id, result.data).subscribe({
                          next: response => {
                            if (response.status == Constant.SUCCESS) {
                              this.toast.success(response.message);
                            } else {
                              this.toast.error(response.message);
                            }
                          }, error(error) {
                            console.log(error);
                          },
                        })
                      }
                    }
                  })
                }
              },
            })
          } else {
            this.toast.error("Please update customer first")
          }
        } else {
          console.log(response.message);
        }
      }, error(err) {
        console.log(err);
      },
    })
  }

  removeProduct(product: any) {
    const dialogRef = this.dialog1.open(DeleteDialogComponent, {
      width: '300px',
      data: {},
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        if (this.buttonText === 'Save') {
          this.allAddedProductDtos.filter((value, index) => {
            if (product.id == value.id) {
              this.allAddedProductDtos.splice(index, 1);
            }
          });
          this.grid2.dataSource.data = this.allAddedProductDtos;
          this.customerForm.patchValue({
            productIds: this.allAddedProductDtos
          })
        }
        else {
          let currentProductIds: any = [];
          this.custmgntServ.getAllCustomerProduct(0, 0, this.currentSelectedCustomer.id).subscribe({
            next: (response) => {
              if (response.status == Constant.SUCCESS) {
                response.data.forEach((item: any) => {
                  currentProductIds.push(item.id);
                })
                if (currentProductIds.includes(product.id)) {
                  this.custmgntServ.removeCustomerProduct(this.currentSelectedCustomer.id, product.id).subscribe({
                    next: response => {
                      if (response.status == Constant.SUCCESS) {
                        this.allAddedProductDtos.filter((value, index) => {
                          if (product.id == value.id) {
                            this.allAddedProductDtos.splice(index, 1);
                          }
                        });
                        this.grid2.dataSource.data = this.allAddedProductDtos;
                        this.customerForm.patchValue({
                          productIds: this.allAddedProductDtos
                        })
                        this.toast.success(response.message);
                      }
                      else {
                        this.toast.error("Update Customer to edit newly added products");
                      }
                    }, error(err) {
                      console.log(err);
                    },
                  })
                } else {
                  this.toast.success("Successfully Deleted");
                  let index = this.allAddedProductDtos.findIndex(prod => prod.id === product.id);
                  this.allAddedProductDtos.splice(index, 1);
                  this.grid2.dataSource.data = this.allAddedProductDtos;
                  this.customerForm.patchValue({
                    productIds: this.allAddedProductDtos
                  })
                }
              }
            }, error(err) {
              console.log(err);
            },
          })
        }
      }
    });


  }

  dialogSubscription!: Subscription;
  allAddedProductDtos: Array<any> = [];
  dialogData = null;

  addProduct() {
    this.dialogData = null;
    this.customerUserComponent = this.dialog1.open(CustomerUsersManagementComponent, {
      data: this.dialogData, autoFocus: false, disableClose: true
    });
    this.dialogSubscription = this.dialogService.dataObservable$.pipe(take(1)).subscribe((result) => {
      if (result) {
        if (result.click === "save") {
          let found = false;
          for (let i of this.allAddedProductDtos) {
            if (result.data.id == i.id) {
              found = true;
              break;
            }
          }
          if (found) {
            this.toast.error("Product is already added")
          } else {
            let product =
            {
              id: result.data.id,
              productName: result.data.productName
            }
            this.allAddedProductDtos.push(product);
            this.grid2.dataSource.data = this.allAddedProductDtos;
          }
        }
      }
    })
  }

  addCustomer(formGroupDirective: FormGroupDirective) {
    if (this.customerForm.valid) {
      if (this.buttonText === 'Update') {
        this.updateCustomer(formGroupDirective);
      } else {
        this.createCustomer(formGroupDirective)
      }
    } else {
      this.toast.error('Fill all fields');
    }
  }

  createCustomer(formGroupDirective: FormGroupDirective) {
    let productIds = [];
    for (let product of this.allAddedProductDtos) {
      productIds.push(product.id);
    }
    this.customerForm.patchValue({
      productIds: productIds
    })
    console.log(this.customerForm.value);
    this.custmgntServ.createCustomer(this.customerForm.value).subscribe({
      next: resp => {
        if (resp.status == 'error') {
          this.toast.error(resp.message);
        } else {
          this.customerForm.reset();
          formGroupDirective.resetForm();
          this.allAddedProductDtos = [];
          this.grid2.dataSource.data = [];
          this.toast.success(resp.message);
          this.list = []
          this.grid.dataSource.data = [];
          this.pageNo = 0;
          this.loadCustomers();
        }
      },
      error: err => {
        console.log(err);
        this.toast.error(err.message);
      },
    });
  }

  updateCustomer(formGroupDirective: FormGroupDirective) {
    let productIds = [];
    for (let product of this.allAddedProductDtos) {
      productIds.push(product.id);
    }
    this.customerForm.patchValue({
      productIds: productIds
    })
    this.custmgntServ.updateCustomer(this.customerForm.value).subscribe({
      next: resp => {
        if (resp.status == 'error') {
          this.toast.error(resp.message);
        } else {
          this.toast.success(resp.message);
          let index = this.list.findIndex(customer => customer.id === this.customerForm.value.id);
          let updatedCustomer = this.list[index];
          updatedCustomer.sNo = this.customerForm.value.sNo;
          updatedCustomer.id = this.customerForm.value.id;
          updatedCustomer.name = this.customerForm.value.name;
          updatedCustomer.state = this.customerForm.value.state;
          updatedCustomer.city = this.customerForm.value.city;
          updatedCustomer.products = this.allAddedProductDtos;
          this.list[index] = updatedCustomer;
          this.grid.dataSource.data = this.list;
        }
        this.customerForm.reset();
        formGroupDirective.resetForm();
        this.allAddedProductDtos = [];
        this.addNew(formGroupDirective);
      },
      error: err => {
        console.log(err);
      },
    });
  }

  fetch() {
    this.loading = true;
    this.loadCustomers(this.searchTerm, ++this.pageNo);
  }

  deleteCustomerApi(record: any) {
    let id = record.id;
    const formData = new FormData();
    formData.append('customerId', id);
    this.list.forEach((item, index) => {
      if (item.id === id) {
        this.list.splice(index, 1);
      }
    });
    this.grid.dataSource.data = this.list;
    this.custmgntServ.deleteCustomer(id).subscribe({
      next: resp => {
        this.toast.success(resp.message);
      },
      error: err => {
        console.log(err);
        alert('SOMETHING_WENT_WRONG_TRY_AGAIN_LATER');
      },
    });
  }

  onScrollEnd(): void {
    const currentItems = this.productSubject.getValue();
    this.loading = true;
    this.loadProducts(this.productSearchTermValue, ++this.pageNo)
      .pipe(take(1))
      .subscribe(newItems => {
        const updatedItems = currentItems.concat(newItems);
        this.productSubject.next(updatedItems);
        this.loading = false;
      });
  }

  onSearch(event: { term: string }): void {
    this.pageNo = 0;
    this.productSearchTerms.next(event.term);
  }

  loadProducts(term: string = '', pageNo: number = 0): Observable<Object[]> {
    return this.prodmgntServ.getAllProductsBasicDetails(term, null, pageNo, 10).pipe(
      switchMap((response: any) => {
        let items: any = [];
        if (response.status == Constant.SUCCESS) {
          items = (response.data as Object[]).filter(obj =>
            Object.values(obj).every(val => this.productIds.indexOf(val) < 0)
          );
        } else {
          if (response.message instanceof Object) {
            this.toast.error(response.message.text);
          } else {
            this.toast.error(response.message);
          }
          console.log(response);
        }
        return of(items);
      }),
      catchError((error: any) => {
        console.log(error);
        this.toast.error(Constant.SOMETHING_WENT_WRONG);
        return of([]);
      })
    );
  }

  openDeleteConfirmation(record: any) {
    let name = record.productName;
    const dialogRef = this.dialog1.open(DeleteDialogComponent, {
      width: '300px',
      data: { name },
    });
    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.deleteCustomerApi(record);
      }
    });
  }

  addScrollEventListener(): void {
    if (this.grid.tableContainer && this.grid.tableContainer.nativeElement) {
      this.grid.tableContainer.nativeElement.addEventListener(
        'scroll',
        this.onTableScroll.bind(this)
      );
    }
  }

  removeScrollEventListener(): void {
    if (this.grid.tableContainer && this.grid.tableContainer.nativeElement) {
      this.grid.tableContainer.nativeElement.removeEventListener(
        'scroll',
        this.onTableScroll.bind(this)
      );
    }
  }

  onTableScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const atBottom = element.scrollHeight - element.scrollTop - 5 <= element.clientHeight;
    if (atBottom) {
      this.fetch();
    }
  }



}
