from db import get_cursor, conn

def create_tables():
    cursor = get_cursor()
    
    # Workers table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL
        );
    """)
    
    # Employees table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS employees (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL
        );
    """)
    
    # Managers table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS managers (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL
        );
    """)
    
    # Farm Records table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS farm_records (
            id SERIAL PRIMARY KEY,
            worker_id INTEGER REFERENCES workers(id),
            activity TEXT NOT NULL,
            date DATE DEFAULT CURRENT_DATE
        );
    """)
    
    conn.commit()
    cursor.close()

if __name__ == "__main__":
    create_tables()
    print("Tables created successfully.")
