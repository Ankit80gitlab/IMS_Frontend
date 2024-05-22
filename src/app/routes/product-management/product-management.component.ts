import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '@shared';
import {
  MtxGrid,
  MtxGridColumn,
  MtxGridColumnButton,
  MtxGridDefaultOptions,
  MtxGridModule,
} from '@ng-matero/extensions/grid';
import { Sort } from '@angular/material/sort';
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
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, distinctUntilChanged, filter, fromEvent, tap } from 'rxjs';
import { DeleteDialogComponent } from 'app/dialog/delete-dialog/delete-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
export interface ProductElement {
  productName: string;
  id: number;
  productType: string;
  productDescription: string;
  sNo: number;
}
@Component({
  selector: 'app-product-management',
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
    MatDialogModule

  ],
  templateUrl: './product-management.component.html',
  styleUrl: './product-management.component.css',
})
export class ProductManagementComponent {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastrService);
  productForm = this.fb.nonNullable.group({
    sNo: [''],
    id: [''],
    productName: ['', [Validators.required]],
    productDescription: [''],
    productType: ['', [Validators.required]],
  });
  columns: MtxGridColumn[] = [
    {
      header: 'S.No',
      field: 'sNo',
      minWidth: 50,
      width: '100px',
    },
    {
      header: 'Name',
      field: 'productName',
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
          click: record => this.editProduct(record),
        },
        {
          type: 'icon',
          color: 'warn',
          icon: 'delete',
          tooltip: 'Delete the customer',
          // pop: {
          //   title: 'Confirm delete?',
          //   closeText: 'No',
          //   okText: 'Yes',
          //   okColor:'warn',
          //   closeColor:'primary'

          // },
          click: record => this.openDeleteConfirmation(record),
        },
      ],
    },
  ];

  [x: string]: any;
  list: any[] = [];
  isLoading = false;
  columnSortable = true;
  rowHover = false;
  rowStriped = false;
  showPaginator = true;
  searchTerm: string = '';
  addStatus: boolean = true;
  searchItemStatus: boolean = false;
  editorTitle: string = 'ADD PRODUCT';
  pageNo: number = 0;
  pageSize: number = 50;
  totalRecords: number = 0;
  loading: boolean = false;
  @ViewChild('input')
  input!: ElementRef;
  private prodmgntServ = inject(ProductMangementService);
  @ViewChild('grid')
  grid!: MtxGrid;

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.getData();
  }
  ngAfterViewInit() {
    fromEvent(this.input.nativeElement, 'keyup')
      .pipe(
        filter(Boolean),
        debounceTime(500),
        distinctUntilChanged(),
        tap(text => {
          this.searchProduct();
        })
      )
      .subscribe();
  }
  getData() {
    this.loading = true;
    this.prodmgntServ.getAllProduct(this.pageNo, this.pageSize).subscribe({
      next: (resp: any) => {
        let i = 0;
        if (resp.data.length == 0) {
          this.toast.success('No products Found');
        }
        resp.data.forEach((product: ProductElement) => {
          product.sNo = this.pageSize * this.pageNo + i + 1;
          this.list.push(product);
          i++;
        });
        this.pageNo = this.pageNo + 1;
        this.totalRecords = this.totalRecords + this.pageSize + 1;
      },
      error: (err: any) => {
        console.log(err);
        alert('SOMETHING_WENT_WRONG_TRY_AGAIN_LATER');
      },
    });
  }
  addNew(formGroupDirective: FormGroupDirective) {
    this.editorTitle = 'ADD PRODUCT';
    this.addStatus = true;
    this.productForm.patchValue({
      productName: '',
      productType: '',
      productDescription: '',
    });
    this.productForm.reset();
    formGroupDirective.resetForm();
  }

  addProduct(formGroupDirective: FormGroupDirective) {
    this.prodmgntServ.createProduct(this.productForm.value).subscribe({
      next: resp => {
        if (resp.status == 'error') {
          this.toast.error(resp.message);
        } else {
          this.productForm.value.id = resp.data;
          if (this.searchTerm == '' && this.list.length < this.pageSize) {
            this.list.push(this.productForm.value);
          } else if (
            this.productForm.value.productName
              ?.toLowerCase()
              .includes(this.searchTerm.toLowerCase())
          ) {
            this.productForm.value.sNo = (this.list.length + 1).toString();
            this.list.push(this.productForm.value);
          }
          this.grid.dataSource.data = this.list;
          this.productForm.reset();
          formGroupDirective.resetForm();
          this.toast.success(resp.message);
        }
        this.loading = false;
      },
      error: err => {
        console.log(err);
        this.toast.error(err.message);
        alert('SOMETHING_WENT_WRONG_TRY_AGAIN_LATER');
        this.loading = false;
      },
    });
  }

  editProduct(data: any) {
    this.editorTitle = 'EDIT PRODUCT';
    this.addStatus = false;
    this.productForm.patchValue({
      id: data.id,
      productName: data.productName,
      productType: data.productType,
      productDescription: data.productDescription,
    });
  }

  updateProduct(formGroupDirective: FormGroupDirective) {
    if (this.productForm.invalid) {
      this.toast.error('Name and Type cant be empty');
    } else {
      this.prodmgntServ.updateProduct(this.productForm.value).subscribe({
        next: resp => {
          if (resp.status == 'error') {
            this.toast.error(resp.message);
          } else {
            this.list.forEach(item => {
              if (item.id == this.productForm.value.id) {
                item.productName = this.productForm.value.productName;
                item.productType = this.productForm.value.productType;
                item.productDescription = this.productForm.value.productDescription;
                item.id = this.productForm.value.id;
              }
            });
            this.grid.dataSource.data = this.list;
            this.toast.success(resp.message);
          }
          this.productForm.reset();
          formGroupDirective.resetForm();
          this.addNew(this.formGroupDirective);
          this.loading = false;
        },
        error: err => {
          console.log(err);
          alert('SOMETHING_WENT_WRONG_TRY_AGAIN_LATER ' + err);
          this.loading = false;
        },
      });
    }
  }

  onPaginateChange(event: any) {
    console.log('paginate', event);
    if (event.pageSize != this.pageSize) {
      this.list = [];
      this.pageNo = 0;
      this.pageSize = event.pageSize;
      if (this.searchTerm != '') {
        this.searchApi();
      } else {
        this.getData();
      }
    } else if (event.pageIndex >= this.pageNo) {
      this.getData();
    }
  }
  searchProduct() {
    if (this.searchTerm == '') {
      this.searchItemStatus = false;
      this.grid.dataSource.data = [];
      this.list = [];
      this.pageNo = 0;
      this.getData();
    } else {
      this.searchItemStatus = true;
      this.pageNo = 0;
      this.searchApi();
    }
  }

  searchApi() {
    if(this.pageNo == 0){
      this.grid.dataSource.data = [];
      this.list = []; 
    }
    this.prodmgntServ.searchProduct(this.searchTerm, this.pageNo, this.pageSize).subscribe({
      next: resp => {
        let i = 0;
        console.log(resp.data);
        if(resp.data.length>0){
        resp.data.forEach((product: ProductElement) => {
          product.sNo = this.pageSize * this.pageNo + i + 1;
          this.list.push(product);
          i++;
        });
        this.grid.dataSource.data = this.list;
      }
      else{
        this.toast.success(resp.message)
      }
      },
      error: err => {
        console.log(err);
        alert('SOMETHING_WENT_WRONG_TRY_AGAIN_LATER');
      },
    });
  }

  Fetch() {
    if (this.searchTerm == '') {
      this.getData();
    } else {
      this.pageNo = this.pageNo + 1;
      this.searchApi();
    }
  }
  deleteProductApi(record: any) {
    let id = record.id;
    this.loading = true;
    this.grid.dataSource.data = this.list;
    this.prodmgntServ.deleteProduct(id).subscribe({
      next: resp => {
        if (resp.status == 'success') {
          this.list.forEach((item, index) => {
            if (item.id === id) {
              this.list.splice(index, 1); // Remove 1 element at the current index
            }
          });
          this.toast.success(resp.message);
        } else {
          this.toast.error(resp.message);
        }
      },
      error: err => {
        console.log(err);
        this.toast.show(err.message);
        alert('SOMETHING_WENT_WRONG_TRY_AGAIN_LATER');
        this.loading = false;
      },
    });
  } 
  openDeleteConfirmation(record:any) {
    let name= record.productName;
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '300px',
      data: { name },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // Call your delete logic here, e.g., this.deleteItem(id);
        this.deleteProductApi(record);
      }
    });
  }
}
