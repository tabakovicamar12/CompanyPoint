import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterComponent } from './register';

describe('Register', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('check pattern is false of password', () => {
    component.data.password = 'Password1';

    component.checkPassword();

    expect(component.password_symbol).toBeFalsy();
  })

  it('check pattern is true of password', () => {
    component.data.password = 'Password1@aaa';
 
    component.checkPassword();

    expect(component.password_symbol).toBeTruthy();
  })
});
