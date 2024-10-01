import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '@shared';
import {
  MtxGrid,
  MtxGridColumn,
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
import { BehaviorSubject, Observable, Subject, Subscription, catchError, debounceTime, distinctUntilChanged, filter, fromEvent, of, switchMap, take, tap } from 'rxjs';
import { DeleteDialogComponent } from 'app/dialog/delete-dialog/delete-dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Constant } from 'app/utility/constant';
import { ProductIncidentTypeComponent } from '../product-incident-type/product-incident-type.component';
import { DialogService } from 'app/utility/dialog.service';
export interface ProductElement {
  productName: string;
  id: number;
  productType: string;
  productDescription: string;
  incidentTypes: any;
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
    id: [''],
    productName: ['', [Validators.required]],
    productDescription: [''],
    productType: ['', [Validators.required]],
    incidentTypeDtos: <any>[[]]

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
          tooltip: 'Edit the Product',
          click: record => this.editProduct(record),
        },
        {
          type: 'icon',
          color: 'warn',
          icon: 'delete',
          tooltip: 'Delete the Product',
          click: record => this.openDeleteConfirmation(record),
        },
      ],
    },
  ];

  @ViewChild('grid2') grid2!: MtxGrid;

  columns2: MtxGridColumn[] = [
    {
      header: 'Incident Type',
      field: 'type',
    }
  ];

  list: any[] = [];
  isLoading = false;
  columnSortable = true;
  rowHover = false;
  rowStriped = false;
  showPaginator = false;
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
  productSearchTermValue: string = '';
  incidentTpeComponent!: MatDialogRef<ProductIncidentTypeComponent>;


  constructor(private dialog: MatDialog, private dialogService: DialogService) { }

  ngOnInit(): void {
    this.loadProducts();

  }
  ngAfterViewInit() {
    this.addScrollEventListener();
    fromEvent(this.input.nativeElement, 'keyup')
      .pipe(
        filter(Boolean),
        debounceTime(500),
        distinctUntilChanged(),
        tap(text => {
          this.list = []
          this.pageNo = 0;
          this.loadProducts(this.searchTerm, 0);
        })
      )
      .subscribe();
  }
  ngOnDestroy(): void {
    this.removeScrollEventListener();
    this.dialogSubscription?.unsubscribe();
  };
  addNew(formGroupDirective: FormGroupDirective) {
    this.editorTitle = 'ADD PRODUCT';
    this.incidentTitle = "Add Incident Type";
    this.addStatus = true;
    this.allIncident = [];
    this.productForm.patchValue({
      productName: '',
      productType: '',
      productDescription: '',
      incidentTypeDtos: []
    });
    this.productForm.reset();
    formGroupDirective.resetForm();
  }

  dialogSubscription!: Subscription;

  allIncident: any = [];

  addIncidentType() {
    this.incidentTpeComponent = this.dialog.open(ProductIncidentTypeComponent, {
      data: this.productForm.value.incidentTypeDtos, autoFocus: false, disableClose: true
    });
    this.dialogSubscription = this.dialogService.dataObservable$.pipe(take(1)).subscribe((result) => {
      if (result) {
        if (result.click === "save") {
          this.productForm.patchValue({
            incidentTypeDtos: result.data.items
          })
          this.dialog.closeAll();
          this.allIncident = this.productForm.value.incidentTypeDtos;

        }
      }
    })
  }

  addProduct(formGroupDirective: FormGroupDirective) {
    if (this.productForm.invalid) {
      this.toast.error('Name and Type cant be empty');
    }
    else {
      console.log(this.productForm.value);

      this.prodmgntServ.createProduct(this.productForm.value).subscribe({
        next: resp => {
          if (resp.status == 'error') {
            this.toast.error(resp.message);
          } else {
            let newProduct = {
              sNo: this.list.length + 1,
              id: resp.data.id,
              productName: this.productForm.value.productName,
              productType: this.productForm.value.productType,
              incidentTypes: this.productForm.value.incidentTypeDtos,
              productDescription: this.productForm.value.productDescription
            }
            this.productForm.reset();
            formGroupDirective.resetForm();
            this.allIncident = [];
            this.toast.success(resp.message);
            this.list = []
            this.grid.dataSource.data = [];
            this.pageNo = 0;
            this.loadProducts();
            // this.list.push(newProduct);
            // this.grid.dataSource.data = this.list;
          }
          this.loading = false;
        },
        error: err => {
          this.toast.error(err.message);
          this.loading = false;
        },
      });
    }
  }

  currentProduct: any;
  incidentTitle = "Add Incident Type";

  editProduct(data: any) {
    // console.log(data);
    this.allIncident = data.incidentTypes;
    this.currentProduct = data;
    this.editorTitle = 'EDIT PRODUCT';
    this.incidentTitle = "Edit Incident Type";
    this.addStatus = false;
    this.productForm.patchValue({
      id: data.id,
      productName: data.productName,
      productType: data.productType,
      productDescription: data.productDescription,
      incidentTypeDtos: data.incidentTypes
    });
  }
  
  updateProduct(formGroupDirective: FormGroupDirective) {
    if (this.productForm.invalid) {
      this.toast.error('Name and Type cant be empty');
    } else {
      this.prodmgntServ.updateProduct(this.productForm.value).subscribe({
        next: resp => {
          if (resp.status == Constant.ERROR) {
            this.toast.error(resp.message);
            this.addNew(formGroupDirective);
          } else {
            let index = this.list.findIndex(product => product.id === this.currentProduct.id);
            let updProduct = this.list[index];
            updProduct.sNo = this.currentProduct.sNo;
            updProduct.id = this.currentProduct.id,
              updProduct.productName = this.productForm.value.productName;
            updProduct.productType = this.productForm.value.productType;
            updProduct.incidentTypes = this.productForm.value.incidentTypeDtos;
            updProduct.productDescription = this.productForm.value.productDescription;
            this.list[index] = updProduct;
            this.grid.dataSource.data = this.list;
            this.toast.success(resp.message);

            this.productForm.reset();
            formGroupDirective.resetForm();
            this.addNew(formGroupDirective);
            this.loading = false;
          }
        }, error: err => {
          console.log(err);
          this.loading = false;
        },
      })
    }
  }

  Fetch() {
    this.loading = true;
    this.loadProducts(this.searchTerm, ++this.pageNo);
  }

  deleteProductApi(record: any) {
    let id = record.id;
    // this.loading = true;
    this.prodmgntServ.deleteProduct(id).subscribe({
      next: resp => {
        if (resp.status == Constant.SUCCESS) {
          this.list.forEach((item, index) => {
            if (item.id == id) {
              this.list.splice(index, 1);
            }
          });
          this.grid.dataSource.data = this.list;
          this.toast.success(resp.message);
          this.editorTitle = 'ADD PRODUCT';
          this.incidentTitle = "Add Incident Type";
          this.addStatus = true;
          this.allIncident = [];
          this.productForm.patchValue({
            productName: '',
            productType: '',
            productDescription: '',
            incidentTypeDtos: []
          });
          this.productForm.reset();
        } else {
          this.toast.error(resp.message);
        }
      },
      error: err => {
        this.toast.show(err.message);
        this.loading = false;
      },
    });
  }
  openDeleteConfirmation(record: any) {
    let name = record.productName;
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '300px',
      data: { name },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.deleteProductApi(record);
      }
    });
  }


  loadProducts(term: string = '', pageNo: number = 0) {
    this.prodmgntServ.getAllProduct(term, pageNo, this.pageSize).subscribe({
      next: response => {
        // console.log(response);
        
        if (response.status == Constant.SUCCESS) {
          let i = 0;
          response.data.forEach((product: ProductElement) => {
            product.sNo = this.pageSize * pageNo + i + 1;
            this.list.push(product);
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
  addScrollEventListener(): void {
    if (this.grid.tableContainer && this.grid.tableContainer.nativeElement) {
      this.grid.tableContainer.nativeElement.addEventListener('scroll', this.onTableScroll.bind(this));
    }
  }

  removeScrollEventListener(): void {
    if (this.grid.tableContainer && this.grid.tableContainer.nativeElement) {
      this.grid.tableContainer.nativeElement.removeEventListener('scroll', this.onTableScroll.bind(this));
    }
  }

  onTableScroll(event: Event): void {
    const element = (event.target as HTMLElement);
    const atBottom = element.scrollHeight - element.scrollTop - 5 <= element.clientHeight;
    if (atBottom) {
      this.Fetch();
    }
  }
  changeSort($event: Sort) { }


}
