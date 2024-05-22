import {Component, Inject, inject, OnInit} from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogRef
} from "@angular/material/dialog";
import {MatDivider} from "@angular/material/divider";
import {MatFormField, MatFormFieldModule, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {MtxSelect} from "@ng-matero/extensions/select";
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {MtxDialogData} from "@ng-matero/extensions/dialog";
import {CustomerManagementService} from "../../../../services/customer-management.service";
import {Constant} from "../../../../utility/constant";
import {ToastrService} from "ngx-toastr";
import {AsyncPipe, NgIf} from "@angular/common";
import {
    BehaviorSubject,
    catchError,
    debounceTime,
    delay,
    Observable,
    of,
    Subject,
    switchMap,
    take,
    tap
} from "rxjs";

@Component({
    selector: 'app-zone-configuration',
    standalone: true,
    imports: [
        MatDialogContent,
        MatDivider,
        MatFormField,
        MatInput,
        MatLabel,
        MtxSelect,
        ReactiveFormsModule,
        FormsModule,
        MatFormFieldModule,
        MatDialogActions,
        MatButtonModule,
        MatDialogClose,
        NgIf,
        AsyncPipe
    ],
    templateUrl: './zone-configuration.component.html',
    styleUrl: './zone-configuration.component.css'
})
export class ZoneConfigurationComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly customerManagementService = inject(CustomerManagementService);
    private readonly toast = inject(ToastrService);
    zoneForm!: FormGroup;
    saveBtnText: string = "Save";
    private customerSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
    customer$: Observable<Object[]> = this.customerSubject.asObservable();
    loading: boolean = false;
    private customerSearchTerms = new Subject<string>();
    customerSearchTermValue: string = "";
    pageNo: number = 0;
    selectedCustomerId!: number | null;
    selectedCustomerName!: string | undefined;

    constructor(public dialogRef: MatDialogRef<ZoneConfigurationComponent>,
                @Inject(MAT_DIALOG_DATA) private data: MtxDialogData) {
        this.zoneForm = this.fb.nonNullable.group({
            id: [null],
            name: [null, [Validators.required]],
            customerId: [null, [Validators.required]],
        });
        if (data != null) {
            this.saveBtnText = "Update";
            this.zoneForm.patchValue(data);
            this.selectedCustomerId = (this.data as any).customerId;
            this.selectedCustomerName = (this.data as any).customerName;
            this.customerSubject.next([
                {id: this.selectedCustomerId, name: this.selectedCustomerName}
            ]);
        }
    };

    ngOnInit(): void {
        this.loadCustomers().pipe(
            take(1),
        ).subscribe(initialItems => {
            const currentItems = this.customerSubject.getValue();
            const updatedItems = currentItems.concat(initialItems);
            this.customerSubject.next(updatedItems);
        });
        this.customerSearchTerms.pipe(
            debounceTime(300),
            tap(() => this.loading = true),
            switchMap(term => {
                this.customerSearchTermValue = term;
                return this.loadCustomers(term);
            })
        ).subscribe(customer => {
            this.customerSubject.next(customer);
            this.loading = false;
        });
    }

    loadCustomers(term: string = "", pageNo: number = 0): Observable<Object[]> {
        return this.customerManagementService.getAllCustomersBasicDetails(term, pageNo, 10).pipe(
            switchMap((response: any) => {
                let items: any = [];
                if (response.status == Constant.SUCCESS) {
                    items = (response.data as Object[]).filter(obj =>
                        Object.values(obj).every(val => this.selectedCustomerId != val)
                    );
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
                this.toast.error(Constant.SOMETHING_WENT_WRONG);
                return of([]);
            })
        );
    };

    onCloseClick(): void {
        this.dialogRef.close();
    };

    onSaveClick(): void {
        if (this.zoneForm.valid) {
            const data = this.zoneForm.value;
            data.customerName = this.selectedCustomerName;
            this.dialogRef.close({click: "save", data: data});
        }
    };

    onDeleteClick(): void {
        if (this.zoneForm.valid) {
            this.dialogRef.close({click: "delete", data: this.zoneForm.value});
        }
    };

    onScrollEnd(): void {
        const currentItems = this.customerSubject.getValue();
        this.loading = true;
        this.loadCustomers(this.customerSearchTermValue, ++this.pageNo).pipe(take(1)).subscribe(newItems => {
            const updatedItems = currentItems.concat(newItems);
            this.customerSubject.next(updatedItems);
            this.loading = false;
        });
    };

    onSearch(event: { term: string }): void {
        this.selectedCustomerId = null;
        this.pageNo = 0;
        this.customerSearchTerms.next(event.term);
    };

    onSelectionChange(event: any): void {
        this.selectedCustomerName = event.name;
    }
}
