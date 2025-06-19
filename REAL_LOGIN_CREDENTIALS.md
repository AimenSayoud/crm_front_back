# Real Login Credentials (MongoDB)

The frontend now uses **real authentication** against the MongoDB database. Mock data has been completely disabled.

## Test Credentials

### 👤 Candidates
- **John Doe** (Senior Full Stack Developer)
  - Email: `john.doe@example.com`
  - Password: `password123`
  - Role: `candidate`

- **Jane Smith** (Data Scientist)
  - Email: `jane.smith@example.com`
  - Password: `password123`
  - Role: `candidate`

- **Mike Johnson** (UX/UI Designer)
  - Email: `mike.johnson@example.com`
  - Password: `password123`
  - Role: `candidate`

### 🏢 Employers
- **Alice Williams** (TechCorp Solutions)
  - Email: `alice.williams@techcorp.com`
  - Password: `password123`
  - Role: `employer`

- **David Brown** (StartupX)
  - Email: `david.brown@startupinc.com`
  - Password: `password123`
  - Role: `employer`

### 👨‍💼 Administrators & Team Members

#### Super Admin
- **Super Admin** (Full access to all features)
  - Email: `superadmin@recruitment.com`
  - Password: `superadmin123`
  - Role: `superadmin`
  - Access: All features, system-wide administration

#### Admins
- **Admin User** (Can access Team page)
  - Email: `admin@recruitment.com`
  - Password: `admin123`
  - Role: `admin`
  - Access: Team management, user administration

- **James Wilson** (Admin)
  - Email: `james.wilson@recruitment.com`
  - Password: `password123`
  - Role: `admin`

- **Amanda Taylor** (Admin)
  - Email: `amanda.taylor@recruitment.com`
  - Password: `password123`
  - Role: `admin`

#### Employees (Can view team members)
- **Jennifer Martinez** (HR Staff)
  - Email: `jennifer.martinez@recruitment.com`
  - Password: `password123`
  - Role: `employee`

- **Michael Johnson** (HR Staff)
  - Email: `michael.johnson@recruitment.com`
  - Password: `password123`
  - Role: `employee`

- **Sarah Davis** (HR Staff)
  - Email: `sarah.davis@recruitment.com`
  - Password: `password123`
  - Role: `employee`

- **Kevin Anderson** (Recruiter)
  - Email: `kevin.anderson@recruitment.com`
  - Password: `password123`
  - Role: `employee`

- **Lisa Thompson** (Recruiter)
  - Email: `lisa.thompson@recruitment.com`
  - Password: `password123`
  - Role: `employee`

## Notes

- All credentials are from the seed data in MongoDB Atlas
- Passwords are hashed using bcrypt in the database
- Authentication now uses JWT tokens with 15-minute expiry
- Refresh tokens are valid for 7 days
- Mock data system has been completely disabled (`USE_MOCK_DATA = false`)

## Database Status

✅ **Backend**: Connected to MongoDB Atlas (`recruitment_db` database)  
✅ **Authentication**: Real JWT-based auth with bcrypt password hashing  
✅ **Data**: 9 candidates, 7 companies, 20 users (including team members), 41 skills, 5 jobs  
✅ **API Endpoints**: All working with real data  
✅ **Team Management**: 3 admin users + 5 employee users available for testing team features  

## Testing Different Scenarios

- **Valid Login**: Use any of the credentials above
- **Invalid Password**: Use correct email with wrong password
- **Invalid Email**: Use non-existent email address
- **Account Status**: All seeded accounts are active and verified 