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

  isSubmitting = false;

  loginForm = this.fb.nonNullable.group({
    username: ['ImsAdmin', [Validators.required]],
    password: ['ImsAdmin@002', [Validators.required]]
  });

  get username() {
    return this.loginForm.get('username')!;
  }

  get password() {
    return this.loginForm.get('password')!;
  }

  login() {
    this.isSubmitting = true;

    this.auth
      .login(this.username.value, this.password.value)
      .pipe(filter(authenticated => authenticated))
      .subscribe({
        next: () => {          
          this.router.navigateByUrl('/');
        },
        error: (errorRes: HttpErrorResponse) => {
          if (errorRes.status === 422) {
            const form = this.loginForm;
            const errors = errorRes.error.errors;
            Object.keys(errors).forEach(key => {
              form.get(key === 'email' ? 'username' : key)?.setErrors({
                remote: errors[key][0],
              });
            });
          }
          this.isSubmitting = false;
        },
      });
  }
 }
