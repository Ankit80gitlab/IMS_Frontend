import { ChangeDetectorRef, Component, Directive, ElementRef, HostListener, Input, OnInit, ViewChild, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent } from '@shared';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { NgxEditorModule, Editor, Toolbar } from 'ngx-editor';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, Observable, Subject, Subscription, catchError, debounceTime, of, switchMap, take, tap } from 'rxjs';
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
import { QuillModule } from 'ngx-quill'
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { CustomPipesModule } from 'app/custom-module/module';
import { TimeAgoService } from '@shared/services/time-ago.service';
import { MtxTooltipModule } from '@ng-matero/extensions/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MtxGrid, MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { MatTableModule } from '@angular/material/table';
import { AuthService, TokenService } from '@core';
import { PdfGeneratorService } from 'app/services/pdf-generator.service';
import { ProductIncidentTypeComponent } from '../product-incident-type/product-incident-type.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogService } from 'app/utility/dialog.service';
import { TicketIncidentTypeComponent } from '../ticket-incident-type/ticket-incident-type.component';
import { MtxPhotoviewerModule } from '@ng-matero/extensions/photoviewer';

export interface Ticket {
  id: any;
  subject: any;
  issueRelated: any;
  priority: any;
  status: any;
  assignedTo: any;
  customer: any;
  description: any;
  createdTime: any;
  comments: any;
  files: any;
  subTicket: any;
  updatedBy: any;

}


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
    MatGridListModule,
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    NgxEditorModule,
    MtxSelect,
    MatButtonModule,
    MatIcon,
    MatChipsModule,
    MatChipInput,
    QuillModule,
    MatTabsModule,
    MatDividerModule,
    CustomPipesModule,
    MtxTooltipModule,
    MtxGridModule,
    MatTableModule,
    MtxPhotoviewerModule
  ],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css',
})


export class TicketDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userManagementService = inject(UserManagementService);
  private readonly customerManagementService = inject(CustomerManagementService);
  private readonly deviceConfigurationService: DeviceConfigurationService = inject(DeviceConfigurationService);
  private ticketServ = inject(TicketManagementService);
  private productService = inject(ProductMangementService);
  private readonly toast = inject(ToastrService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private timeAgoService = inject(TimeAgoService);
  private pdfGeneratorService = inject(PdfGeneratorService);
  private authService = inject(AuthService);
  private ticketService = inject(TicketManagementService);

  editorContent: string = '';
  displayedColumns: string[] = ['id', 'subject', 'status', 'createdTime', 'createdBy', 'edit'];

  quillConfig = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['code-block'],
        [{ 'header': 1 }, { 'header': 2 }],               // custom button values
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        //[{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
        //[{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        //[{ 'direction': 'rtl' }],                         // text direction
        //[{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
        //[{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        //[{ 'font': [] }],
        //[{ 'align': [] }],
        ['clean'],                                         // remove formatting button
        ['link'],
        //['link', 'image', 'video']  
      ],
    }
  }

  quillConfig2 = {
    toolbar: false
  }

  @ViewChild('fileUpload') fileUpload!: ElementRef;
  editor: Editor = new Editor();
  @Input() href!: string;


  @ViewChild('grid') grid!: MtxGrid;
  columns: MtxGridColumn[] = [
    {
      header: 'ID',
      field: 'id',
      minWidth: 30,
      width: '30px',
    },
    {
      header: 'Subject',
      field: 'subject',
      minWidth: 150,
      width: '150px',
    },
    {
      header: 'Status',
      field: 'status',
      minWidth: 40,
      width: '40px',
    },
    {
      header: 'Created By',
      field: 'createdBy.userName',
      minWidth: 40,
      width: '40px',
    },
    {
      header: 'Created Time',
      field: 'createdTime',
      minWidth: 100,
      width: '100px',
    },
    {
      header: 'Open ticket',
      field: 'operation',
      minWidth: 30,
      width: '30px',
      pinned: 'right',
      type: 'button',
      buttons: [
        {
          type: 'icon',
          icon: 'edit',
          tooltip: 'Open',
          click: record => console.log(record)
        }
      ]
    }
  ];


  private customerSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  customer$: Observable<Object[]> = this.customerSubject.asObservable();
  private customerSearchTerms = new Subject<string>();
  customerSearchTermValue: string = '';

  private userSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  user$: Observable<Object[]> = this.userSubject.asObservable();
  private userSearchTerms = new Subject<string>();
  userSearchTermValue: string = '';

  private productSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  product$: Observable<Object[]> = this.productSubject.asObservable();

  private incidentSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  incident$: Observable<Object[]> = this.incidentSubject.asObservable();
  private incidentSearchTerms = new Subject<string>();
  incidentSearchTermValue: string = '';

  private deviceSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
  deviceArray$: Observable<Object[]> = this.deviceSubject.asObservable();
  private deviceSearchTerms = new Subject<string>();
  deviceSearchTermValue: string = '';
  deviceLoading: boolean = false;

  id: any;
  subTicketId: any;
  html = '';
  breakpoint: any;
  pageNo: number = 0;
  loading: boolean = false;
  addStatus: boolean = true;
  otherIncidentField: boolean = false;
  addSubTicketStatus: boolean = false;
  ticketForm!: FormGroup;

  issueRelatedArray: any = [];
  incidentTpeComponent!: MatDialogRef<TicketIncidentTypeComponent>;
  dialogSubscription!: Subscription;

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

  files!: FormArray;


  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer,
    private dialog: MatDialog, private dialogService: DialogService, private cdr: ChangeDetectorRef,
  ) {
    this.ticketForm = this.fb.group({
      subject: ['', Validators.required],
      typeId: [, Validators.required],
      issueRelated: ['', [Validators.required]],
      priority: ['', [Validators.required]],
      status: ['', [Validators.required]],
      description: [''],
      assignee: [, Validators.required],
      productId: [, Validators.required],
      deviceId: null,
      customerId: [''],
      inputFileName: [[]],
      comment: [''],
      files: new FormArray([]),
      type: [],
      details: []
    });
  }

  addItem(): void {
    this.files = this.ticketForm.get('files') as FormArray;
    this.files.push(this.createItem());
  }

  createItem(): FormGroup {
    return this.formBuilder.group({
      file: new FormControl(),
      description: new FormControl(),
    });
  }

  userSubscription!: Subscription;
  loggedUser: any;
  admin: boolean = true;

  ngOnInit(): void {

    this.userSubscription = this.authService.user().subscribe(user => (this.loggedUser = user));

    if (this.route.snapshot.url.length == 1) {
      if (this.route.snapshot.url[0].path === "ticketDetail") {
        this.addStatus = true;
        this.addSubTicketStatus = false;
        this.ticketForm.reset();
        this.ticketForm.patchValue({
          status: "new",
          priority: "low"
        });

        // console.log(this.loggedUser);

        if ('customerId' in this.loggedUser) {
          this.admin = false;
          this.ticketForm.patchValue({
            customerId: this.loggedUser.customerId
          });
          this.loadUsers()
            .pipe(take(1))
            .subscribe(initialItems => {
              this.userSubject.next(initialItems);
            });
        }
      }
    }

    else if (this.route.snapshot.url.length == 2) {
      if (this.route.snapshot.url[0].path === "ticketDetail") {
        this.route.paramMap.subscribe(params => {
          this.id = params?.get('id');
        });
        if (this.id != null || this.id != undefined) {
          this.addStatus = false;
          this.populateTicketData(this.id);
        }
      }
    }
    else if (this.route.snapshot.url.length == 3) {
      if (this.route.snapshot.url[1].path === "subticket") {
        this.route.paramMap.subscribe(params => {
          this.subTicketId = params?.get('id');
        });

        if (this.subTicketId != null || this.subTicketId != undefined) {
          this.addStatus = true;
          this.addSubTicketStatus = true;
        }
      }
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

  currentTicket!: Ticket;
  showLastUpdate = true;
  showSubTickets = true;
  currentTicketHistoryData: any = [];

  populateTicketData(ticketId: any) {
    this.ticketServ.getTicketById(ticketId).subscribe({
      next: (resp) => {
        // console.log(resp);

        if (resp.status === Constant.SUCCESS) {
          this.currentTicket = resp.data;
          this.ticketServ.getTicketUpdationHistory(ticketId).subscribe({
            next: (resp) => {
              if (resp.status === Constant.SUCCESS) {
                this.currentTicketHistoryData = resp.data.ticketUpdationHistory;

                this.currentTicketHistoryData.sort((a: any, b: any) => {
                  return new Date(b.updatedTime).getTime() - new Date(a.updatedTime).getTime();
                })
                // console.log(this.currentTicketHistoryData);
              } else {
                // this.toast.error(resp.message);
              }
            }, error(err) {
              console.log(err);
            },
          })
        } else {
          this.toast.error(resp.message);
        }
        if (Object.entries(this.currentTicket.updatedBy).length == 0) {
          this.showLastUpdate = false;
        }
        if (this.currentTicket.subTicket.length == 0) {
          this.showSubTickets = false;
        }
        this.ticketForm.patchValue({
          issueRelated: this.currentTicket.issueRelated,
          subject: this.currentTicket.subject,
          priority: this.currentTicket.priority,
          status: this.currentTicket.status,
          assignee: this.currentTicket.assignedTo.id,
          customerId: this.currentTicket.customer.id,
          description: this.currentTicket.description,
        })

        this.currentTicket.comments.sort((a: any, b: any) => {
          return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime();
        });

        this.currentTicket.files.sort((a: any, b: any) => {
          return new Date(b.uploadedTime).getTime() - new Date(a.uploadedTime).getTime();
        });

        // console.log(this.currentTicket.files);

        this.userManagementService.getAllCustomerUsersBasicDetails(this.ticketForm.value.customerId, '', 0, Constant.DEFAULT_PAGE_SIZE).subscribe({
          next: response => {
            if (response.status == Constant.SUCCESS) {
              let items = (response.data as Object[]).filter(obj => Object.values(obj));
              this.userSubject.next([]);
              this.userSubject.next(items);
            } else {
              this.toast.error(response.message);
            }
          }, error(err) {
            console.log(err);
          },
        })
      }, error(err) {
        console.log(err);
      },
    })
  }

  isEditing = false;

  editTicket() {
    // console.log(this.currentTicket);
    this.isEditing = true;
  }

  cancelTicket() {
    this.isEditing = false;
  }

  loadCustomers(term: string = '', pageNo: number = 0): Observable<Object[]> {
    return this.customerManagementService
      .getAllCustomersBasicDetails(term, pageNo, 10)
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

  loadUsers(term: string = '', pageNo: number = 0): Observable<Object[]> {
    return this.userManagementService.getAllCustomerUsersBasicDetails(
      this.ticketForm.value.customerId, term, pageNo, 10)
      .pipe(
        switchMap((response: any) => {
          let items: any = [];
          if (response.status == Constant.SUCCESS) {
            items = (response.data as Object[]).filter(obj => Object.values(obj));
            this.cdr.detectChanges();
          } else {
            if (response.message instanceof Object) {
              this.toast.error(response.message.text);
            } else {
              this.toast.error(response.message);
            }
            // console.log(response);
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

  loadIncidentType(term: string = '', pageNo: number = 0) {
    return this.productService.getAllIncidentOfProduct(
      term, pageNo, 5, this.ticketForm.value.productId)
      .pipe(
        switchMap((response: any) => {
          // console.log(response);

          let items: any = [];
          if (response.status == Constant.SUCCESS) {
            items = (response.data as Object[]).filter(obj => Object.values(obj));
            let obj = {
              id: 0,
              type: "Other"
            }
            items.push(obj);
            this.issueRelatedArray.length = 0;
            if (response.issueRelated === 'hardware') {
              this.issueRelatedArray.push({ value: 'hardware', name: 'Hardware' });
              this.ticketForm.patchValue({ issueRelated: response.issueRelated });
            } else if (response.issueRelated === 'software') {
              this.issueRelatedArray.push({ value: 'software', name: 'Software' });
              this.ticketForm.patchValue({ issueRelated: response.issueRelated });
            }
            let opt = {
              "issueRelated": response.data.issueRelated
            }
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

  onCustomerScrollEnd(): void {
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

  onCustomerSelectionChange(event: any): void {
    if (event) {
      this.loadUsers()
        .pipe(take(1))
        .subscribe(initialItems => {
          this.userSubject.next(initialItems);
        });
    }
    this.ticketForm.patchValue({ productId: null, deviceId: null, assignee: null, typeId: null });
    this.userSubject.next([]);
    this.productSubject.next([]);
    this.incidentSubject.next([]);
    this.deviceSubject.next([]);
  }

  onAssigneeScrollEnd(): void {
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

  onAssigneeSearch(event: { term: string }): void {
    if (this.ticketForm.value.customerId != null) {
      this.pageNo = 0;
      this.userSearchTerms.next(event.term);
    }
  }

  onAssigneeSelectionChange(event: any) {
    this.ticketForm.patchValue({ productId: null, deviceId: null, typeId: null });
    this.productSubject.next([]);
    this.incidentSubject.next([]);
    this.deviceSubject.next([]);
    this.ticketForm.patchValue({ issueRelated: null })
    this.issueRelatedArray.length = 0;
    if (event) {
      this.productSubject.next(event?.products);
    }
  }

  onProductScrollEnd() { }

  onProductSearch(event: { term: string }): void { this.pageNo = 0; }

  onProductChange(event: any): void {
    if (event === undefined) {
      this.ticketForm.patchValue({ issueRelated: null })
      this.issueRelatedArray.length = 0;
    }
    if (event) {
      this.loadIncidentType().pipe(take(1)).subscribe(
        initialItems => {
          this.incidentSubject.next(initialItems);
        });

      this.loadDevices()
        .pipe(take(1))
        .subscribe(initialItems => {
          const currentItems = this.deviceSubject.getValue();
          const updatedItems = currentItems.concat(initialItems);
          this.deviceSubject.next(updatedItems);
        });
    }
    this.ticketForm.patchValue({ deviceId: null, typeId: null, issueRelated: null });
    this.incidentSubject.next([]);
    this.deviceSubject.next([]);

  }

  onIncidentScrollEnd() { }

  onIncidentSearch() { }

  onDeviceSearch() { }

  onIssueRelatedChange(event: Event) {
  }

  onIncidentChange(event: Event) {
    if (event === undefined) {
      this.otherIncidentField = false;
    }
    if (event) {
      if (event.type === 'Other') {
        this.addIncidentType();
      } else {
        this.otherIncidentField = false;
      }
    }
  }

  addIncidentType() {
    this.incidentTpeComponent = this.dialog.open(TicketIncidentTypeComponent, {
      data: '', autoFocus: false, disableClose: true
    });
    this.dialogSubscription = this.dialogService.dataObservable$.pipe(take(1)).subscribe((result) => {
      if (result === undefined) {
        // console.log("closed");
        this.otherIncidentField = false;
        this.ticketForm.patchValue({
          typeId: null
        })
      }
      if (result) {
        if (result.click === "save") {
          this.dialog.closeAll();
          this.otherIncidentField = true;
          this.ticketForm.patchValue({
            typeId: 0,
            type: result.data.type,
            details: result.data.description
          })
          this.ticketForm.get('type')?.disable();
          this.ticketForm.get('details')?.disable();
        }
      }
    })
  }

  getFileDetails(e: any) {
    if (e.target.files.length != 0) {
      this.files = this.ticketForm.get('files') as FormArray;
      for (let i of e.target.files) {
        let form = this.formBuilder.group({
          file: new FormControl(i),
          fileName: new FormControl(i.name),
          description: new FormControl('')
        });
        this.files.push(form);
      }
    }
  }

  onInput(event: any) {
  }

  onClick(event: any) {
    if (this.fileUpload)
      this.fileUpload.nativeElement.click()
  }

  onFileRemove(index: any) {
    this.files.removeAt(index);
  }

  files_: any[] = [];
  onFileChange(event: any) {
    this.files_ = event.target.files;
  }

  addTicket() {
    this.ticketForm.get('type')?.enable();
    this.ticketForm.get('details')?.enable();

    const frmData = new FormData();
    frmData.append("subject", this.ticketForm.value.subject);
    // frmData.append("typeId", this.ticketForm.value.typeId);
    frmData.append("issueRelated", this.ticketForm.value.issueRelated);
    frmData.append("priority", this.ticketForm.value.priority);
    frmData.append("status", this.ticketForm.value.status);
    frmData.append("description", this.ticketForm.value.description);
    frmData.append("assignedTo", this.ticketForm.value.assignee);
    frmData.append("customerId", this.ticketForm.value.customerId);
    frmData.append("productId", this.ticketForm.value.productId);
    if (this.otherIncidentField) {
      frmData.append("type", this.ticketForm.value.type);
      frmData.append("details", this.ticketForm.value.details);
    } else {
      frmData.append("typeId", this.ticketForm.value.typeId);
    }
    if (this.ticketForm.value.deviceId != null) {
      frmData.append("deviceId", this.ticketForm.value.deviceId);
    }
    if (this.addSubTicketStatus == true) {
      frmData.append("parentTicketId", this.subTicketId);
    }
    if (this.ticketForm.value.comment === "" || this.ticketForm.value.comment === null) {
    } else {
      frmData.append("comment", this.ticketForm.value.comment);
    }

    this.files = this.ticketForm.get('files') as FormArray;
    let index: number = 0;
    this.files.value.forEach((file: any) => {
      let fileString = "ticketFileDtos[" + index + "].file";
      let descriptionString = "ticketFileDtos[" + index + "].optionalDescription";
      frmData.append(fileString, file.file);
      frmData.append(descriptionString, file.description);
      index++;
    })

    this.ticketServ.addTicket(frmData).subscribe({
      next: resp => {
        if (resp.status == Constant.ERROR) {
          this.toast.error(resp.message);
        } else {
          this.toast.success(resp.message);
          this.ticketForm.markAsPristine();
          this.ticketForm.reset();
          this.files.clear();
          this.router.navigateByUrl('/ticketManagement');
        }
      }
    });
  }

  updateTicket() {
    const frmData = new FormData();
    frmData.append("id", this.currentTicket.id);
    frmData.append("subject", this.ticketForm.value.subject);
    frmData.append("issueRelated", this.ticketForm.value.issueRelated);
    frmData.append("priority", this.ticketForm.value.priority);
    frmData.append("status", this.ticketForm.value.status);
    frmData.append("assignedTo", this.ticketForm.value.assignee);
    if (this.ticketForm.value.comment === "") {
    } else {
      frmData.append("comment", this.ticketForm.value.comment);
    }

    this.files = this.ticketForm.get('files') as FormArray;
    let index: number = 0;
    this.files.value.forEach((file: any) => {
      let fileString = "ticketFileDtos[" + index + "].file";
      let descriptionString = "ticketFileDtos[" + index + "].optionalDescription";
      frmData.append(fileString, file.file);
      frmData.append(descriptionString, file.description);
      index++;
    })

    this.ticketServ.updateTicket(frmData).subscribe({
      next: (response) => {
        if (response.status == Constant.SUCCESS) {
          this.toast.success(response.message);
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate(['/ticketDetail/' + this.currentTicket.id]);
          });
          // this.router.navigate(['/ticketManagement']);
        } else {
          this.toast.error(response.message)
        }
      }, error(err) {
        console.log(err);
      },
    })
  }

  addSubTask() {
    this.router.navigate(['/ticketDetail/subticket/' + this.currentTicket.id]);
  }

  fileUrl: string | null = null;
  fileType: string | null = null;
  fileName: string | null = null;
  check: any;

  viewFile(file: any): void {
    const newUrl = '/attachments/' + file.id;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([newUrl]);
    });
  }

  safeFileUrl: any;
  getFileUrl(fileId: number): any {
    this.ticketServ.viewTicketFile(fileId).subscribe(blob => {
      const file = new Blob([blob], { type: blob.type });
      this.fileUrl = URL.createObjectURL(file);
      this.safeFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.fileUrl);
      return this.safeFileUrl;
    });
  }

  downloadTicketFile(fileName: any, fileId: any) {
    this.ticketServ.downloadTicketFile(fileId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      // console.log(url);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
      this.toast.success("Downloaded")
    });
  }

  openSubTicket(element: any) {
    const newUrl = '/ticketDetail/' + element.id;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([newUrl]);
    });
  }

  timeAgo(timestamp: string) {
    return this.timeAgoService.calculateTimeAgo(timestamp);
  }

  public downloadPDF(): void {
    this.pdfGeneratorService.downloadPDF('contentToConvert', this.ticketForm.value.subject);
  }

  cancelCreateTicket() {
    this.router.navigateByUrl('ticketManagement')
  }

}
