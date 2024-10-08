import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormControl, Validators, FormGroup, FormGroupDirective } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormFieldModule, MatFormField, MatLabel, MatHint, MatError } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MtxGridModule } from '@ng-matero/extensions/grid';
import { MtxSelectModule, MtxSelect } from '@ng-matero/extensions/select';
import { PageHeaderComponent } from '@shared';
import { UserManagementService } from 'app/services/user-management.service';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-profile-setting',
  standalone: true,
  imports: [
    MatCardModule,
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
  templateUrl: './profile-setting.component.html',
  styleUrl: './profile-setting.component.css'
})

export class ProfileSettingComponent implements OnInit {

  private readonly toast = inject(ToastrService);
  // private webSocket = inject(WebSocket);
  stock: any = {};

  constructor(private fb: FormBuilder,
    private userMgntServ: UserManagementService) {
    // this.webSocket = new WebSocket('ws://localhost:3000/stocks');
    // this.webSocket.onmessage = (event) => {
    //   this.stock = JSON.parse(event.data)
    //   console.log(this.stock);
    // };
  }

  passwordResetFrom: any;

  ngOnInit() {
    this.passwordResetFrom = this.fb.group({
      currentPassword: new FormControl('', Validators.required),
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
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

  onSubmit(formGroupDirective: FormGroupDirective) {
    if (this.passwordResetFrom.valid) {
      let currentPassword = this.passwordResetFrom.value.currentPassword;
      let newPassword = this.passwordResetFrom.value.password;      
      this.userMgntServ.changeUserPassword(currentPassword, newPassword).subscribe({
        next: (resp) => {
          console.log(resp);
          if (resp.status === "success") {
            this.toast.success(resp.message);
          } else {
            this.toast.error(resp.message);
          }
        },
        error(err) {
          console.log(err);
        },
      })
    } else {
      this.toast.error("Invalid input")
    }
    this.passwordResetFrom.reset()
    formGroupDirective.resetForm();
  }
}
