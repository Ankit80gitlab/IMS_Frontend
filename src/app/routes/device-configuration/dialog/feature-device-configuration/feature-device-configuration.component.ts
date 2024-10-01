import {Component, Inject, inject, OnInit} from '@angular/core';
import {AsyncPipe, NgIf} from "@angular/common";
import {MatButton} from "@angular/material/button";
import {MAT_DIALOG_DATA, MatDialogContent, MatDialogRef, MatDialogTitle} from "@angular/material/dialog";
import {MatDivider} from "@angular/material/divider";
import {MatError, MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {MtxSelect} from "@ng-matero/extensions/select";
import {FormBuilder, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators} from "@angular/forms";
import {ToastrService} from "ngx-toastr";
import {BehaviorSubject, catchError, debounceTime, Observable, of, Subject, switchMap, take, tap} from "rxjs";
import {Constant} from "../../../../utility/constant";
import {ProductMangementService} from "../../../../services/product-mangement.service";
import {DialogService} from "../../../../utility/dialog.service";

@Component({
    selector: 'app-feature-device-configuration',
    standalone: true,
    imports: [
        AsyncPipe,
        MatButton,
        MatDialogContent,
        MatDialogTitle,
        MatDivider,
        MatFormField,
        MatInput,
        MatLabel,
        MatError,
        MtxSelect,
        NgIf,
        ReactiveFormsModule,
        MatDialogTitle
    ],
    templateUrl: './feature-device-configuration.component.html',
    styleUrl: './feature-device-configuration.component.css'
})
export class FeatureDeviceConfigurationComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private productManagementService = inject(ProductMangementService);
    private readonly toast = inject(ToastrService);
    deviceForm!: FormGroup;
    saveBtnText: string = "Save";
    private productSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
    product$: Observable<Object[]> = this.productSubject.asObservable();
    loading: boolean = false;
    private productSearchTerms = new Subject<string>();
    productSearchTermValue: string = "";
    pageNo: number = 0;
    selectedCustomerId!: number | null;
    selectedZoneId!: number | null;
    selectedProductId!: number | null;
    selectedProductName!: string | undefined;
    areas!: Object[] | undefined;

    constructor(public dialogRef: MatDialogRef<FeatureDeviceConfigurationComponent>,
                @Inject(MAT_DIALOG_DATA) private data: any,
                private dialogService: DialogService) {
        this.deviceForm = this.fb.nonNullable.group({
            id: [null],
            name: [null, [Validators.required]],
            uid: [null,[Validators.required]],
            productId: [null, [Validators.required]],
            areaId: [null, [Validators.required]],
            lat: [null, [Validators.required]],
            lon: [null, [Validators.required]],
            description:[null]
        });
        const formData: any = {};
        this.areas = data.areas;
        formData.lat = data.lat;
        formData.lon = data.lon;
        formData.areaId = data.areaId;
        this.selectedZoneId = data.zoneId;
        this.selectedCustomerId = data.customerId;
        this.selectedProductId = data.productId;
        this.selectedProductName = data.productName;
        if (data.id) {
            this.saveBtnText = "Update";
            formData.id = data.id;
            formData.uid = data.uid;
            formData.name = data.name;
            formData.productId = this.selectedProductId;
            this.productSubject.next([
                {id: this.selectedProductId, productName: this.selectedProductName}
            ]);
        }
        this.deviceForm.patchValue(formData);
    };

    ngOnInit(): void {
        this.loadProducts().pipe(
            take(1),
        ).subscribe(initialItems => {
            const currentItems = this.productSubject.getValue();
            const updatedItems = currentItems.concat(initialItems);
            this.productSubject.next(updatedItems);
        });
        this.productSearchTerms.pipe(
            debounceTime(300),
            tap(() => this.loading = true),
            switchMap(term => {
                this.productSearchTermValue = term;
                return this.loadProducts(term);
            })
        ).subscribe(product => {
            this.productSubject.next(product);
            this.loading = false;
        });
    }

    loadProducts(term: string = '', pageNo: number = 0): Observable<Object[]> {
        return this.productManagementService.getAllProductsBasicDetails(term, this.selectedCustomerId, pageNo, 10).pipe(
            switchMap((response: any) => {
                let items: any = [];
                if (response.status == Constant.SUCCESS) {
                    items = (response.data as Object[]).filter(obj =>
                        Object.values(obj).every(val => this.selectedProductId != val)
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

    onCloseClick(formGroupDirective: FormGroupDirective): void {
        this.deviceForm.reset();
        formGroupDirective.reset();
        this.dialogService.submit(undefined);
        this.dialogRef.close();
    };

    onSaveClick(): void {
        if (this.deviceForm.valid) {
            const data = this.deviceForm.value;
            data.productName = this.selectedProductName;
            data.zoneId = this.selectedZoneId;
            data.customerId = this.selectedCustomerId;
            this.dialogService.submit({click: "save", data: data});
        }
    };

    onDeleteClick(): void {
        this.dialogService.submit({click: "delete", data: this.deviceForm.value});
    };

    onScrollEnd(): void {
        const currentItems = this.productSubject.getValue();
        this.loading = true;
        this.loadProducts(this.productSearchTermValue, ++this.pageNo).pipe(take(1)).subscribe(newItems => {
            const updatedItems = currentItems.concat(newItems);
            this.productSubject.next(updatedItems);
            this.loading = false;
        });
    };

    onSearch(event: { term: string }): void {
        this.selectedProductId = null;
        this.pageNo = 0;
        this.productSearchTerms.next(event.term);
    };

    onSelectionChange(event: any): void {
        if (event) {
            this.selectedProductName = event.productName;
        }
    };

    onAreaSelectionChange(event: any): void {
        if (event) {
            this.selectedZoneId = event.zoneId;
            this.selectedCustomerId = event.customerId;
        }
    };
}
