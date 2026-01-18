import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableComponent } from './table.component';
import { DataService } from '../../data-service';

describe('Table', () => {
  let component: TableComponent;
  let fixture: ComponentFixture<TableComponent>;
  let message: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TableComponent);
    component = fixture.componentInstance;
    message = fixture.nativeElement.querySelector('p-message');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
