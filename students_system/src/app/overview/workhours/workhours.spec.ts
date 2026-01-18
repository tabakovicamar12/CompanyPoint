import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Workhours } from './workhours';

describe('Workhours', () => {
  let component: Workhours;
  let fixture: ComponentFixture<Workhours>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Workhours]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Workhours);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
