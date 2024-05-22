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
import { Role } from 'app/model-class/role';
import { Feature } from 'app/model-class/features';
import { UserManagementService } from 'app/services/user-management.service';
import { User } from 'app/model-class/user';
import { ToastrService } from 'ngx-toastr';
import { CustomerManagementService } from 'app/services/customer-management.service';
import { fromEvent, filter, debounceTime, distinctUntilChanged, tap } from 'rxjs';
import { AsyncPipe, NgIf } from "@angular/common";
import {
  BehaviorSubject,
  catchError,
  Observable,
  of,
  Subject,
  switchMap,
  take
} from "rxjs";

export interface UserInterface {
  sNo: number;
  id: any;
  username: any;
  name: any;
  email: any;
  password: any;
  roleId: any;
  customerId: any;
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
    AsyncPipe],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class MyComponent implements OnInit {

  private readonly toast = inject(ToastrService);
  private readonly customerServ = inject(CustomerManagementService);
  private customerSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  private customerSearchTerms = new Subject<string>();
  customer$: Observable<Object[]> = this.customerSubject.asObservable();
  loading: boolean = false;

  customerSearchTermValue: string = "";
  customerPageNo: number = 0;
  customerForm!: FormGroup;

  constructor(
    private userMgntServ: UserManagementService,
    private roleMgntServ: RoleManagementService,
    private renderer: Renderer2,
    private fb: FormBuilder) {

    this.customerForm = this.fb.nonNullable.group({
      customerId: [null],
      name: [null],
    });
  }

  @ViewChild('grid') grid!: MtxGrid;
  @ViewChild('input') input!: ElementRef;
  @HostListener("window:scroll", ["$event"])
  @ViewChild('scrollableElement')
  private scrollableElement!: ElementRef;

  onScroll(event: any) {
    let tracker = event.target;
    let limit = tracker.scrollHeight - tracker.clientHeight;
    if (event.target.scrollTop === limit) {
      console.log('end reached');
      //this.Fetch();
      //this.scrollToTop();
    }
  }

  scrollToTop(): void {
    this.renderer.setProperty(this.scrollableElement.nativeElement, 'scrollTop', 0);
  }

  currentUser: any;

  selectedRole: any;
  selectedCustomerId: any;
  allUsers: any[] = [];
  allRoles: Array<Role> = [];
  allFeatures: Array<Feature> = [];
  allCustomers: any[] = [];
  allCustomerProduct: any[] = [];

  isRoleFieldValid: boolean = false;
  isRoleFieldValidForUpdate: boolean = true;
  arePasswordfieldsRequired: boolean = true;
  foundCustomerProduct: boolean = false;
  searchItemStatus: boolean = false;
  userForm: any;
  selectedProductIds: any[] = [];
  searchTerm: string = '';

  pageNo: number = 0;
  pageSize: number = 10;
  totalRecords: number = 0;


  isLoading = false;
  columnSortable = true;
  rowHover = true;
  rowStriped = true;
  showPaginator = true;
  editorTitle: string = "ADD USER";
  buttonText: string = "Save";

  columns: MtxGridColumn[] = [
    {
      header: 'Id',
      field: 'id',
      sortable: true,
      minWidth: 100,
      width: '100px',
    },
    {
      header: 'Name',
      field: 'name',
      sortable: true,
      minWidth: 100,
      width: '100',
    },
    {
      header: 'User Name',
      field: 'username',
      sortable: true,
      minWidth: 100,
      width: '160px',
    },
    {
      field: 'operation',
      minWidth: 100,
      width: '140px',
      pinned: 'right',
      type: 'button',
      buttons: [
        {
          type: 'icon',
          icon: 'edit',
          tooltip: "Edit Role",
          click: user => this.editExistingUser(user),
        },
        {
          type: 'icon',
          color: 'warn',
          icon: 'delete',
          tooltip: "Delete Role",
          pop: {
            title: "Confirm delete?",
            closeText: "No",
            okText: "Yes",
          },
          click: user => this.removeExistingUser(user),
        },
      ],
    },
  ];


  ngOnInit() {
    this.getAllUser();
    this.getAllRoles();
    this.customerInfiniteLoading();

    this.userForm = this.fb.group({
      name: new FormControl('', Validators.required),
      username: new FormControl('', Validators.required),
      email: new FormControl('', Validators.required),
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });

  }

  ngAfterViewInit() {
    fromEvent(this.input.nativeElement, 'keyup')
      .pipe(
        filter(Boolean),
        debounceTime(500),
        distinctUntilChanged(),
        tap(text => {
          this.searchUser();
        })
      )
      .subscribe();
  }

  getAllUser() {
    this.userMgntServ.getAllUser(this.pageNo, this.pageSize).subscribe({
      next: (resp: any) => {
        let i = 0;
        if (resp.message.length == 0) {
          this.toast.success('No users Found');
        }
        resp.message.forEach((user: UserInterface) => {
          user.sNo = this.pageSize * this.pageNo + i + 1;
          this.allUsers.push(user)
          i++;
        });
        this.pageNo = this.pageNo + 1;
        this.totalRecords = this.totalRecords + this.pageSize + 1;
      }, error(err) {
        console.log(err);
        alert('SOMETHING_WENT_WRONG_TRY_AGAIN_LATER');
      },
    })
  }

  getAllRoles() {
    this.roleMgntServ.getAllRoleBasicDetails().subscribe({
      next: (resp: any) => {
        resp.data.forEach((role: any) => {
          this.allRoles.push(role)
        });
      }, error(err) {
        console.log(err);
      },
    })
  }

  customerInfiniteLoading() {
    this.loadCustomers().pipe(
      take(1),
    ).subscribe(initialItems => {
      this.customerSubject.next(initialItems);
    });
    this.customerSearchTerms.pipe(
      debounceTime(300),
      tap(() => this.loading = true),
      switchMap(term => {
        this.customerSearchTermValue = term;
        return this.loadCustomers(term);
      })
    ).subscribe(products => {
      this.customerSubject.next(products);
      this.loading = false;
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
          console.log(response);
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

  onScrollEnd(): void {
    const currentItems = this.customerSubject.getValue();
    this.loading = true;
    this.loadCustomers(this.customerSearchTermValue, ++this.customerPageNo).pipe(take(1)).subscribe(newItems => {
      const updatedItems = currentItems.concat(newItems);
      this.customerSubject.next(updatedItems);
      this.loading = false;
    });
  }

  onSearch(event: { term: string }): void {
    this.customerPageNo = 0;
    this.customerSearchTerms.next(event.term);
  }

  searchUser() {
    if (this.searchTerm == '') {
      this.searchItemStatus = false;
      this.grid.dataSource.data = [];
      this.allUsers = [];
      this.pageNo = 0;
      this.getAllUser();
    } else {
      this.searchItemStatus = true;
      this.pageNo = 0;
      this.searchApi();
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


  searchApi() {
    if (this.pageNo == 0) {
      this.grid.dataSource.data = [];
      this.allUsers = [];
    }
    this.userMgntServ.searchUser(this.searchTerm, this.pageNo, this.pageSize).subscribe({
      next: resp => {
        let i = 0;
        // console.log(resp.data);
        if (resp.data.length > 0) {
          resp.data.forEach((user: UserInterface) => {
            user.sNo = this.pageSize * this.pageNo + i + 1;
            this.allUsers.push(user);
            i++;
          });
          this.grid.dataSource.data = this.allUsers;
        }
        else {
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
      this.getAllUser();
    } else {
      this.pageNo = this.pageNo + 1;
      this.searchApi();
    }
  }

  onPaginateChange(event: any) {
    // console.log('paginate', event);
    if (event.pageSize != this.pageSize) {
      this.allUsers = [];
      this.pageNo = 0;
      this.pageSize = event.pageSize;
      if (this.searchTerm != '') {
        this.searchApi();
      } else {
        this.getAllUser();
      }
    } else if (event.pageIndex >= this.pageNo) {
      this.getAllUser();
    }
  }

  onRoleSelectionChange($event: Event) {
    if (this.selectedRole === "") {
      this.isRoleFieldValid = false;
    } else {
      this.isRoleFieldValid = true;
    }
  }

  onSubmit(formGroupDirective: FormGroupDirective) {
    if (this.buttonText === "Save") {
      this.createNewUser(formGroupDirective);
    } else if (this.buttonText === "Update") {
      this.updateExistingUser(formGroupDirective);
    }
  }

  onCustomerSelectionChange() {
    this.allCustomerProduct.length = 0;
    let arr = [];
    this.selectedCustomerId = this.customerForm.value.customerId;
    if (this.selectedCustomerId != null && this.selectedCustomerId != 0) {
      this.foundCustomerProduct = true;
      this.customerServ.getAllCustomerProduct(0, 0, this.selectedCustomerId).subscribe({
        next: (resp) => {
          //console.log(resp);
          for (let product of resp.data) {
            this.allCustomerProduct.push(product);
            arr.push(product.id);
          }
          this.selectedProductIds = arr;
        }, error(err) {
          console.log(err);
        },
      })
    } else {
      this.foundCustomerProduct = false;
      this.selectedProductIds = [];
    }
  }

  createNewUser(formGroupDirective: FormGroupDirective) {
    if (this.userForm.valid) {
      let newUserObject: User = {
        'id': 0,
        'name': this.userForm.value.name,
        'username': this.userForm.value.username,
        'email': this.userForm.value.email,
        'password': this.userForm.value.password,
        'roleId': this.selectedRole,
        'customerId': this.selectedCustomerId,
        'productIds': this.selectedProductIds,
      }

      let generatedUserId = 0;
      console.log(newUserObject);

      this.userMgntServ.createNewUser(newUserObject).subscribe({
        next: (resp) => {
          if (resp.status === "success") {
            this.toast.success(resp.message);
            generatedUserId = resp.data;
            newUserObject.id = generatedUserId;
            if (this.searchTerm == '' && this.allUsers.length < this.pageSize) {
              this.allUsers.push(newUserObject);
            } else if (newUserObject.name?.toLowerCase().includes(this.searchTerm.toLowerCase())) {
              newUserObject.id = (this.allUsers.length + 1).toString();
              this.allUsers.push(newUserObject);
            }
            this.grid.dataSource.data = this.allUsers;
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
      this.selectedRole = "";
      this.selectedCustomerId = [];
      this.customerForm.reset();
      this.selectedProductIds = [];
      this.editorTitle = "ADD USER";
      this.buttonText = "Save";
      this.userForm.reset()
      formGroupDirective.resetForm();
    }
    else {
      this.toast.error("Invalid input");
    }
  }

  fetchedCustomer: any;

  compareFn(user1: User, user2: User) {
    return user1 && user2 ? user1.id === user2.id : user1 === user2;
  }

  editExistingUser(user: User) {
    this.arePasswordfieldsRequired = false;
    this.editorTitle = "UPDATE USER";
    this.buttonText = "Update";
    this.userForm.patchValue({
      'name': user.name,
      'username': user.username,
      'email': user.email,
      'password': '',
      'confirmPassword': ''
    })
    this.isRoleFieldValid = true;
    this.selectedRole = user.roleId;
    this.currentUser = user;
    // let item = { id: 4, name: 'ads' };
    // this.fetchedCustomer = item;
    this.customerForm.value.customerId = user.customerId;
    this.foundCustomerProduct = true;
    this.onCustomerSelectionChange();
  }

  updateExistingUser(formGroupDirective: FormGroupDirective) {
    if (this.userForm.valid) {
      let updateUserObject: any = {
        'id': this.currentUser.id,
        'name': this.userForm.value.name,
        "username": this.userForm.value.username,
        "email": this.userForm.value.email,
        "roleId": this.selectedRole,
        "customerId": this.selectedCustomerId,
        "productIds": this.selectedProductIds
      }
      console.log(updateUserObject);

      if (updateUserObject.id != 0) {
        this.userMgntServ.updateExistingUser(updateUserObject).subscribe({
          next: (resp) => {
            console.log(resp);
            if (resp.status === "success") {
              this.toast.success(resp.message);
              let index = this.allUsers.findIndex(user => user.id === updateUserObject.id);
              let upduser = this.allUsers[index];
              upduser.name = updateUserObject.name;
              upduser.username = updateUserObject.username;
              upduser.email = updateUserObject.email;
              upduser.roleId = updateUserObject.roleId;
              upduser.customerId = updateUserObject.customerId;
              upduser.productIds = updateUserObject.productIds;
              this.allUsers[index] = upduser;
              this.grid.dataSource.data = this.allUsers;
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
        this.arePasswordfieldsRequired = true;
        this.selectedRole = "";
        this.selectedCustomerId = [];
        this.selectedProductIds = [];
        this.foundCustomerProduct = false;
        this.editorTitle = "ADD USER";
        this.buttonText = "Save";
        this.userForm.reset()
        formGroupDirective.resetForm();
      } else {
        this.toast.error("role id not found");
      }
    } else {
      this.toast.error("Invalid Input");
    }
  }

  removeExistingUser(user: User) {
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
            this.selectedRole = "";
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

  addNew(formGroupDirective: FormGroupDirective) {
    this.arePasswordfieldsRequired = true;
    this.selectedRole = "";
    this.selectedCustomerId = [];
    this.selectedProductIds = [];
    this.foundCustomerProduct = false;
    this.userForm.reset()
    formGroupDirective.resetForm();
    this.editorTitle = "ADD USER";
    this.buttonText = "Save";
  }



}
