import { Component } from '@angular/core';
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

@Component({
  selector: 'app-register',
  imports: [FormsModule,
    CardModule,
    InputGroupModule,
    ToastModule,
    InputGroupAddonModule,
    FloatLabelModule,
    InputTextModule,
    ButtonModule,
    PasswordModule],
  providers: [Router, MessageService],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  data: any = {};
  password_length = false;
  password_symbol = false;
  email_check = false;

  constructor(private authServ: AuthService, private router: Router, private messageServ: MessageService) { }


  onRegister() {
    if (this.data) {
      this.authServ.register(this.data.email, this.data.password).then((data) => {
        if (data) {
          this.messageServ.add({
            severity: 'success',
            summary: 'Register Successful',
            detail: 'Register Successful'
          });

          setTimeout(() => {
            this.router.navigate(['/overview']);
          }, 2000);
        }
      }).catch((err) => {
        this.messageServ.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Something went wrong!'
        });
      });
    }
  }

  checkPassword() {
    if (this.data.password) {
      if (this.data.password.length < 8) {
        this.password_length = false;
      }
      else {
        this.password_length = true;
      }

      const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;

      if (!pattern.test(this.data.password)) {
        this.password_symbol = false;
      } else {
        this.password_symbol = true;
      }
    }
    return false;
  }


  checkInput() {
    if (this.password_length === true && this.password_symbol === true && this.email_check === true) {
      return false;
    }
    else {
      return true;
    }
  }

  checkEmail() {
    if (this.data.email) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!regex.test(this.data.email)) {
        this.email_check = false;
      } else {
        this.email_check = true;
      }
    }
    return false;
  }
}
