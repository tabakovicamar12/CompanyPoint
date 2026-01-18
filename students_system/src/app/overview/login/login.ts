import { Component, signal, inject } from '@angular/core';
import { CardModule } from 'primeng/card';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../auth-service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { NgZone } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule,
    ToastModule,
    CardModule,
    InputGroupModule,
    InputGroupAddonModule,
    FloatLabelModule,
    InputTextModule,
    ButtonModule,
    PasswordModule
  ],
  providers: [Router, MessageService],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private router = inject(Router);
  checked1 = signal<boolean>(true);
  data: any = {};
  password_length = false;
  check_email = false;

  constructor(private authServ: AuthService, private messageServ: MessageService, private zone: NgZone) { }

  onLogin() {
    if (this.data) {
      this.authServ.login(this.data.email, this.data.password)
        .then((data) => {
          if (data && data.token) {
            this.messageServ.add({
              severity: 'success',
              summary: 'Login Successful',
              detail: 'Welcome back!'
            });

            this.zone.run(() => {
              this.router.navigate(['/todo']).then(nav => {
              }).catch(err => {
                console.error('Navigation failed:', err);
              });
            });
          }
          else {
            this.messageServ.add({ severity: 'error', summary: 'Error', detail: 'Invalid credentials' });
          }
        })
        .catch((err) => {
          this.messageServ.add({ severity: 'error', summary: 'Error', detail: 'Invalid credentials' });
        })
    }
  }


  checkPassword() {
    if (this.data.password) {
      if (this.data.password.length <= 0) {
        this.password_length = false;
      }
      else {
        this.password_length = true;
      }
    }
    else {
      this.password_length = false;
    }
  }

  checkEmail() {
    if (this.data.email) {
      if (this.data.email.length <= 0) {
        this.check_email = false;
      }
      else {
        this.check_email = true;
      }
    }
    else {
      this.check_email = false;
    }
  }


  checkInput() {
    if (this.password_length === true && this.check_email === true) {
      return false;
    }
    else {
      return true;
    }
  }
}
