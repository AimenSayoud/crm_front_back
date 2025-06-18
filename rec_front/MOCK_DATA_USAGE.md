# Mock Data System for Frontend Development

This mock data system allows you to develop and test the frontend without relying on the backend API.

## 🎯 Quick Start

### 1. Enable Mock Data

Add this to your `.env.local` file:
```bash
NEXT_PUBLIC_USE_MOCK_DATA=true
```

Or it will automatically enable in development mode (`NODE_ENV=development`).

### 2. Use Mock Data in Components

```tsx
// Example: Using mock candidate store in a component
import { useMockCandidateStore, selectMockCandidates, selectMockIsLoading } from '../store/useMockCandidateStore';

function CandidatesPage() {
  const candidates = useMockCandidateStore(selectMockCandidates);
  const isLoading = useMockCandidateStore(selectMockIsLoading);
  const fetchCandidates = useMockCandidateStore(state => state.fetchCandidates);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Candidates ({candidates.length})</h1>
      {candidates.map(candidate => (
        <div key={candidate.id}>
          <h3>{candidate.summary}</h3>
          <p>Experience: {candidate.years_of_experience} years</p>
          <p>Level: {candidate.career_level}</p>
        </div>
      ))}
    </div>
  );
}
```

## 📊 Available Mock Data

### Candidates (5 profiles)
- **John Doe**: Senior Full-Stack Developer (6 years exp)
- **Jane Smith**: AI/ML Engineer (5 years exp) 
- **Mike Johnson**: UX/UI Designer (4 years exp)
- **Sarah Wilson**: DevOps Engineer (7 years exp)
- **Alex Chen**: Junior Frontend Developer (1 year exp)

### Companies (4 companies)
- **TechCorp Solutions**: Medium-sized tech company (150 employees)
- **StartupX**: FinTech startup (25 employees)
- **Global Enterprises Inc**: Large manufacturing company (2500 employees)
- **DesignStudio Pro**: Small creative agency (15 employees)

### Jobs (5 positions)
- Senior Full Stack Developer @ TechCorp
- Frontend Developer @ StartupX
- DevOps Engineer @ Global Enterprises (Remote)
- UX/UI Designer @ DesignStudio Pro
- Python Backend Developer @ TechCorp

### Skills (8 technical skills)
- JavaScript, TypeScript, React, Node.js
- Python, AWS, Docker, PostgreSQL

## 🔧 How It Works

### 1. Mock Data Structure
```
src/store/
├── mockData.ts          # Raw mock data
├── mockHelpers.ts       # Mock services & utilities
└── useMockCandidateStore.ts  # Example mock-enabled store
```

### 2. Environment-Based Switching
The system automatically detects if you're in development mode or if `NEXT_PUBLIC_USE_MOCK_DATA=true` is set, and switches between mock and real API calls.

### 3. Realistic API Simulation
- Network delays (200-300ms)
- Error handling
- Pagination support
- Search/filtering
- Console logging when using mock data

## 🚀 Integrating with Existing Stores

You can modify your existing stores to use mock data:

```typescript
// In your existing store
import { mockServices, USE_MOCK_DATA, logMockUsage } from './mockHelpers';

// Replace API calls like this:
const fetchData = async () => {
  logMockUsage('candidates', 'fetchAll');
  
  const data = USE_MOCK_DATA 
    ? await mockServices.candidates.getAll()
    : await RealAPIService.getAll();
    
  // ... rest of your logic
};
```

## 🎨 Customizing Mock Data

### Adding More Candidates
Edit `src/store/mockData.ts` and add to the `mockCandidates` array:

```typescript
{
  id: "6",
  user_id: "user_6", 
  summary: "Your candidate description...",
  years_of_experience: 3,
  career_level: "mid",
  // ... other fields
}
```

### Adding More Companies
Add to the `mockCompanies` array in `mockData.ts`:

```typescript
{
  id: "5",
  name: "Your Company Name",
  industry: "Your Industry",
  company_size: "medium",
  // ... other fields
}
```

## 🐛 Debugging

When mock data is active, you'll see console logs like:
```
🎭 Using mock data for candidates.fetchCandidates
🎭 Using mock data for companies.getAll
```

## 🔄 Switching Back to Real API

Set `NEXT_PUBLIC_USE_MOCK_DATA=false` or remove the environment variable entirely.

## 📝 Notes

- Mock data includes realistic relationships (candidates have education, skills, etc.)
- All mock API calls return Promises with simulated delays
- Error scenarios are also mocked for testing error states
- The system maintains the same interface as your real API services

---

Happy frontend development! 🎉 