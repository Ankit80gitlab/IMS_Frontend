import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { MtxButtonModule } from '@ng-matero/extensions/button';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';

import { AuthService, LoginService, TokenService } from '@core/authentication';
import { UserManagementService } from 'app/services/user-management.service';
import { Toast, ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
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
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly loginServ = inject(LoginService);
  private readonly tokenService = inject(TokenService);
  private userService = inject(UserManagementService);
  private toast = inject(ToastrService);


  isSubmitting = false;
  title:string="Welcome Back ";

  loginForm = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  
  forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required,Validators.email]]
  });

  get username() {
    return this.loginForm.get('username')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  login() {
    this.isSubmitting = true;
    this.auth.login(this.username.value, this.password.value).subscribe({
      next : (response) => {
        if(response==true){
          this.toast.success("Success")
          this.router.navigateByUrl('/');

        }else{
          this.toast.error("Invalid credentials");
          this.isSubmitting = false;
        }
      },
    })
      // .pipe(filter(authenticated => authenticated))
      // .subscribe({
      //   next: (resp: any) => {
      //     console.log(resp);

      //     this.router.navigateByUrl('/');
      //   },
      //   error: (errorRes: HttpErrorResponse) => {
      //     if (errorRes.status === 422) {
      //       const form = this.loginForm;
      //       const errors = errorRes.error.errors;
      //       Object.keys(errors).forEach(key => {
      //         form.get(key === 'email' ? 'username' : key)?.setErrors({
      //           remote: errors[key][0],
      //         });
      //       });
      //     }
      //     this.isSubmitting = false;
      //   },
      // });
  }

  isLoggingIn:boolean=true;

  forgotPassword(){
    this.title = "Forget Password ";
    this.isLoggingIn=false;
  }

  forgotUsername(){
    this.router.navigateByUrl('forgotUsername');
  }

  loginPage(){
    this.forgotPasswordForm.reset();
    this.isLoggingIn=true;
  }

  sendForgetPasswordMail(){
    this.userService.forgetPassword(this.forgotPasswordForm.value.email).subscribe({
      next : (response) => {
        if(response.status==="success"){
          this.toast.success(response.message);
          // this.router.navigateByUrl('/login');
          this.isLoggingIn=true;
          this.title="Welcome Back ";
        }else{
          this.toast.error(response.message);
        }
      },error(err) {
        console.log(err);
      },
    })
  }
}
