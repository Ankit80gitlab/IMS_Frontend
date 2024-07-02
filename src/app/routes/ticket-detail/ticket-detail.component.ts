import { Component, ElementRef, Input, OnInit, ViewChild, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute } from '@angular/router';
import { PageHeaderComponent } from '@shared';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { NgxEditorModule, Editor, Toolbar } from 'ngx-editor';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  debounceTime,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { Constant } from 'app/utility/constant';
import { ToastrService } from 'ngx-toastr';
import { CustomerManagementService } from 'app/services/customer-management.service';
import { MtxSelect } from '@ng-matero/extensions/select';
import { MatButtonModule } from '@angular/material/button';
import { ProductMangementService } from 'app/services/product-mangement.service';
import { DeviceConfigurationService } from 'app/services/device-configuration.service';
import { UserManagementService } from 'app/services/user-management.service';
import { MatIcon } from '@angular/material/icon';
import { MatChipInput, MatChipsModule } from '@angular/material/chips';
import { TicketManagementService } from 'app/services/ticket-management.service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    MatCardModule,
    PageHeaderComponent,
    MatGridListModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatListModule,
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    NgxEditorModule,
    MtxSelect,
    MatButtonModule,
    MatIcon,
    MatChipsModule,
    MatChipInput
  ],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css',
})
export class TicketDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userManagementService = inject(UserManagementService);
  private readonly customerManagementService = inject(CustomerManagementService);
  private readonly deviceConfigurationService: DeviceConfigurationService = inject(
    DeviceConfigurationService
  );
  private ticketServ = inject(TicketManagementService);
  private readonly toast = inject(ToastrService);
  @ViewChild('fileUpload')
  fileUpload!: ElementRef;
  id: any;
  editor: Editor = new Editor();
  html = '';
  breakpoint: any;
  addStatus: boolean = true;
  pageNo: number = 0;
  private customerSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  customer$: Observable<Object[]> = this.customerSubject.asObservable();
  private customerSearchTerms = new Subject<string>();
  customerSearchTermValue: string = '';
  private userSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  user$: Observable<Object[]> = this.userSubject.asObservable();
  loading: boolean = false;
  private userSearchTerms = new Subject<string>();
  userSearchTermValue: string = '';
  private productSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  product$: Observable<Object[]> = this.productSubject.asObservable();
  //   private productSearchTerms = new Subject<string>();
  //   productSearchTermValue: string = '';
  private deviceSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  deviceArray$: Observable<Object[]> = this.deviceSubject.asObservable();
  deviceLoading: boolean = false;
  private deviceSearchTerms = new Subject<string>();
  deviceSearchTermValue: string = '';
  ticketForm!: FormGroup;
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    // ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];
  myFiles:string [] = [];
  constructor(private route: ActivatedRoute) {
    this.ticketForm = this.fb.nonNullable.group({
      subject: ['', [Validators.required]],
      type: ['', [Validators.required]],
      issueRelated: ['', [Validators.required]],
      priority: ['', [Validators.required]],
      status: ['', [Validators.required]],
      description: [''],
      assignee: [null],
      productId: [''],
      deviceId: [''],
      customerId: [],
      inputFileName:[''],
      comment:['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.id = params?.get('id');
    });
    if (this.id != null) {
      this.addStatus = false;
    }
    this.editor = new Editor();
    this.breakpoint = window.innerWidth <= 450 ? 1 : 4;
    this.loadCustomers()
      .pipe(take(1))
      .subscribe(initialItems => {
        const currentItems = this.customerSubject.getValue();
        const updatedItems = currentItems.concat(initialItems);
        this.customerSubject.next(updatedItems);
      });
    this.customerSearchTerms
      .pipe(
        debounceTime(300),
        tap(() => (this.loading = true)),
        switchMap(term => {
          this.customerSearchTermValue = term;
          return this.loadCustomers(term);
        })
      )
      .subscribe(customer => {
        this.customerSubject.next(customer);
        this.loading = false;
      });

    this.userSearchTerms
      .pipe(
        debounceTime(300),
        tap(() => (this.loading = true)),
        switchMap(term => {
          this.userSearchTermValue = term;
          return this.loadUsers(term);
        })
      )
      .subscribe(customer => {
        this.userSubject.next(customer);
        this.loading = false;
      });


    this.deviceSearchTerms
      .pipe(
        debounceTime(300),
        tap(() => (this.loading = true)),
        switchMap(term => {
          this.deviceSearchTermValue = term;
          return this.loadDevices(term);
        })
      )
      .subscribe(devices => {
        this.deviceSubject.next(devices);
        this.loading = false;
      });
  }
  ngOnDestroy(): void {
    this.editor.destroy();
  }
  onResize(event: any) {
    this.breakpoint = event.target.innerWidth <= 450 ? 1 : 2;
  }
  loadUsers(term: string = '', pageNo: number = 0): Observable<Object[]> {
    return this.userManagementService
      .getAllCustomerUsersBasicDetails(
        this.ticketForm.value.customerId,
        term,
        pageNo,
        Constant.DEFAULT_PAGE_SIZE
      )
      .pipe(
        switchMap((response: any) => {
          let items: any = [];
          if (response.status == Constant.SUCCESS) {
            items = (response.data as Object[]).filter(obj => Object.values(obj));
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

  onScrollEnd(): void {
    const currentItems = this.userSubject.getValue();
    this.loading = true;
    this.loadUsers(this.userSearchTermValue, ++this.pageNo)
      .pipe(take(1))
      .subscribe(newItems => {
        const updatedItems = currentItems.concat(newItems);
        this.userSubject.next(updatedItems);
        this.loading = false;
      });
  }

  onSearch(event: { term: string }): void {
    this.pageNo = 0;
    this.userSearchTerms.next(event.term);
  }
  onSelectionChange(event: any): void {
    if (event) {
      // this.selectedCustomerName = event.name;
    }
  }

  onSearch1(event: { term: string }): void {
    this.pageNo = 0;
    // this.customerSearchTerms.next(event.term);
  }

  onSelectionChange1(event: any): void {
    if (event) {
    }
  }



  loadDevices(term: string = '', pageNo: number = 0): Observable<Object[]> {
    return this.deviceConfigurationService
      .getDevicesWithProduct(this.ticketForm.value.productId, term, pageNo, 1000)
      .pipe(
        switchMap((response: any) => {
          let items = [];
          if (response.status == Constant.SUCCESS) {
            items = response.data;
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

  loadCustomers(term: string = '', pageNo: number = 0): Observable<Object[]> {
    return this.customerManagementService
      .getAllCustomersBasicDetails(term, pageNo, Constant.DEFAULT_PAGE_SIZE)
      .pipe(
        switchMap((response: any) => {
          let items: any = [];
          if (response.status == Constant.SUCCESS) {
            items = (response.data as Object[]).filter(obj => Object.values(obj));
            this.ticketForm.patchValue({ customerId: response.customer_id });
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
  onScrollEndCust(): void {
    const currentItems = this.customerSubject.getValue();
    this.loading = true;
    this.loadCustomers(this.customerSearchTermValue, ++this.pageNo)
      .pipe(take(1))
      .subscribe(newItems => {
        const updatedItems = currentItems.concat(newItems);
        this.customerSubject.next(updatedItems);
        this.loading = false;
      });
  }
  onSearchCustomer(event: { term: string }): void {
    this.pageNo = 0;
    this.customerSearchTerms.next(event.term);
  }

  onSelectionChangeCust(event: any): void {
    this.ticketForm.patchValue({ productId: '', deviceId: '', assignee: '' });
    this.loadUsers()
      .pipe(take(1))
      .subscribe(initialItems => {
        this.userSubject.next(initialItems);
      });
  }
  onProductChange(event: any): void {
    this.deviceSubject.next([]);
    this.loadDevices()
      .pipe(take(1))
      .subscribe(initialItems => {
        const currentItems = this.deviceSubject.getValue();
        const updatedItems = currentItems.concat(initialItems);
        this.deviceSubject.next(updatedItems);
      });
  }
  onAssigneeChange(event: any) {
    console.log(event);
    this.productSubject.next(event?.products);
  }

  getFileDetails (e:any) {
    //console.log (e.target.files);
    for (var i = 0; i < e.target.files.length; i++) { 
      this.myFiles.push(e.target.files[i]);
    }
    console.log(this.myFiles)
  }

  uploadFiles () {
    const frmData = new FormData();
    
    for (var i = 0; i < this.myFiles.length; i++) { 
      frmData.append("fileUpload", this.myFiles[i]);
    }
  }
  onInput(event:any) {

  }
  onClick(event:any) {
    if (this.fileUpload)
      this.fileUpload.nativeElement.click()
  }
  onFileRemove(index:any){
    console.log(index);
    this.myFiles.splice(index, 1);

  }

  addTicket(){
    const frmData = new FormData();
    frmData.append("subject",this.ticketForm.value.subject);
    frmData.append("type",this.ticketForm.value.type);
    frmData.append("issueRelated",this.ticketForm.value.issueRelated);
    frmData.append("priority",this.ticketForm.value.priority);
    // frmData.append("status",this.ticketForm.value.status);
    frmData.append("status","hsdc");
    frmData.append("description",this.ticketForm.value.description);
    frmData.append("assignedTo",this.ticketForm.value.assignee);
    frmData.append("customerId",this.ticketForm.value.customerId);
    frmData.append("productId",this.ticketForm.value.productId);
    frmData.append("deviceId",this.ticketForm.value.deviceId);
    frmData.append("comment",this.ticketForm.value.comment);
    // frmData.append("file");
    Array.from(this.myFiles).forEach(f => frmData.append('file',f))

    this.ticketServ.addTicket(frmData).subscribe({
      next: resp => {
        if (resp.status == Constant.ERROR) {
        }
      }
      });
  }
}
