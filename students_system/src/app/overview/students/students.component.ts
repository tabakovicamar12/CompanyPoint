import { Component } from '@angular/core';
import { TableComponent } from '../table/table.component';
import { DataService } from '../../data-service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [TableComponent],
  templateUrl: './students.html',
  styleUrl: './students.css',
})
export class StudentsComponent {
  data: any[] = [];
  columns_courses = [
    { field: 'id', header: '# ID' },
    { field: 'course_name', header: 'Course name' },
    { field: 'professor', header: 'Professor' },
    { field: 'status', header: 'STATUS' }
  ];

  columns = [
    { field: 'id', header: '# ID' },
    { field: 'firstName', header: 'First name' },
    { field: 'lastName', header: 'Last name' },
    { field: 'email', header: 'Email' },
    { field: 'position', header: 'Position' },
    { field: 'department', header: 'Department' },
    { field: 'status', header: 'Status' },
    { field: 'hireDate', header: 'Hire date' },
    { field: 'updatedAt', header: 'Updated at' }
  ];


  constructor(private dataService: DataService) {
    this.data = this.dataService.getStudents();
    this.data.forEach(student => {
      //student.courses = this.dataService.getCourses(student.id);
      student.courses = [];
    });
  }
}
