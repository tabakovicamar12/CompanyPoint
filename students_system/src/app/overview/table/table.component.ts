import { CommonModule } from '@angular/common';
import { Component, Input, EventEmitter } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { ToolbarModule } from 'primeng/toolbar';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../data-service';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [TableModule, CommonModule, ButtonModule, ToolbarModule, DialogModule,
    ConfirmDialogModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    InputNumberModule,
    MessageModule,
    FormsModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './table.html',
  styleUrl: './table.css',
})
export class TableComponent {
  @Input() data: any[] = [];
  @Input() columns: any[] = [];
  @Input() expendableColumns: any[] = [];
  @Input() id: string = '';
  employee: any  = {};
  expandedRows: { [key: string]: any } = {};
  productDialog: boolean = false;
  submitted: boolean = false;
  student: any = {};
  data_add: any = {};
  selectedEmployees: any[] = [];
  courses: any[] = [];
  clonedProducts: { [s: string]: any } = {};
  selectedCourses: any[] = [];
  edit: boolean = false;
  first = 0;
  rows = 10;

  rowSelect: EventEmitter<any> = new EventEmitter<any>();
  editingCourseId: any;

  constructor(private messageService: MessageService, private confirmationService: ConfirmationService, private data_service: DataService) {
    this.get_courses();
  }


  expandAll() {
  }

  collapseAll() {
    this.expandedRows = {};
  }

  get_courses() {
    this.courses = this.data_service.getAllCourses();
  }

  next() {
    this.first = this.first + this.rows;
  }

  prev() {
    this.first = this.first - this.rows;
  }

  reset() {
    this.first = 0;
  }

  pageChange(event: any) {
    this.first = event.first;
    this.rows = event.rows;
  }

  openNew() {
    this.data_add = [];
    this.submitted = false;
    this.productDialog = true;
  }

  deleteSelectedEmployees() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete the selected students?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonProps: {
        label: 'No',
        severity: 'secondary',
        variant: 'text'
      },
      acceptButtonProps: {
        severity: 'danger',
        label: 'Yes'
      },
      accept: () => {
        if (this.selectedEmployees) {
          this.selectedEmployees.forEach(student => {
            this.data_service.deleteStudent(student.id);
          });
        }
        this.selectedEmployees = [];
        this.loadEmployeeLazy(null);
        this.messageService.add({
          severity: 'success',
          summary: 'Successful',
          detail: 'Students Deleted',
          life: 3000
        });
      }
    });
  }

  saveProduct() {
    this.submitted = true;

    this.data_add.id = this.generateId().toString();
    this.data_add.courses = this.selectedCourses;
    this.data_service.addStudent(this.data_add);
    this.hideDialog();
    this.selectedCourses = [];
    this.loadEmployeeLazy(null);
    console.log(this.data_add);
  }

  generateId() {
    const students = this.data_service.getStudents();

    if (students.length !== 0) {
      const maxId = Math.max(...students.map(s => s.id));

      if (maxId) {
        return maxId + 1;
      }
      else {
        return 1;
      }
    } else {
      return 1;
    }
  }

  hideDialog() {
    this.productDialog = false;
    this.submitted = false;
  }

  loadEmployeeLazy(event: any) {
    this.data = this.data_service.getStudents();
  }


  onRowEditInit(event: any) {
    this.edit = true;
    this.editingCourseId = event.id;
  }

  onRowEditSave(event: any) {
    var course = this.courses.find(c => c.id === event.id);

    if (course) {
      course.course_name = event.course_name;
      course.professor = event.professor;
      course.status = event.status;

      this.edit = false;
    }
    else { }
  }

  onRowEditCancel(event: any) {
    this.edit = false;
  }
}