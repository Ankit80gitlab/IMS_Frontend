import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Sort } from '@angular/material/sort';
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

export interface featureId {
  id: number;
}

export interface RoleInterface {
  sNo: number;
  id: number;
  name: string;
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

  private readonly toast = inject(ToastrService);
  @ViewChild('grid') grid!: MtxGrid;
  @ViewChild('input') input!: ElementRef;

  constructor(private roleMgntServ: RoleManagementService) {
  }

  currentRoleId: number = 0;

  selectedFeatureOfRole: any;
  allRoles: any[] = [];
  allFeatures: Array<Feature> = [];

  isFeatureFieldValid: boolean = false;
  searchItemStatus: boolean = false;


  pageNo: number = 0;
  pageSize: number = 50;
  totalRecords: number = 0;
  searchTerm: string = '';

  roleForm = new FormGroup({
    "name": new FormControl('', [Validators.required]),
  })

  isLoading = false;
  columnSortable = true;
  rowHover = true;
  rowStriped = true;
  showPaginator = true;
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
          pop: {
            title: "Confirm delete?",
            closeText: "No",
            okText: "Yes",
          },
          click: role => this.removeExistingRole(role),
        },
      ],
    },
  ];

  ngOnInit() {
    this.getAllRoles();
    this.getAllFeatures();
  }

  
  ngAfterViewInit() {
    fromEvent(this.input.nativeElement, 'keyup')
      .pipe(
        filter(Boolean),
        debounceTime(500),
        distinctUntilChanged(),
        tap(text => {
          this.searchRole();
        })
      )
      .subscribe();
  }



  getAllRoles() {
    this.roleMgntServ.getAllRoles(this.pageNo, this.pageSize).subscribe({
      next: (resp: any) => {
        let i = 0;
        if (resp.message.length == 0) {
          this.toast.success('No roles Found');
        }
        resp.message.forEach((role: RoleInterface) => {
          role.sNo = this.pageSize * this.pageNo + i + 1;
          this.allRoles.push(role)
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

  getAllFeatures() {
    this.roleMgntServ.getAllFeatures(0, 10).subscribe({
      next: (resp) => {
        for (let feat of resp.message) {
          this.allFeatures.push(feat);
        }
      }, error(err) {
        console.log(err);
      },
    })
  }


  Fetch() {
    if (this.searchTerm == '') {
      this.getAllRoles();
    } else {
      this.pageNo = this.pageNo + 1;
      this.searchApi();
    }
  }

  searchRole() {
    if (this.searchTerm == '') {
      this.searchItemStatus = false;
      this.grid.dataSource.data = [];
      this.allRoles=[];
      this.pageNo = 0;
      this.getAllRoles();
    } else {
      this.searchItemStatus = true;
      this.pageNo = 0;
      this.searchApi();
    }
  }

  searchApi() {
    if (this.pageNo == 0) {
      this.grid.dataSource.data = [];
      this.allRoles = [];
    }
    
    this.roleMgntServ.searchRole(this.searchTerm, this.pageNo, this.pageSize).subscribe({
      next: resp => {
        let i = 0;
        // console.log(resp.data);
        if (resp.data.length > 0) {
          resp.data.forEach((user: RoleInterface) => {
            user.sNo = this.pageSize * this.pageNo + i + 1;
            this.allRoles.push(user);
            i++;
          });
          this.grid.dataSource.data = this.allRoles;
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
      let newRoleObject: Role = {
        'id': 0,
        'name': this.roleForm.value.name?.toUpperCase(),
        'createdBy': 1,
        'featureIds': this.selectedFeatureOfRole,
      }
      let generatedRoleId = 0;
      this.roleMgntServ.createNewRole(newRoleObject).subscribe({
        next: (resp) => {
          if (resp.status === "success") {
            this.toast.success(resp.message);
            generatedRoleId = resp.data;
            newRoleObject.id = generatedRoleId;
            if (this.searchTerm == '' && this.allRoles.length < this.pageSize) {
              this.allRoles.push(newRoleObject);
            } else if (
              newRoleObject.name
                ?.toLowerCase()
                .includes(this.searchTerm.toLowerCase())
            ) {
              newRoleObject.id = (this.allRoles.length + 1).toString();
              this.allRoles.push(newRoleObject);
            }
            this.grid.dataSource.data = this.allRoles;
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
      this.selectedFeatureOfRole = "";
      this.editorTitle = "ADD ROLE";
      this.buttonText = "Save";
      this.roleForm.reset()
      formGroupDirective.resetForm();
    }
    else {
      this.toast.error("Invalid input");
    }
  }

  editExistingRole(role: Role) {
    this.editorTitle = "UPDATE ROLE";
    this.buttonText = "Update";
    this.roleForm.patchValue({
      'name': role.name,
    })
    this.selectedFeatureOfRole = role.featureIds;
    this.currentRoleId = role.id;
  }

  updateExistingRole(formGroupDirective: FormGroupDirective) {
    if (this.roleForm.valid) {
      let updateRoleObject: Role = {
        'id': this.currentRoleId,
        'name': this.roleForm.value.name?.toUpperCase(),
        'createdBy': 1,
        'featureIds': this.selectedFeatureOfRole,
      }

      console.log(updateRoleObject);

      if (this.currentRoleId != 0) {
        this.roleMgntServ.updateExistingRole(updateRoleObject).subscribe({
          next: (resp) => {
            console.log(resp);

            if (resp.status === "success") {
              this.toast.success(resp.message);
              let index = this.allRoles.findIndex(role => role.id === updateRoleObject.id);
              this.allRoles[index] = updateRoleObject;
              this.grid.dataSource.data = this.allRoles;

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
        this.selectedFeatureOfRole = "";
        this.editorTitle = "ADD ROLE";
        this.buttonText = "Save";
        this.roleForm.reset()
        formGroupDirective.resetForm();
      } else {
        this.toast.error("role id not found");
      }
    } else {
      this.toast.error("Invalid Input");
    }
  }

  removeExistingRole(role: Role) {
    console.log(this.allRoles);
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
            console.log(this.allRoles);

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

  onPaginateChange(event: any) {
    console.log('paginate', event);
    if (event.pageSize != this.pageSize) {
      this.allRoles = [];
      this.pageNo = 0;
      this.pageSize = event.pageSize;
      if (this.searchTerm != '') {
        this.searchApi();
      } else {
        this.getAllRoles();
      }
    } else if (event.pageIndex >= this.pageNo) {
      this.getAllRoles();
    }
  }

  //change
}
