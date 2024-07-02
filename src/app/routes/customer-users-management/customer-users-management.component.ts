import { Component, ElementRef, Inject, ViewChild, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatError, MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MtxSelect } from '@ng-matero/extensions/select';
import { ToastrService } from 'ngx-toastr';
import { MtxDialogData } from '@ng-matero/extensions/dialog';
import { DialogService } from 'app/utility/dialog.service';
import { BehaviorSubject, Observable, Subject, catchError, debounceTime, of, switchMap, take, tap } from 'rxjs';
import { Constant } from 'app/utility/constant';
import { CustomerManagementService } from 'app/services/customer-management.service';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ProductMangementService } from 'app/services/product-mangement.service';
import { MatIconModule } from '@angular/material/icon';
import { UserManagementService } from 'app/services/user-management.service';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';



@Component({
  selector: 'app-customer-users-management',
  standalone: true,
  imports: [
    MatCardModule,
    MatDialogContent,
    MatDialogTitle,
    MatDivider,
    MatFormField,
    MatInput,
    MatLabel,
    MtxSelect,
    MatError,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatDialogActions,
    MatButtonModule,
    MatDialogClose,
    NgIf,
    NgFor,
    MatIconModule,
    MatTooltipModule,
    AsyncPipe
  ],
  templateUrl: './customer-users-management.component.html',
  styleUrl: './customer-users-management.component.css',
})
export class CustomerUsersManagementComponent {

  private readonly fb = inject(FormBuilder);
  private readonly customerManagementService = inject(CustomerManagementService);
  private readonly toast = inject(ToastrService);
  private prodmgntServ = inject(ProductMangementService);
  private readonly userManagementService = inject(UserManagementService);
  @ViewChild('dialogContent') dialogContent!: ElementRef;


  private productSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  private productSearchTerms = new Subject<string>();
  product$: Observable<Object[]> = this.productSubject.asObservable();
  productSearchTermValue: string = '';
  productLoading: boolean = false;
  productPageNo: number = 0;

  private incidentSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  private incidentSearchTerms = new Subject<string>();
  incident$: Observable<Object[]> = this.incidentSubject.asObservable();
  incidentSearchTermValue: string = '';
  incidentLoading: boolean = false;
  incidentPageNo: number = 0;
  fetchedIncident: any;

  incidentTypeDtos!: FormArray;
  itemsList: Array<any> = [];
  disableEscalation: boolean = false;
  fetchedUsers: Array<any> = [];
  selectedFeatureOfRole = [];
  currentProduct: any;

  onFeatureIdChange($event: Event) {}

  customerUserForm!: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<CustomerUsersManagementComponent>,
    @Inject(MAT_DIALOG_DATA) private data: MtxDialogData | any,
    private dialogService: DialogService,
    private formBuilder: FormBuilder) {
  }

  deafultUserList: any = [];
  escalatedToList: any = [];
  disableSelectUser: boolean = true;
  fetchedDefaultUsers: any = [];

  addItem(): void {
    this.incidentTypeDtos = this.customerUserForm.get('incidentTypeDtos') as FormArray;
    this.incidentTypeDtos.push(this.createItem());
    try {
      const element = this.dialogContent.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      console.error('Could not scroll to bottom', err);
    }
  }

  removeGroup(i: number) {this.incidentTypeDtos.removeAt(i);}

  createItem(): FormGroup {
    return this.formBuilder.group({
      id: new FormControl(null, Validators.required),
      defaultUserIds: new FormControl([], Validators.required),
      escalationHour: new FormControl(null, Validators.required),
      incidentEscalationUserIds: new FormControl([], Validators.required)
    });
  }

  ngOnInit(): void {

    this.customerUserForm = new FormGroup({
      id: new FormControl(null, [Validators.required]),
      productName: new FormControl(null, [Validators.required]),
      userIds: new FormControl([]),
      incidentTypeDtos: new FormArray([])
    });

    if (this.data == null) {
      this.customerUserForm.get('userIds')?.disable();
      this.customerUserForm.get('incidentTypeDtos')?.disable();
      this.disableEscalation = true;

      this.loadProducts().pipe(take(1))
        .subscribe(initialItems => {
          this.productSubject.next(initialItems);
        });
      this.productSearchTerms.pipe(
        debounceTime(300),
        tap(() => this.productLoading = true),
        switchMap(term => {
          this.productSearchTermValue = term;
          return this.loadProducts(term);
        })
      ).subscribe(obj => {
        this.productSubject.next(obj);
        this.productLoading = false;
      });

    } else {
      this.currentProduct = this.data.product.id;
      this.customerUserForm.get('userIds')?.enable();
      this.customerUserForm.get('incidentTypeDtos')?.enable();
      this.disableEscalation = false;

      this.settingCurrentProduct(this.data.product.productName); // setting current product

      let CurrentUsers = this.data.product.Users;
      this.fetchedUsers.length = 0;
      for (let user of CurrentUsers) {
        this.fetchedUsers.push(user.id); // current users of customer
      }

      this.userManagementService.getAllCustomerUsersBasicDetails(this.data.customerId, '', 0, 100).subscribe({
        next: response => {
          if (response.status == Constant.SUCCESS) {
            let users = [];
            for (let i of response.data) {
              users.push(i);
            }
            users.forEach(item => { delete item.products });
            this.itemsList = users; // all users of customer

            let defList: Array<any> = [];
            let escList: Array<any> = [];
            this.itemsList.filter(x => {
              this.fetchedUsers.filter(y => {
                if (x.id == y) {
                  defList.push(x);
                  escList.push(x);
                }
              })
            })
            // const defListIds = defList.map(item => item.id);
            // const uncommon = this.itemsList.filter(item => !defListIds.includes(item.id));
            // escList = uncommon;
            this.deafultUserList = defList;
            this.escalatedToList = escList;
          }
        }, error(err) {
          console.log(err);
        },
      })

      this.customerUserForm.patchValue({
        id: this.data.product.id,
        productName: this.data.product.productName,
        userIds: this.fetchedUsers
      })
      let fetchedIncidents = this.data.product.IncidentTypesDto;

      for (let incident of fetchedIncidents) {
        let defaultUserIds: any = [];
        incident.defaultUser.forEach((item: any) => {
          defaultUserIds.push(item.id);
        });
        let escalatedUserIds: any = [];
        incident.escalatedUser.forEach((item: any) => {
          escalatedUserIds.push(item.id);
        });
        this.incidentTypeDtos = this.customerUserForm.get('incidentTypeDtos') as FormArray;
        let form = this.formBuilder.group({
          id: new FormControl(incident.id, Validators.required),
          defaultUserIds: new FormControl(defaultUserIds, Validators.required),
          escalationHour: new FormControl(incident.escalationHour, Validators.required),
          incidentEscalationUserIds: new FormControl(escalatedUserIds, Validators.required)
        });
        this.incidentTypeDtos.push(form);
      }

      this.loadIncidents().pipe(
        take(1),
      ).subscribe(initialItems => {
        this.incidentSubject.next(initialItems);
      });
      this.incidentSearchTerms.pipe(
        debounceTime(300),
        tap(() => this.incidentLoading = true),
        switchMap(term => {
          this.incidentSearchTermValue = term;
          return this.loadIncidents(term);
        })
      ).subscribe(obj => {
        this.incidentSubject.next(obj);
        this.incidentLoading = false;
      });
    }
  }

  loadUsers(term: string = "", pageNo: number = 0): Observable<Object[]> {
    return this.customerManagementService.getAllCustomersBasicDetails(term, pageNo, Constant.DEFAULT_PAGE_SIZE).pipe(
      switchMap((response: any) => {
        let items: any = [];
        if (response.status == Constant.SUCCESS) {
          items = response.data;
          console.log(items);
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
  };

  findingCommonUsers(newUserIds: any, existingUsers: any) {
    let removedUsers = existingUsers.filter((item: any) => !newUserIds.includes(item));
    let finalUsers = existingUsers.filter((item: any) => !removedUsers.includes(item));
    return finalUsers;
  }

  onUserSelectionChange(event: any) {
    let newUserIds: any[] = [];
    this.incidentTypeDtos = this.customerUserForm.get('incidentTypeDtos') as FormArray;
    if (this.incidentTypeDtos.length != 0) {
      for (let i of event) {
        newUserIds.push(i.id);
      }
      this.incidentTypeDtos.controls.forEach((control, index) => {
        let finalDefaultUsers = this.findingCommonUsers(newUserIds, control.value.defaultUserIds);
        control.patchValue({
          defaultUserIds: finalDefaultUsers,
        })
        let finalEscalatedUsers = this.findingCommonUsers(newUserIds, control.value.incidentEscalationUserIds);
        control.patchValue({
          incidentEscalationUserIds: finalEscalatedUsers,
        })
      });
    }
    this.deafultUserList = event;
    this.escalatedToList = event;
  }

  areSingleIncidentsSelected: boolean = true;

  onIncidentSelectionChange(event: any) {
    if (event) {
      this.areSingleIncidentsSelected = true;
      let incidentIds: any = [];
      this.incidentTypeDtos = this.customerUserForm.get('incidentTypeDtos') as FormArray;
      if (this.incidentTypeDtos.length != 0) {
        this.incidentTypeDtos.controls.forEach((control, index) => {
          incidentIds.push(control.value.id);
        });
      }
      const valueSet = new Set();
      for (const value of incidentIds) {
        if (valueSet.has(value)) {
          this.toast.error("Selected incident type can not be same")
          this.areSingleIncidentsSelected = false;
          break;
        } else { valueSet.add(value) }
      }
    }
  }

  onCloseClick(formGroupDirective: FormGroupDirective): void {
    this.customerUserForm.reset();
    formGroupDirective.reset();
    this.dialogService.submit(undefined);
    this.dialogRef.close();
  };

  onSaveClick() {
    if (this.customerUserForm.valid) {
      this.customerUserForm.get('userIds')?.enable();
      const data = this.customerUserForm.value;
      this.dialogService.submit({ click: "save", data: data });
    }
  };

  loadProducts(term: string = '', pageNo: number = 0): Observable<Object[]> {
    return this.prodmgntServ.getAllProductsBasicDetails(term, null, pageNo, 10).pipe(
      switchMap((response: any) => {
        let items: any = [];
        if (response.status == Constant.SUCCESS) {
          items = response.data;
        } else {
          if (response.message instanceof Object) {
            this.toast.error(response.message.text);
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

  settingCurrentProduct(productName: any) {
    this.productSubject.next([]);
    const currentItems = this.productSubject.getValue();
    this.prodmgntServ.getAllProductsBasicDetails(productName, null, 0, 10).subscribe({
      next: (response) => {
        if (response.status == Constant.SUCCESS) {
          const updatedItems = currentItems.concat(response.data);
          this.productSubject.next(updatedItems);
        } else {
          this.toast.error(Constant.SOMETHING_WENT_WRONG);
        }
      }
    })
  }

  onScrollProductEnd(): void {
    const currentItems = this.productSubject.getValue();
    this.productLoading = true;
    this.loadProducts(this.productSearchTermValue, ++this.productPageNo).pipe(take(1)).subscribe(newItems => {
      const updatedItems = currentItems.concat(newItems);
      this.productSubject.next(updatedItems);
      this.productLoading = false;
    });
  }

  onProductSearch(event: { term: string }): void {
    this.productPageNo = 0;
    this.productSearchTerms.next(event.term);
  }

  onProductSelectionChange(event: any) {
    if (event != undefined) {
      this.customerUserForm.patchValue({
        productName: event.productName
      })
    }
  }

  loadIncidents(term: string = "", pageNo: number = 0): Observable<Object[]> {
    return this.prodmgntServ.getAllIncidentOfProduct(term, pageNo, Constant.DEFAULT_PAGE_SIZE, this.currentProduct).pipe(
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


  onIncidentScrollEnd(): void {
    const currentItems = this.incidentSubject.getValue();
    this.incidentLoading = true;
    this.loadIncidents(this.incidentSearchTermValue, ++this.incidentPageNo).pipe(take(1)).subscribe(newItems => {
      const updatedItems = currentItems.concat(newItems);
      this.incidentSubject.next(updatedItems);
      this.incidentLoading = false;
    });
  }

  onIncidentSearch(event: { term: string }): void {
    this.incidentPageNo = 0;
    this.incidentSearchTerms.next(event.term);
  }

  compareFn(user1: any, user2: any) {
    return user1 && user2 ? user1.id === user2.id : user1 === user2;
  }


}
