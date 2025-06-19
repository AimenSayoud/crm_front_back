// Mock data helpers for development
import { mockData, mockCandidates, mockCompanies, mockJobs, mockSkills } from './mockData';
import type { CandidateProfile } from '../types/candidate';
import type { Company, PaginatedCompaniesResponse } from '../types/company';
import type { Job, PaginatedJobsResponse } from '../types/job';
import type { Skill, SkillListResponse } from '../types/skill';
import { Candidate, Job, Skill } from '../types';
import { AuthenticationError } from '../services/api/auth-service';

// Environment flag to enable/disable mock data
export const USE_MOCK_DATA = false; // Disabled - using only real MongoDB data from backend API

// Mock data
export const mockCandidates: Candidate[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    address: '123 Main St, New York, NY 10001',
    dateOfBirth: '1990-05-15',
    experience: 'Senior Full-Stack Developer with 8+ years of experience in React, Node.js, and cloud technologies.',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker'],
    education: 'Bachelor of Science in Computer Science - MIT (2008-2012)',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    profilePicture: '/api/placeholder/150/150'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0124',
    address: '456 Oak Ave, San Francisco, CA 94102',
    dateOfBirth: '1992-03-22',
    experience: 'AI/ML Engineer specializing in deep learning and natural language processing.',
    skills: ['Python', 'TensorFlow', 'Machine Learning', 'Data Science'],
    education: 'Master of Science in Artificial Intelligence - Stanford University (2014-2016)',
    status: 'active',
    createdAt: '2024-01-16T09:30:00Z',
    updatedAt: '2024-01-16T09:30:00Z',
    profilePicture: '/api/placeholder/150/150'
  },
  {
    id: '3',
    firstName: 'Alice',
    lastName: 'Johnson',
    email: 'alice.johnson@example.com',
    phone: '+1-555-0125',
    address: '789 Pine St, Austin, TX 78701',
    dateOfBirth: '1994-07-10',
    experience: 'Creative UX/UI Designer with a passion for user-centered design.',
    skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Prototyping'],
    education: 'Bachelor of Fine Arts in Design - RISD (2012-2016)',
    status: 'active',
    createdAt: '2024-01-17T14:20:00Z',
    updatedAt: '2024-01-17T14:20:00Z',
    profilePicture: '/api/placeholder/150/150'
  },
  {
    id: '4',
    firstName: 'Bob',
    lastName: 'Wilson',
    email: 'bob.wilson@example.com',
    phone: '+1-555-0126',
    address: '321 Elm St, Seattle, WA 98101',
    dateOfBirth: '1988-11-30',
    experience: 'DevOps Engineer with expertise in cloud infrastructure and CI/CD pipelines.',
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
    education: 'Bachelor of Science in Computer Engineering - University of Washington (2006-2010)',
    status: 'active',
    createdAt: '2024-01-18T11:45:00Z',
    updatedAt: '2024-01-18T11:45:00Z',
    profilePicture: '/api/placeholder/150/150'
  },
  {
    id: '5',
    firstName: 'Charlie',
    lastName: 'Brown',
    email: 'charlie.brown@example.com',
    phone: '+1-555-0127',
    address: '654 Maple Ave, Boston, MA 02101',
    dateOfBirth: '1996-09-05',
    experience: 'Junior Frontend Developer eager to learn and grow in web development.',
    skills: ['JavaScript', 'React', 'CSS', 'HTML'],
    education: 'Coding Bootcamp Graduate - General Assembly (2023)',
    status: 'active',
    createdAt: '2024-01-19T16:10:00Z',
    updatedAt: '2024-01-19T16:10:00Z',
    profilePicture: '/api/placeholder/150/150'
  }
];

export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'TechCorp Solutions',
    email: 'contact@techcorp.com',
    phone: '+1-555-0200',
    address: '1000 Tech Ave, Silicon Valley, CA 94000',
    website: 'https://techcorp.com',
    industry: 'Technology',
    size: '150 employees',
    description: 'Leading technology company specializing in innovative software solutions.',
    founded: '2010',
    status: 'active',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-10T08:00:00Z',
    logo: '/api/placeholder/100/100'
  },
  {
    id: '2',
    name: 'StartupX',
    email: 'hello@startupx.com',
    phone: '+1-555-0201',
    address: '25 Innovation Blvd, Austin, TX 78701',
    website: 'https://startupx.com',
    industry: 'Fintech',
    size: '25 employees',
    description: 'Innovative fintech startup revolutionizing digital payments.',
    founded: '2020',
    status: 'active',
    createdAt: '2024-01-11T10:30:00Z',
    updatedAt: '2024-01-11T10:30:00Z',
    logo: '/api/placeholder/100/100'
  },
  {
    id: '3',
    name: 'Global Enterprises',
    email: 'hr@globalenterprises.com',
    phone: '+1-555-0202',
    address: '500 Corporate Plaza, New York, NY 10001',
    website: 'https://globalenterprises.com',
    industry: 'Consulting',
    size: '2500 employees',
    description: 'Multinational consulting firm providing strategic business solutions.',
    founded: '1995',
    status: 'active',
    createdAt: '2024-01-12T09:15:00Z',
    updatedAt: '2024-01-12T09:15:00Z',
    logo: '/api/placeholder/100/100'
  },
  {
    id: '4',
    name: 'DesignStudio Pro',
    email: 'team@designstudiopro.com',
    phone: '+1-555-0203',
    address: '75 Creative Way, Los Angeles, CA 90210',
    website: 'https://designstudiopro.com',
    industry: 'Design',
    size: '15 employees',
    description: 'Creative design studio specializing in branding and digital experiences.',
    founded: '2018',
    status: 'active',
    createdAt: '2024-01-13T15:45:00Z',
    updatedAt: '2024-01-13T15:45:00Z',
    logo: '/api/placeholder/100/100'
  }
];

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Full-Stack Developer',
    company: 'TechCorp Solutions',
    companyId: '1',
    location: 'San Francisco, CA',
    type: 'full-time',
    salary: '$150,000 - $180,000',
    description: 'We are looking for a Senior Full-Stack Developer to join our innovative team.',
    requirements: ['React', 'Node.js', 'PostgreSQL', '5+ years experience'],
    status: 'active',
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-01-20T09:00:00Z'
  },
  {
    id: '2',
    title: 'AI/ML Engineer',
    company: 'StartupX',
    companyId: '2',
    location: 'Austin, TX',
    type: 'full-time',
    salary: '$130,000 - $160,000',
    description: 'Join our AI team to build next-generation machine learning solutions.',
    requirements: ['Python', 'TensorFlow', 'PyTorch', '3+ years ML experience'],
    status: 'active',
    createdAt: '2024-01-21T10:30:00Z',
    updatedAt: '2024-01-21T10:30:00Z'
  },
  {
    id: '3',
    title: 'UX/UI Designer',
    company: 'DesignStudio Pro',
    companyId: '4',
    location: 'Los Angeles, CA',
    type: 'full-time',
    salary: '$90,000 - $110,000',
    description: 'Creative UX/UI Designer to shape user experiences for our clients.',
    requirements: ['Figma', 'Adobe Creative Suite', 'User Research', '3+ years experience'],
    status: 'active',
    createdAt: '2024-01-22T14:15:00Z',
    updatedAt: '2024-01-22T14:15:00Z'
  },
  {
    id: '4',
    title: 'DevOps Engineer',
    company: 'Global Enterprises',
    companyId: '3',
    location: 'New York, NY',
    type: 'full-time',
    salary: '$140,000 - $170,000',
    description: 'DevOps Engineer to manage our cloud infrastructure and deployment pipelines.',
    requirements: ['AWS', 'Docker', 'Kubernetes', 'Terraform', '4+ years experience'],
    status: 'active',
    createdAt: '2024-01-23T11:20:00Z',
    updatedAt: '2024-01-23T11:20:00Z'
  },
  {
    id: '5',
    title: 'Frontend Developer',
    company: 'TechCorp Solutions',
    companyId: '1',
    location: 'Remote',
    type: 'full-time',
    salary: '$70,000 - $90,000',
    description: 'Entry-level Frontend Developer position for recent graduates.',
    requirements: ['JavaScript', 'React', 'CSS', 'HTML', '0-2 years experience'],
    status: 'active',
    createdAt: '2024-01-24T13:45:00Z',
    updatedAt: '2024-01-24T13:45:00Z'
  }
];

export const mockSkills: Skill[] = [
  { id: '1', name: 'JavaScript', category: 'Programming' },
  { id: '2', name: 'React', category: 'Framework' },
  { id: '3', name: 'Node.js', category: 'Backend' },
  { id: '4', name: 'Python', category: 'Programming' },
  { id: '5', name: 'AWS', category: 'Cloud' },
  { id: '6', name: 'Docker', category: 'DevOps' },
  { id: '7', name: 'UI/UX Design', category: 'Design' },
  { id: '8', name: 'Machine Learning', category: 'AI/ML' }
];

// Mock authentication data
export const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'changethis',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'super_admin'
  },
  {
    id: '2',
    email: 'superadmin@recruitmentplus.example',
    password: 'admin123',
    firstName: 'Jean',
    lastName: 'Lefebvre',
    role: 'super_admin'
  },
  {
    id: '3',
    email: 'admin@recruitmentplus.example',
    password: 'admin123',
    firstName: 'Alex',
    lastName: 'Dubois',
    role: 'admin'
  },
  {
    id: '4',
    email: 'consultant1@recruitmentplus.example',
    password: 'consultant123',
    firstName: 'Sophie',
    lastName: 'Bernard',
    role: 'consultant'
  },
  {
    id: '5',
    email: 'test@demo.com',
    password: 'demo123',
    firstName: 'Demo',
    lastName: 'User',
    role: 'consultant'
  }
];

/* 
🎭 MOCK LOGIN TEST CREDENTIALS:

✅ VALID CREDENTIALS:
- admin@example.com / changethis (Super Admin)
- admin@recruitmentplus.example / admin123 (Admin)
- consultant1@recruitmentplus.example / consultant123 (Consultant)  
- test@demo.com / demo123 (Demo User)

❌ ERROR TESTING:
- any-email@test.com / wrong-password → Invalid credentials
- nonexistent@test.com / any-password → User not found
- disabled@user.com / any-password → Account disabled
- ratelimit@test.com / any-password → Rate limited
- network@error.com / any-password → Network error
- server@error.com / any-password → Server error
*/

// Mock API responses with pagination
export const createPaginatedResponse = <T>(items: T[], page = 1, pageSize = 20) => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);
  
  return {
    total: items.length,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(items.length / pageSize),
    items: paginatedItems
  };
};

// Mock services
export const mockServices = {
  // Candidates
  candidates: {
    getAll: (params?: any): Promise<CandidateProfile[]> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          let candidates = [...mockCandidates];
          
          // Simple filtering
          if (params?.search) {
            const search = params.search.toLowerCase();
            candidates = candidates.filter(c => 
              c.summary?.toLowerCase().includes(search) ||
              c.career_level?.toLowerCase().includes(search)
            );
          }
          
          if (params?.career_level) {
            candidates = candidates.filter(c => c.career_level === params.career_level);
          }
          
          resolve(candidates);
        }, 300); // Simulate network delay
      });
    },
    
    getById: (id: string): Promise<CandidateProfile> => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const candidate = mockCandidates.find(c => c.id === id);
          if (candidate) {
            resolve(candidate);
          } else {
            reject(new Error('Candidate not found'));
          }
        }, 200);
      });
    },
    
    getEducation: (candidateId: string) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockData.getCandidateEducation(candidateId));
        }, 200);
      });
    },
    
    getExperience: (candidateId: string) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockData.getCandidateExperience(candidateId));
        }, 200);
      });
    },
    
    getSkills: (candidateId: string) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockData.getCandidateSkills(candidateId));
        }, 200);
      });
    }
  },
  
  // Companies
  companies: {
    getAll: (params?: any): Promise<PaginatedCompaniesResponse> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          let companies = [...mockCompanies];
          
          // Simple filtering
          if (params?.search) {
            const search = params.search.toLowerCase();
            companies = companies.filter(c => 
              c.name.toLowerCase().includes(search) ||
              c.industry.toLowerCase().includes(search) ||
              c.location?.toLowerCase().includes(search)
            );
          }
          
          if (params?.industry) {
            companies = companies.filter(c => c.industry === params.industry);
          }
          
          if (params?.company_size) {
            companies = companies.filter(c => c.company_size === params.company_size);
          }
          
          const paginated = createPaginatedResponse(companies, params?.page, params?.page_size);
          
          resolve({
            companies: paginated.items,
            total: paginated.total,
            page: paginated.page,
            page_size: paginated.page_size,
            total_pages: paginated.total_pages
          });
        }, 300);
      });
    },
    
    getById: (id: string): Promise<Company> => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const company = mockCompanies.find(c => c.id === id);
          if (company) {
            resolve(company);
          } else {
            reject(new Error('Company not found'));
          }
        }, 200);
      });
    }
  },
  
  // Jobs
  jobs: {
    getAll: (params?: any): Promise<PaginatedJobsResponse> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          let jobs = [...mockJobs];
          
          // Simple filtering
          if (params?.q) {
            const search = params.q.toLowerCase();
            jobs = jobs.filter(j => 
              j.title.toLowerCase().includes(search) ||
              j.description.toLowerCase().includes(search) ||
              j.company_name?.toLowerCase().includes(search)
            );
          }
          
          if (params?.location) {
            jobs = jobs.filter(j => j.location.toLowerCase().includes(params.location.toLowerCase()));
          }
          
          if (params?.is_remote !== undefined) {
            jobs = jobs.filter(j => j.is_remote === params.is_remote);
          }
          
          if (params?.experience_level) {
            jobs = jobs.filter(j => j.experience_level === params.experience_level);
          }
          
          if (params?.contract_type) {
            jobs = jobs.filter(j => j.contract_type === params.contract_type);
          }
          
          const paginated = createPaginatedResponse(jobs, params?.page, params?.page_size);
          
          resolve({
            jobs: paginated.items,
            total: paginated.total,
            page: paginated.page,
            page_size: paginated.page_size,
            total_pages: paginated.total_pages
          });
        }, 300);
      });
    },
    
    getById: (id: string): Promise<Job> => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const job = mockJobs.find(j => j.id === id);
          if (job) {
            resolve(job);
          } else {
            reject(new Error('Job not found'));
          }
        }, 200);
      });
    },
    
    getByCompany: (companyId: string): Promise<Job[]> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockData.getCompanyJobs(companyId));
        }, 200);
      });
    }
  },
  
  // Skills
  skills: {
    getAll: (params?: any): Promise<SkillListResponse> => {
      return new Promise((resolve) => {
        setTimeout(() => {
          let skills = [...mockSkills];
          
          // Simple filtering
          if (params?.search) {
            const search = params.search.toLowerCase();
            skills = skills.filter(s => 
              s.name.toLowerCase().includes(search) ||
              s.category?.toLowerCase().includes(search)
            );
          }
          
          if (params?.category) {
            skills = skills.filter(s => s.category === params.category);
          }
          
          const paginated = createPaginatedResponse(skills, params?.page, params?.page_size);
          
          resolve({
            skills: paginated.items,
            total: paginated.total,
            page: paginated.page,
            page_size: paginated.page_size,
            total_pages: paginated.total_pages
          });
        }, 200);
      });
    }
  }
};

// Utility function to wrap any service call with mock data
export const withMockData = <T extends (...args: any[]) => Promise<any>>(
  realServiceCall: T,
  mockServiceCall: T
): T => {
  return (USE_MOCK_DATA ? mockServiceCall : realServiceCall) as T;
};

// Helper to log when using mock data
export const logMockUsage = (service: string, method: string) => {
  if (USE_MOCK_DATA) {
    console.log(`🎭 Using mock data for ${service}.${method}`);
  }
};

// Mock authentication service with comprehensive error handling
export const mockAuthService = {
  login: async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log('🎭 Mock login attempt:', email);
    
    // Simulate different error scenarios
    if (email === 'network@error.com') {
      throw new Error('Network Error');
    }
    
    if (email === 'server@error.com') {
      throw new AuthenticationError('Internal server error', 'server_error');
    }
    
    if (email === 'disabled@user.com') {
      throw new AuthenticationError('Your account has been deactivated. Please contact support.', 'account_disabled');
    }
    
    if (email === 'ratelimit@test.com') {
      throw new AuthenticationError('Too many login attempts. Please try again later.', 'rate_limited');
    }
    
    // Check if user exists
    const userExists = mockUsers.find(u => u.email === email);
    if (!userExists) {
      throw new AuthenticationError('This email is not registered in our system', 'user_not_found');
    }
    
    // Check password
    const user = mockUsers.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new AuthenticationError('The email or password you entered is incorrect. Please try again.', 'invalid_credentials');
    }
    
    console.log('🎭 Mock login successful:', user.email, 'Role:', user.role);
    
    return {
      user: {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        role: user.role,
        office_id: null
      },
      tokens: {
        access_token: 'mock_access_token_' + user.id,
        refresh_token: 'mock_refresh_token_' + user.id,
        expires_in: 3600
      }
    };
  }
};

// Helper functions for mock data with simulated API delays
export const fetchMockCandidates = async (page: number = 1, limit: number = 10) => {
  if (!USE_MOCK_DATA) return null;
  
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log('🎭 Using mock data for candidates');
  
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    candidates: mockCandidates.slice(start, end),
    total: mockCandidates.length,
    page,
    limit,
    totalPages: Math.ceil(mockCandidates.length / limit)
  };
};

export const fetchMockCompanies = async (page: number = 1, limit: number = 10) => {
  if (!USE_MOCK_DATA) return null;
  
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('🎭 Using mock data for companies');
  
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    companies: mockCompanies.slice(start, end),
    total: mockCompanies.length,
    page,
    limit,
    totalPages: Math.ceil(mockCompanies.length / limit)
  };
};

export const fetchMockJobs = async (page: number = 1, limit: number = 10) => {
  if (!USE_MOCK_DATA) return null;
  
  await new Promise(resolve => setTimeout(resolve, 250));
  console.log('🎭 Using mock data for jobs');
  
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return {
    jobs: mockJobs.slice(start, end),
    total: mockJobs.length,
    page,
    limit,
    totalPages: Math.ceil(mockJobs.length / limit)
  };
};

export const fetchMockSkills = async () => {
  if (!USE_MOCK_DATA) return null;
  
  await new Promise(resolve => setTimeout(resolve, 150));
  console.log('🎭 Using mock data for skills');
  
  return mockSkills;
};

// Helper to get candidates by skill
export const getCandidatesBySkill = (skillName: string) => {
  return mockCandidates.filter(candidate => 
    candidate.skills.some(skill => 
      skill.toLowerCase().includes(skillName.toLowerCase())
    )
  );
};

// Helper to get jobs by company
export const getJobsByCompany = (companyId: string) => {
  return mockJobs.filter(job => job.companyId === companyId);
}; 