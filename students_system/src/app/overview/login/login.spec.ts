import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthService } from '../../../auth-service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { LoginComponent } from './login';
import { describe, it, expect, vi } from 'vitest';

describe('Login', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServSpy: { login: ReturnType<typeof vi.fn> };
  let messageServSpy: { add: ReturnType<typeof vi.fn> };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authServSpy = { login: vi.fn() };
    messageServSpy = { add: vi.fn() };
    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authServSpy },
        { provide: MessageService, useValue: messageServSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('login password input is empty --- set on false', () => {
    component.data.password = '';
    component.checkPassword();
    expect(component.password_length).toBe(false);
  });

  it('login email input is empty --- set on false', () => {
    component.data.email = '';
    component.checkEmail();
    expect(component.check_email).toBe(false);
  });

  it('check input fields is true', () => {
    component.password_length = true;
    component.check_email = true;
    expect(component.checkInput()).toBe(false);
  });
});
