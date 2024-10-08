import { Component, Inject, inject, OnInit } from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogRef, MatDialogTitle
} from "@angular/material/dialog";
import { MatDivider } from "@angular/material/divider";
import { MatError, MatFormField, MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MtxSelect } from "@ng-matero/extensions/select";
import { FormBuilder, FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MtxDialogData } from "@ng-matero/extensions/dialog";
import { UserManagementService } from "../../../../services/user-management.service";
import { Constant } from "../../../../utility/constant";
import { ToastrService } from "ngx-toastr";
import { AsyncPipe, NgIf } from "@angular/common";
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
import { DialogService } from "../../../../utility/dialog.service";

@Component({
    selector: 'app-area-configuration',
    standalone: true,
    imports: [
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
        AsyncPipe,
        MatDialogTitle
    ],
    templateUrl: './area-configuration.component.html',
    styleUrl: './area-configuration.component.css'
})
export class AreaConfigurationComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly userManagementService = inject(UserManagementService);
    private readonly toast = inject(ToastrService);
    areaForm!: FormGroup;
    saveBtnText: string = "Save";
    private userSubject: BehaviorSubject<Object[]> = new BehaviorSubject<Object[]>([]);
    user$: Observable<Object[]> = this.userSubject.asObservable();
    loading: boolean = false;
    private userSearchTerms = new Subject<string>();
    userSearchTermValue: string = "";
    pageNo: number = 0;
    selectedUserId!: number | null;
    selectedCustomerId!: number | null;
    selectedUserName!: string | undefined;
    zones!: Object[] | undefined;
    currentArea: any;

    constructor(public dialogRef: MatDialogRef<AreaConfigurationComponent>,
        @Inject(MAT_DIALOG_DATA) private data: any,
        private dialogService: DialogService) {
        this.areaForm = this.fb.nonNullable.group({
            id: [null],
            name: [null, [Validators.required]],
            userIds: [null, [Validators.required]],
            customerId: [null, [Validators.required]],
            zoneId: [null, [Validators.required]],
        });
    };

    compareFn(user1: any, user2: any) {
        return user1 && user2 ? user1.id === user2.id : user1 === user2;
    }

    ngOnInit(): void {


        // const formData: any = {};
        // this.selectedUserId = data.userId;
        // this.selectedCustomerId = data.customerId;
        // this.selectedUserName = data.userName;
        // this.zones = data.zones;
        // formData.zoneId = data.zoneId;
        // if (data.id) {
        //     this.saveBtnText = "Update";
        //     formData.id = data.id;
        //     formData.name = data.name;
        //     formData.userId = this.selectedUserId;
        //     this.userSubject.next([
        //         { id: this.selectedUserId, userName: this.selectedUserName }
        //     ]);
        // }
        // this.areaForm.patchValue(formData);

        this.currentArea = this.data;
        // console.log(this.data);

        if (this.currentArea.hasOwnProperty('id')) {
            this.saveBtnText = "Update";
            this.zones = this.currentArea.zones;
            this.areaForm.patchValue({
                id: this.currentArea.id,
                name: this.currentArea.name,
                userIds: this.currentArea.users,
                zoneId: this.currentArea.zones[0].id,
                customerId: this.currentArea.customerId
            });
        } else {
            this.zones = this.currentArea.zones;
            this.areaForm.patchValue({
                zoneId: this.currentArea.zones[0].id,
                customerId: this.currentArea.customerId
            });
        }

        this.loadUsers().pipe(
            take(1),
        ).subscribe(initialItems => {
            const currentItems = this.userSubject.getValue();
            const updatedItems = currentItems.concat(initialItems);
            this.userSubject.next(updatedItems);
        });
        this.userSearchTerms.pipe(
            debounceTime(300),
            tap(() => this.loading = true),
            switchMap(term => {
                this.userSearchTermValue = term;
                return this.loadUsers(term);
            })
        ).subscribe(user => {
            this.userSubject.next(user);
            this.loading = false;
        });
    }

    loadUsers(term: string = "", pageNo: number = 0): Observable<Object[]> {
        return this.userManagementService.getAllCustomerUsersBasicDetails(this.currentArea.customerId, '', 0, Constant.DEFAULT_PAGE_SIZE).pipe(
            switchMap((response: any) => {
                let items: any = [];
                if (response.status == Constant.SUCCESS) {
                    items = (response.data as Object[]).filter(obj =>
                        Object.values(obj).every(val => this.selectedUserId != val)
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

    onCloseClick(formGroupDirective: FormGroupDirective): void {
        this.areaForm.reset();
        formGroupDirective.reset();
        this.dialogService.submit(undefined);
        this.dialogRef.close();
    };

    onSaveClick(): void {
        // console.log(this.areaForm.value);

        if (this.areaForm.valid) {
            const data = this.areaForm.value;
            // data.userName = this.selectedUserName;
            // data.customerId = this.selectedCustomerId;
            let users: any = [];
            this.areaForm.value.userIds.forEach((selectedUserIds: any) => {
                this.user$.subscribe((allUsers: any) => {
                    allUsers.forEach((obj: any) => {
                        if (selectedUserIds == obj.id) {
                            let u = { id: obj.id, userName: obj.userName }
                            users.push(u);
                        }
                    })
                })
            });
            data.users = users;
            this.selectedUserName
            // console.log(data);
            this.dialogService.submit({ click: "save", data: data });

        }
    };

    onDeleteClick(): void {
        this.dialogService.submit({ click: "delete", data: this.areaForm.value });
    };

    onScrollEnd(): void {
        const currentItems = this.userSubject.getValue();
        this.loading = true;
        this.loadUsers(this.userSearchTermValue, ++this.pageNo).pipe(take(1)).subscribe(newItems => {
            const updatedItems = currentItems.concat(newItems);
            this.userSubject.next(updatedItems);
            this.loading = false;
        });
    };

    onSearch(event: { term: string }): void {
        this.selectedUserId = null;
        this.pageNo = 0;
        this.userSearchTerms.next(event.term);
    };

    onSelectionChange(event: any): void {
        if (event) {
            console.log(event);
            this.selectedUserName = event.userName;
            console.log(this.selectedUserName);
            
        }
    };

    onZoneChange(event: any): void {
        if (event) {
            this.selectedCustomerId = event.customerId;
        }
    };
}
