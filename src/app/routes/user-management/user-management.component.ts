import { Component, ElementRef, HostListener, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnInit, inject } from '@angular/core';
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
import { UserManagementService } from 'app/services/user-management.service';
import { User } from 'app/model-class/user';
import { Toast, ToastrService } from 'ngx-toastr';
import { CustomerManagementService } from 'app/services/customer-management.service';
import { fromEvent, filter, debounceTime, distinctUntilChanged, tap } from 'rxjs';
import { AsyncPipe, NgIf } from "@angular/common";
import { BehaviorSubject, catchError, Observable, of, Subject, switchMap, take } from "rxjs";
import { MatTableModule } from '@angular/material/table';
import { Constant } from 'app/utility/constant';
import { MatDialog } from '@angular/material/dialog';
import { DeleteDialogComponent } from 'app/dialog/delete-dialog/delete-dialog.component';
import { Subscription } from 'rxjs';
import { AuthService } from '@core';

export interface UserInterface {
  sNo: number;
  id: any;
  username: any;
  name: any;
  email: any;
  password: any;
  roleId: any;
  customerId: any;
  roleName: any
  productIds: any;
}

@Component({
  selector: 'app-user-management',
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
    MatError,
    NgIf,
    AsyncPipe,
    MatTableModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class MyComponent implements OnInit {

  @ViewChild('input') input!: ElementRef;
  @ViewChild('grid') grid!: MtxGrid;

  private readonly toast = inject(ToastrService);
  private userMgntServ = inject(UserManagementService);
  private roleMgntServ = inject(RoleManagementService);
  private customerServ = inject(CustomerManagementService);
  private readonly fb = inject(FormBuilder);
  private authService = inject(AuthService);

  userForm: FormGroup;
  customerForm!: FormGroup;

  private customerSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  private customerSearchTerms = new Subject<string>();
  customer$: Observable<Object[]> = this.customerSubject.asObservable();
  customerSearchTermValue: string = '';

  allUsers: any[] = [];
  allRoles: any[] = [];
  allCustomerProduct: any[] = [];
  userLoading: boolean = false;
  isLoading: boolean = false;
  customerLoading: boolean = false;
  customerPageNo: number = 0;
  userPageNo: number = 0;
  userPageSize: number = 50;
  totalRecords: number = 0;
  searchTerm: string = '';


  userSubscription!: Subscription;
  loggedUser: any;

  columnSortable = true;
  rowHover = true;
  rowStriped = true;
  showPaginator = false;
  editorTitle: string = 'Add User';
  buttonText: string = 'Save';

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
      header: 'User Name',
      field: 'userName',
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
        { type: 'icon', icon: 'edit', tooltip: "Edit User", click: user => this.editExistingUser(user), },
        { type: 'icon', color: 'warn', icon: 'delete', tooltip: "Delete User", click: user => this.openDeleteConfirmation(user), },
      ],
    },
  ];

  constructor(private dialog: MatDialog) {
    this.userForm = this.fb.group({
      id: new FormControl(''),
      name: new FormControl('', Validators.required),
      userName: new FormControl('', Validators.required),
      email: new FormControl('', Validators.required),
      customerName: new FormControl(null, Validators.required),
      roleName: new FormControl(null, Validators.required),
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      userTypeId:('')
    }, { validator: this.passwordMatchValidator });
  }

  removeCustomerValidators() {
    const control = this.userForm.get('customerName');
    if (control) {
      control.clearValidators();
      control.updateValueAndValidity();
    }
  }
  passwordMatchValidator(form: FormGroup) {
    const passwordControl = form.get('password');
    const confirmPasswordControl = form.get('confirmPassword');
    if (passwordControl == null || confirmPasswordControl == null) {

    } else {
      if (passwordControl.value !== confirmPasswordControl.value) {
        confirmPasswordControl.setErrors({ passwordMismatch: true });
      } else {
        confirmPasswordControl.setErrors(null);
      }
    }
  }

  ngOnInit(): void {

    this.getAllTypeForUser();

    this.userSubscription = this.authService.user().subscribe(user => (this.loggedUser = user));
    if (this.loggedUser.roles[0] === "ROLE_ADMIN") {
      this.removeCustomerValidators();
    }
    this.getAllRoles();
    this.loadUsers();

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
          this.allUsers = [];
          this.userPageNo = 0;
          this.loadUsers(this.searchTerm, 0);
        })
      )
      .subscribe();
  };

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.removeScrollEventListener();
  };

  allTypeForUser:any[]=[];

  getAllTypeForUser(){
    this.userMgntServ.getAllTypesForUser('',0,10).subscribe({
      next : (response) => {
        if(response.status==Constant.SUCCESS){
          this.allTypeForUser=response.data;
        }
      },
      error(err) {
        console.log(err);
      },
    })
  }

  loadUsers(term: string = '', pageNo: number = 0) {
    this.addNew();
    this.userMgntServ.getAllUser(term, pageNo, this.userPageSize).subscribe({
      next: response => {
        if (response.status == Constant.SUCCESS) {
          let i = 0;
          response.data.forEach((user: UserInterface) => {
            user.sNo = this.userPageSize * pageNo + i + 1;
            this.allUsers.push(user);
            i++;
          });
          this.grid.dataSource.data = this.allUsers;
          this.totalRecords = this.totalRecords + this.userPageSize + 1;
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
        if (response.status == Constant.SUCCESS) {
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
        this.toast.error(Constant.SOMETHING_WENT_WRONG);
        return of([]);
      })
    );
  }

  compareFn(user1: User, user2: User) {
    return user1 && user2 ? user1.id === user2.id : user1 === user2;
  }

  fetchUser() {
    this.userLoading = true;
    this.loadUsers(this.searchTerm, ++this.userPageNo);
  }

  getAllRoles() {
    this.roleMgntServ.getAllUserRolesBasicDetails().subscribe({
      next: (resp: any) => {
        resp.data.forEach((role: any) => {
          this.allRoles.push(role)
        });
      }, error(err) {
        console.log(err);
      },
    })
  }

  currentUser: any;
  selectedRole: any;
  selectedCustomerId: any;
  selectedProductIds: any[] = [];

  arePasswordfieldsRequired: boolean = true;
  foundCustomerProduct: boolean = false;
  fetchedCustomer: any;
  isRoleFieldValid: boolean = false;
  isRoleFieldValidForUpdate: boolean = true;

  createNewUser(formGroupDirective: FormGroupDirective) {
    if (this.userForm.valid) {
      let newUserObject: any = {
        'name': this.userForm.value.name,
        'userName': this.userForm.value.userName,
        'email': this.userForm.value.email,
        'password': this.userForm.value.password,
        'roleId': this.userForm.value.roleName,
        'customerId': this.userForm.value.customerName,
        'productIds': this.selectedProductIds,
        'userTypeId':this.userForm.value.userTypeId
      }

      let newUserObject2: any = {
        'id': 0,
        'sNo': 0,
        'name': this.userForm.value.name,
        'userName': this.userForm.value.userName,
        'email': this.userForm.value.email,
        'password': this.userForm.value.password,
        'roleId': this.userForm.value.roleName,
        'customerId': this.userForm.value.customerName,
        'customerName': '',
        'productIds': this.selectedProductIds,
      }
      this.userMgntServ.createNewUser(newUserObject).subscribe({
        next: (resp) => {
          if (resp.status === "success") {
            this.toast.success(resp.message);
            newUserObject2.id = resp.data.id;
            newUserObject2.sNo = this.allUsers.length + 1;
            this.allUsers.push(newUserObject2);
            this.grid.dataSource.data = this.allUsers;

            this.selectedProductIds = [];
            this.fetchedCustomer=null;
            this.fetchedCustomer = [];
            this.editorTitle = "ADD USER";
            this.buttonText = "Save";
            this.userForm.reset()
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

  onCustomerSelectionChange() {
    this.allCustomerProduct.length = 0;
    this.selectedProductIds = [];
    let arr = [];
    this.selectedCustomerId = this.userForm.value.customerName;
    if (this.selectedCustomerId != null && this.selectedCustomerId != 0) {
      this.foundCustomerProduct = true;
      this.customerServ.getAllCustomerProduct(0, 0, this.selectedCustomerId).subscribe({
        next: (resp) => {
          for (let product of resp.data) {
            this.allCustomerProduct.push(product);
            arr.push(product.id);
          }
        }, error(err) {
          console.log(err);
        },
      })
    } else {
      this.foundCustomerProduct = false;
      this.selectedProductIds = [];
    }
  }

  fcpDisable = false;
  editExistingUser(user: any) {
    console.log(user);
    if (this.loggedUser.id == user.id) {
      this.userForm.get('roleName')?.disable();
      this.userForm.get('customerName')?.disable();
      this.fcpDisable = true;
    } else {
      this.userForm.get('roleName')?.enable();
      this.userForm.get('customerName')?.enable();
      this.fcpDisable = false;
    }
    // console.log(user);
    this.arePasswordfieldsRequired = false;
    this.editorTitle = "UPDATE USER";
    this.buttonText = "Update";
    this.userForm.patchValue({
      'id': user.id,
      'name': user.name,
      'userName': user.userName,
      'email': user.email,
      'userTypeId':user.userTypeId,
      'password': '123456',
      'confirmPassword': '123456'
    })
    this.isRoleFieldValid = true;
    this.selectedRole = user.roleId;
    this.currentUser = user;
    if (user.customerId == null || user.customerId == 0) {
      this.fetchedCustomer = null;
    } else {
      let currCustOfUser = { id: user.customerId, name: user.customerName };
      this.fetchedCustomer = currCustOfUser;
    }
    this.userForm.value.customerName = user.customerId;
    this.foundCustomerProduct = true;
    this.onCustomerSelectionChange();
    this.selectedProductIds = user.productIds;
  }

  updateExistingUser(formGroupDirective: FormGroupDirective) {
    if (this.userForm.valid) {
      let updateUserObject: any = {
        'id': this.currentUser.id,
        'name': this.userForm.value.name,
        "userName": this.userForm.value.userName,
        "email": this.userForm.value.email,
        "roleId": this.userForm.value.roleName,
        "customerId": this.selectedCustomerId,
        "productIds": this.selectedProductIds,
        "userTypeId":this.userForm.value.userTypeId
      }

      let updateUserObject2: any = {
        'sNo': this.currentUser.sNo,
        'id': this.currentUser.id,
        'name': this.userForm.value.name,
        "userName": this.userForm.value.userName,
        "email": this.userForm.value.email,
        "roleId": this.userForm.value.roleName,
        "customerId": this.selectedCustomerId,
        "productIds": this.selectedProductIds,
        "userTypeId": this.userForm.value.userTypeId
      }

      // console.log(updateUserObject);


      if (updateUserObject.id != 0) {
        this.userMgntServ.updateExistingUser(updateUserObject).subscribe({
          next: (resp) => {
            if (resp.status === "success") {
              this.toast.success(resp.message);
              let index = this.allUsers.findIndex(user => user.id === updateUserObject.id);
              let upduser = this.allUsers[index];
              upduser.sNo = updateUserObject2.sNo;
              upduser.name = updateUserObject2.name;
              upduser.userName = updateUserObject2.userName;
              upduser.email = updateUserObject2.email;
              upduser.roleId = updateUserObject2.roleId;
              upduser.customerId = updateUserObject2.customerId;
              upduser.productIds = updateUserObject2.productIds;
              upduser.userTypeId = updateUserObject2.userTypeId;
              this.allUsers[index] = upduser;
              this.grid.dataSource.data = this.allUsers;

              this.arePasswordfieldsRequired = true;
              this.selectedRole = [];
              this.selectedCustomerId = null;
              this.selectedProductIds = [];
              this.foundCustomerProduct = false;
              this.editorTitle = "ADD USER";
              this.buttonText = "Save";
              this.userForm.reset()
              this.fetchedCustomer = [];
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

  removeExistingUser(user: User) {
    if (this.loggedUser.id == user.id) {
      this.toast.error("Denied");
    } else {
      const userId = user.id;
      if (userId != 0 || userId != null) {
        this.userMgntServ.removeUser(userId).subscribe({
          next: (resp) => {
            if (resp.status === "success") {
              this.toast.success(resp.message);
              let userObj: User;
              for (let i of this.allUsers) {
                if (i.id == userId) {
                  userObj = i;
                  break;
                }
              }
              this.allUsers = this.allUsers.filter(item => item !== userObj);
              this.grid.dataSource.data = this.allUsers;
              // reseting form for add user
              this.arePasswordfieldsRequired = true;
              this.selectedRole = [];
              this.fetchedCustomer = [];
              this.selectedProductIds = [];
              this.foundCustomerProduct = false;
              this.userForm.reset()
              this.editorTitle = "ADD USER";
              this.buttonText = "Save";
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

  onRoleSelectionChange($event: Event) {
    if (this.selectedRole === "" || this.selectedRole == null) {
      this.isRoleFieldValid = false;
    } else {
      this.isRoleFieldValid = true;
    }
  }

  addNew() {
    this.arePasswordfieldsRequired = true;
    this.selectedRole = [];
    this.selectedCustomerId = null;
    this.selectedProductIds = [];
    this.fetchedCustomer = [];
    this.isRoleFieldValid = false;
    this.foundCustomerProduct = false;
    this.userForm.get('roleName')?.enable();
    this.userForm.get('customerName')?.enable();
    this.fcpDisable = false;
    this.userForm.reset()
    this.editorTitle = "ADD USER";
    this.buttonText = "Save";
  }

  onSearch(event: { term: string }): void {
    this.customerPageNo = 0;
    this.customerSearchTerms.next(event.term);
  }

  onSubmit(formGroupDirective: FormGroupDirective) {
    if (this.buttonText === "Save") {
      this.createNewUser(formGroupDirective);
    } else if (this.buttonText === "Update") {
      this.updateExistingUser(formGroupDirective);
    }
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
      this.fetchUser();
    }
  }

  openDeleteConfirmation(user: any) {
    let name = user.name;
    const dialogRef = this.dialog.open(DeleteDialogComponent, {
      width: '300px',
      data: { name },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.removeExistingUser(user);
      }
    });
  }




}

