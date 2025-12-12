CREATE TABLE IF NOT EXISTS work_hours (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    task_id INTEGER,
    work_date DATE NOT NULL,
    hours NUMERIC(5,2) NOT NULL,
    work_type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
