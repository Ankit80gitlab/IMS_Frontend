import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MtxButtonModule } from '@ng-matero/extensions/button';
import { TranslateModule } from '@ngx-translate/core';
import { UserManagementService } from 'app/services/user-management.service';
import { ToastrService } from 'ngx-toastr';
import { MatIcon } from '@angular/material/icon';
import { Clipboard } from '@angular/cdk/clipboard';


@Component({
  selector: 'app-forgot-username',
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
    MatIcon
  ],
  templateUrl: './forgot-username.component.html',
  styleUrl: './forgot-username.component.css'
})
export class ForgotUsernameComponent {

  private readonly fb = inject(FormBuilder);
  private userManagementService = inject(UserManagementService);
  private router = inject(Router);
  private toast = inject(ToastrService);


  constructor(private route: ActivatedRoute,private clipboard: Clipboard) { }

  token!: string;

  forgetUserName = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    otp: ['', [Validators.required]]
  });


  ngOnInit() {
    if (this.route.snapshot.url.length == 1) {
      if (this.route.snapshot.url[0].path === "forgotUsername") {
        this.route.queryParams.subscribe(params => {
          this.token = params['token'] || null;
        });
      }
    }
  }

  timer: number = 59;
  interval: any;
  disableOtp: boolean = false;
  timeRemainStatus: boolean = false;
  enableOtpField: boolean = false;
  visibleValidateButton: boolean = true;
  result: boolean = false;
  userName: string = "";

  otpTimeCounter() {
    this.disableOtp = true;
    this.timeRemainStatus = true;
    this.enableOtpField = true;
    this.interval = setInterval(() => {
      this.timer--;
      if (this.timer == 0) {
        clearInterval(this.interval);
        this.timer = 59;
        this.disableOtp = false;
        this.forgetUserName.get('email')?.enable();
        this.timeRemainStatus = false;
      }
    }, 1000)
  }

  getOtp() {
    this.userManagementService.forgetUsername(this.forgetUserName.value.email).subscribe({
      next: response => {
        if (response.status === "success") {
          this.toast.success(response.message);
          this.forgetUserName.get('email')?.disable();
          this.otpTimeCounter();
        } else {
          this.toast.error(response.message);
        }
      }, error(err) {
        console.log(err);
      },
    })
  }

  validate() {
    this.forgetUserName.get('email')?.enable();
    let email = this.forgetUserName.value.email;
    this.forgetUserName.get('email')?.disable();
    this.userManagementService.sendingOtpForForgetPassword(email, this.forgetUserName.value.otp).subscribe({
      next: (response) => {
        console.log(response);
        if (response.status === "success") {
          this.toast.success("Username found");
          this.disableOtp = true;
          this.timeRemainStatus = false;
          this.enableOtpField = false;
          this.visibleValidateButton = false;
          this.result = true;
          this.userName = response.data;
        } else {
          this.toast.error(response.message);
        }
      },
    })
  }

  loginPage() {
    this.router.navigateByUrl('/login');
  }

  copyText() {
    this.clipboard.copy(this.userName);
  }
}
