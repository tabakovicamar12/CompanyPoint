import { TestBed } from '@angular/core/testing';

import { DataService } from './data-service';

describe('DataService', () => {
  let service: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return all students', () => {
    const students = service.getStudents();
    expect(students.length).toBe(3);
    expect(students[0].firstName).toBe('Amar');
  });

  it('should return add student', () => {
    const students = service.getStudents();
    const student = { id: '3', first_name: 'Alice', last_name: "Smith", email: "", ects: 3, courses: [] };
    service.addStudent(student);

    expect(students.length).toBe(4);
  });

  it('should delete a student', () => {
    service.deleteStudent(1);
    const students = service.getStudents();

    expect(students.length).toBe(2);
    expect(students.find(s => s.id === 1)).toBeUndefined();
  });

  it('should return all courses', () => {
    const courses = service.getAllCourses();

    expect(courses.length).toBe(4);
    expect(courses[0].course_name).toBe('Introduction to Programming');
  });
});
