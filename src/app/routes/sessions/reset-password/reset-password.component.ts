import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService, LoginService, TokenService } from '@core';
import { MtxButtonModule } from '@ng-matero/extensions/button';
import { TranslateModule } from '@ngx-translate/core';
import { UserManagementService } from 'app/services/user-management.service';
import { Validators } from 'ngx-editor';
import { Toast, ToastrService } from 'ngx-toastr';
import { filter } from 'rxjs';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MtxButtonModule,
    TranslateModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {

  private readonly fb = inject(FormBuilder);
  private userManagementService = inject(UserManagementService);
  private router = inject(Router);
  private toast = inject(ToastrService);


  constructor(private route: ActivatedRoute){}

  isSubmitting = false;
  token!:string;

  resetPasswordForm = this.fb.group({
    password: ['', [Validators.required,Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  },{ validator: this.passwordMatchValidator }
);

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

  isResettingPassword:boolean=false;
  title:any="";

  ngOnInit(){
    if (this.route.snapshot.url.length == 1) {
      if (this.route.snapshot.url[0].path === "resetPassword") {
        this.route.queryParams.subscribe(params => {
          this.token = params['token'] || null;
        });
        this.isResettingPassword=true;
        this.title="Create Password";
      }
      if (this.route.snapshot.url[0].path === "forgetPassword") {
        this.route.queryParams.subscribe(params => {
          this.token = params['token'] || null;
        });
        this.isResettingPassword=false;
        this.title="Forget Password";
      }
    }
  }

  reset() {
    this.isSubmitting = true;
    this.userManagementService.resetPassword(this.resetPasswordForm.value.password,this.token).subscribe({
      next : response => {
        if(response.status==="success"){
          this.toast.success(response.message);
          this.router.navigateByUrl('/login');
        }else{
          this.toast.error(response.message);
        }
      },error(err) {
        console.log(err);
      },
    })
  }

}
