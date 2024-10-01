import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MtxGrid, MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { MatError, MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MtxSelectModule } from '@ng-matero/extensions/select';
import { MtxSelect } from '@ng-matero/extensions/select';
import { MatCheckbox } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { RoleManagementService } from 'app/services/role-management.service';
import { Role } from 'app/model-class/role';
import { ToastrService } from 'ngx-toastr';
import { Feature } from 'app/model-class/features';
import { fromEvent, filter, debounceTime, distinctUntilChanged, tap } from 'rxjs';
import { BehaviorSubject, catchError, Observable, of, Subject, switchMap, take } from "rxjs";
import { Constant } from 'app/utility/constant';
import { CustomerManagementService } from 'app/services/customer-management.service';
import { DeleteDialogComponent } from 'app/dialog/delete-dialog/delete-dialog.component';
import { MatDialog } from '@angular/material/dialog';

export interface featureId {
  id: number;
}

export interface RoleInterface {
  sNo: number;
  id: number;
  name: any;
  createdBy: number;
  featureIds: featureId
}

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [MatCardModule,
    PageHeaderComponent,
    MtxGridModule,
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
    MatError],
  templateUrl: './role-management.component.html',
  styleUrl: './role-management.component.css'
})
export class RoleManagementComponent implements OnInit {
  
  @ViewChild('grid') grid!: MtxGrid;
  @ViewChild('input') input!: ElementRef;

  private readonly toast = inject(ToastrService);
  private roleMgntServ = inject(RoleManagementService);
  private readonly fb = inject(FormBuilder);
  private customerServ = inject(CustomerManagementService);

  private customerSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  private customerSearchTerms = new Subject<string>();
  customer$: Observable<Object[]> = this.customerSubject.asObservable();
  customerSearchTermValue: string = '';

  roleLoading: boolean = false;
  customerLoading: boolean = false;
  roleForm!:FormGroup;
  customerForm!:FormGroup;

  currentRoleId: number = 0;
  currentSerialNo:number = 0;

  selectedFeatureOfRole: any;
  allRoles: any[] = [];
  allFeatures: Array<Feature> = [];

  isFeatureFieldValid: boolean = false;
  searchItemStatus: boolean = false;

  rolePageNo: number = 0;
  rolePageSize: number = 50;
  totalRecords: number = 0;

  searchTerm: string = '';

  isLoading:boolean= false;
  columnSortable = true;
  rowHover = true;
  rowStriped = true;
  showPaginator = false;
  editorTitle: string = "ADD ROLE";
  buttonText: string = "Save";

  columns: MtxGridColumn[] = [
    {
      header: 'S. No.',
      field: 'sNo',
      sortable: true,
      minWidth: 100,
      width: '100px',
    },
    {
      header: 'Role Id',
      field: 'id',
      sortable: true,
      minWidth: 100,
      width: '100px',
    },
    {
      header: 'Role Name',
      field: 'name',
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
          tooltip: "Edit Role",
          click: role => this.editExistingRole(role),
        },
        {
          type: 'icon',
          color: 'warn',
          icon: 'delete',
          tooltip: "Delete Role",
          click: role => this.openDeleteConfirmation(role),
        },
      ],
    },
  ];

  constructor(private dialog: MatDialog) {
    this.roleForm = this.fb.group({
      name: new FormControl('', Validators.required),
      customerId: [null],
      customerName: [null],
    });
  }

  ngOnInit() {
    this.getAllFeatures();
    this.loadRoles();

    
    this.loadCustomers().pipe(
      take(1),
    ).subscribe(initialItems => {
      this.customerSubject.next(initialItems);
    });
    this.customerSearchTerms.pipe(
      debounceTime(300),
      tap(() => this.customerLoading = true),
      switchMap(term => {
        this.customerSearchTermValue = term;
        return this.loadCustomers(term);
      })
    ).subscribe(obj => {
      this.customerSubject.next(obj);
      this.customerLoading = false;
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
          this.allRoles = [];
          this.rolePageNo=0;
          this.loadRoles(this.searchTerm,0);
        })
      )
      .subscribe();
  };

  ngOnDestroy(): void {
    this.removeScrollEventListener();
  };

  loadRoles(term: string = '', pageNo: number = 0){
    this.roleMgntServ.getAllRoles(term, pageNo, this.rolePageSize).subscribe({
      next : response => {
        if (response.status == Constant.SUCCESS) {
          let i = 0;
          response.data.forEach((role: RoleInterface) => {
            role.sNo = this.rolePageSize * pageNo + i + 1;
            this.allRoles.push(role);
            i++;
          });
          this.grid.dataSource.data = this.allRoles;
          this.totalRecords = this.totalRecords + this.rolePageSize + 1;
        } 
      },
      error: err => {
        console.log(err);
      },
    }); 
  }

  loadCustomers(term: string = "", pageNo: number = 0): Observable<Object[]> {
    return this.customerServ.getAllCustomersBasicDetails(term, pageNo, 10).pipe(
      switchMap((response: any) => {
        let items = [];
        if (response.status == "success") {
          items = response.data;
        } else {
          if (response.message instanceof Object) {
            this.toast.error(response.message.text)
          } else {
            this.toast.error(response.message);
          }
        }
        return of(items);
      }),
      catchError((error: any) => {
        console.log(error);
        this.toast.error("SOMETHING_WENT_WRONG");
        return of([]);
      })
    );
  }
  customerPageNo: number = 0;

  compareFn(user1: any, user2: any) {
    return user1 && user2 ? user1.id === user2.id : user1 === user2;
  }

  onCustomerSelectionChange() {
  }

  onSearch(event: { term: string }): void {
    this.customerPageNo = 0;
    this.customerSearchTerms.next(event.term);
  }

  onScrollEnd(): void {
    const currentItems = this.customerSubject.getValue();
    this.customerLoading = true;
    this.loadCustomers(this.customerSearchTermValue, ++this.customerPageNo).pipe(take(1)).subscribe(newItems => {
      const updatedItems = currentItems.concat(newItems);
      this.customerSubject.next(updatedItems);
      this.customerLoading = false;
    });
  }

  getAllFeatures() {
    this.roleMgntServ.getAllFeatures(0, 0).subscribe({
      next: (resp) => {
        for (let feat of resp.message) {
          this.allFeatures.push(feat);
        }
      }, error(err) {
        console.log(err);
      },
    })
  }

  onFeatureIdChange($event: Event) {
    if (this.selectedFeatureOfRole === "" || this.selectedFeatureOfRole.length == 0) {
      this.isFeatureFieldValid = false;
    } else {
      this.isFeatureFieldValid = true;
    }
  }

  onSubmit(formGroupDirective: FormGroupDirective) {
    if (this.buttonText === "Save") {
      this.createNewRole(formGroupDirective);
    } else if (this.buttonText === "Update") {
      this.updateExistingRole(formGroupDirective);
    }
  }

  createNewRole(formGroupDirective: FormGroupDirective) {
    
    if (this.roleForm.valid) {
      let newRoleObject: any = {
        'name': this.roleForm.value.name?.toUpperCase(),
        'featureIds': this.selectedFeatureOfRole,
      } 
      this.roleMgntServ.createNewRole(newRoleObject).subscribe({
        next: (resp) => {          
          if (resp.status === "success") {
            this.toast.success(resp.message);

            // newRoleObject.id = resp.data.id;
            // newRoleObject.sNo = this.allRoles.length + 1;
            // this.allRoles.push(newRoleObject);
            // this.grid.dataSource.data = this.allRoles;

            this.allRoles = []
            this.grid.dataSource.data = [];
            this.rolePageNo = 0;
            this.loadRoles();

            this.selectedFeatureOfRole = null;
            this.isFeatureFieldValid = false;
            this.editorTitle = "ADD ROLE";
            this.buttonText = "Save";
            this.roleForm.reset()
            formGroupDirective.resetForm();
          }
          else if (resp.status === "error") {
            this.toast.error(resp.message);
          }
        },
        error: (err) => {
          this.toast.error("SOMETHING_WENT_WRONG_TRY_AGAIN_LATER");
          console.log(err);
        },
      })
     
    }
    else {
      this.toast.error("Invalid input");
    }
  }

  editExistingRole(role: RoleInterface) {
    this.editorTitle = "UPDATE ROLE";
    this.buttonText = "Update";
    this.roleForm.patchValue({
      'name': role.name,
    })
    this.selectedFeatureOfRole = role.featureIds;
    this.currentRoleId = role.id;
    this.currentSerialNo = role.sNo;
  }

  updateExistingRole(formGroupDirective: FormGroupDirective) {
    if (this.roleForm.valid) {
      let updateRoleObject: RoleInterface = {
        'id': this.currentRoleId,
        'sNo':this.currentSerialNo,
        'name': this.roleForm.value.name?.toUpperCase(),
        'createdBy': 1,
        'featureIds': this.selectedFeatureOfRole,
      }
      if (this.currentRoleId != 0) {
        this.roleMgntServ.updateExistingRole(updateRoleObject).subscribe({
          next: (resp) => {
            if (resp.status === "success") {
              this.toast.success(resp.message);
              let index = this.allRoles.findIndex(role => role.id === updateRoleObject.id);
              this.allRoles[index] = updateRoleObject;
              this.grid.dataSource.data = this.allRoles;

              this.selectedFeatureOfRole = "";
              this.editorTitle = "ADD ROLE";
              this.buttonText = "Save";
              this.roleForm.reset()
              formGroupDirective.resetForm();

            }
            else if (resp.status === "error") {
              this.toast.error(resp.message);
            }
          },
          error: (err) => {
            this.toast.error("SOMETHING_WENT_WRONG_TRY_AGAIN_LATER");
            console.log(err);
          },
        })
       
      } else {
        this.toast.error("role id not found");
      }
    } else {
      this.toast.error("Invalid Input");
    }
  }

  removeExistingRole(role: Role) {
    const roleId = role.id;
    if (roleId != 0 || roleId != null) {
      this.roleMgntServ.removeExistingRole(roleId).subscribe({
        next: (resp) => {
          if (resp.status === "success") {
            this.toast.success(resp.message);
            let roleObj: Role;
            for (let i of this.allRoles) {
              if (i.id == roleId) {
                roleObj = i;
                break;
              }
            }
            this.allRoles = this.allRoles.filter(item => item !== roleObj);
          } else if (resp.status === "error") {
            this.toast.error(resp.message);
          }
        },
        error(err) {
          console.log(err);
        },
      })
    } else {
      this.toast.error("Invalid role ID")
    }

  }

  addNew(formGroupDirective: FormGroupDirective) {
    this.selectedFeatureOfRole = "";
    this.roleForm.reset()
    formGroupDirective.resetForm();
    this.editorTitle = "ADD ROLE";
    this.buttonText = "Save";
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
      this.fetchRole();
    }
  }

  fetchRole() {
    this.roleLoading = true;
    this.loadRoles(this.searchTerm, ++this.rolePageNo);
  }

  openDeleteConfirmation(role:any) {
    let name= role.name;
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '300px',
      data: { name },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.removeExistingRole(role);
      }
    });
  }
}
