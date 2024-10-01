import { DialogService } from 'app/utility/dialog.service';
import { Component, Inject, inject, OnInit } from '@angular/core';
import { MatDivider } from "@angular/material/divider";
import { MatError, MatFormField, MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MtxSelect } from "@ng-matero/extensions/select";
import { FormBuilder, FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MtxDialogData } from "@ng-matero/extensions/dialog";
import { ToastrService } from "ngx-toastr";
import { AsyncPipe, NgIf } from "@angular/common";
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef, MatDialogTitle
} from "@angular/material/dialog";

@Component({
  selector: 'app-logout-dialog',
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
    MatDialogTitle],
  templateUrl: './logout-dialog.component.html',
  styleUrl: './logout-dialog.component.css'
})
export class LogoutDialogComponent implements OnInit{

  constructor(private dialogService: DialogService, public dialogRef: MatDialogRef<LogoutDialogComponent>){}

  ngOnInit(){

  }

 
  onLogoutClick(){
    this.dialogService.submit({ click: "logout"});
  }

  onCloseClick(): void {
    this.dialogService.submit({ click: "cancel"});
    this.dialogRef.close();
};

}
