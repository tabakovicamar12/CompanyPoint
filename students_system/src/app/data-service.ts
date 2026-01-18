import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  data = [
    {
      id: 1,
      firstName: 'Amar',
      lastName: 'Tabaković',
      email: 'amar.tabakovic@example.com',
      position: 'Software Developer',
      department: 'IT',
      status: 'Active',
      hireDate: '2023-01-15T09:00:00Z',
      updatedAt: '2025-01-10T12:00:00Z'
    },
    {
      id: 2,
      firstName: 'Lejla',
      lastName: 'Hadžić',
      email: 'lejla.hadzic@example.com',
      position: 'QA Engineer',
      department: 'Quality Assurance',
      status: 'Active',
      hireDate: '2022-06-01T09:00:00Z',
      updatedAt: '2025-01-12T10:30:00Z'
    },
    {
      id: 3,
      firstName: 'Marko',
      lastName: 'Kovač',
      email: 'marko.kovac@example.com',
      position: 'Project Manager',
      department: 'Management',
      status: 'Inactive',
      hireDate: '2020-03-20T09:00:00Z',
      updatedAt: '2024-11-05T14:15:00Z'
    }
  ];

  courses = [
    { id: '1', course_name: 'Introduction to Programming', professor: 'Dr. Mark Spencer', status: "Zaposleni", student_id: '1' },
    { id: '2', course_name: 'Advanced Databases', professor: 'Prof. Ana Kovač', status: "Zaposleni", student_id: '1' },
    { id: '3', course_name: 'Web Development Fundamentals', professor: 'Dr. Nikola Horvat', status: "Zaposleni", student_id: '1' },
    { id: '4', course_name: 'Algorithms and Data Structures', professor: 'Prof. Elena Petrović', status: "Zaposleni", student_id: '1' },
  ];

  addStudent(student: any) {
    this.data.push(student);
  }

  getStudents() {
    return this.data;
  }

  deleteStudent(studentId: number) {
    this.data = this.data.filter(student => student.id !== studentId);
  }

  /*getCourses(studentId: number) {
    return this.courses.filter(course => course.student_id === studentId);
  }*/

  getAllCourses() {
    return this.courses;
  }
}
