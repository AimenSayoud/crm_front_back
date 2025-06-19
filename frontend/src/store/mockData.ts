// Mock data for frontend development
import type { CandidateProfile, Education, WorkExperience, CandidateSkill, CandidateJobPreference } from '../types/candidate';
import type { Company } from '../types/company';
import type { Job } from '../types/job';
import type { Skill } from '../types/skill';

// Mock Skills Data
export const mockSkills: Skill[] = [
  {
    id: "1",
    name: "JavaScript",
    category: "Programming Languages",
    description: "Modern JavaScript programming language",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "2",
    name: "TypeScript",
    category: "Programming Languages",
    description: "TypeScript with static typing",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "3",
    name: "React",
    category: "Frontend Frameworks",
    description: "React JavaScript library",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "4",
    name: "Node.js",
    category: "Backend Technologies",
    description: "Node.js runtime environment",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "5",
    name: "Python",
    category: "Programming Languages",
    description: "Python programming language",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "6",
    name: "AWS",
    category: "Cloud Technologies",
    description: "Amazon Web Services",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "7",
    name: "Docker",
    category: "DevOps",
    description: "Containerization platform",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "8",
    name: "PostgreSQL",
    category: "Databases",
    description: "Advanced open source database",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  }
];

// Mock Companies Data
export const mockCompanies: Company[] = [
  {
    id: "1",
    name: "TechCorp Solutions",
    industry: "Technology",
    description: "Leading software development company specializing in enterprise solutions",
    company_size: "medium",
    website: "https://techcorp.com",
    email: "contact@techcorp.com",
    phone: "+1-555-0123",
    location: "San Francisco, CA",
    address: "123 Tech Street",
    city: "San Francisco",
    country: "USA",
    postal_code: "94105",
    founded_year: 2015,
    registration_number: "TC123456",
    tax_id: "12-3456789",
    logo_url: "https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=TC",
    cover_image_url: "https://via.placeholder.com/800x200/4F46E5/FFFFFF?text=TechCorp",
    social_media: {
      linkedin: "https://linkedin.com/company/techcorp",
      twitter: "https://twitter.com/techcorp"
    },
    is_verified: true,
    is_premium: true,
    status: "active",
    total_employees: 150,
    active_jobs: 8,
    notes: "Premium client with excellent hiring track record",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z"
  },
  {
    id: "2",
    name: "StartupX",
    industry: "FinTech",
    description: "Innovative fintech startup revolutionizing payments",
    company_size: "startup",
    website: "https://startupx.io",
    email: "hello@startupx.io",
    phone: "+1-555-0124",
    location: "New York, NY",
    address: "456 Innovation Ave",
    city: "New York",
    country: "USA",
    postal_code: "10001",
    founded_year: 2022,
    logo_url: "https://via.placeholder.com/100x100/10B981/FFFFFF?text=SX",
    cover_image_url: "https://via.placeholder.com/800x200/10B981/FFFFFF?text=StartupX",
    social_media: {
      linkedin: "https://linkedin.com/company/startupx",
      twitter: "https://twitter.com/startupx"
    },
    is_verified: true,
    is_premium: false,
    status: "active",
    total_employees: 25,
    active_jobs: 12,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z"
  },
  {
    id: "3",
    name: "Global Enterprises Inc",
    industry: "Manufacturing",
    description: "International manufacturing company with 50+ years of experience",
    company_size: "enterprise",
    website: "https://globalenterprises.com",
    email: "careers@globalenterprises.com",
    phone: "+1-555-0125",
    location: "Chicago, IL",
    address: "789 Industrial Blvd",
    city: "Chicago",
    country: "USA",
    postal_code: "60601",
    founded_year: 1970,
    registration_number: "GE789012",
    tax_id: "98-7654321",
    logo_url: "https://via.placeholder.com/100x100/DC2626/FFFFFF?text=GE",
    cover_image_url: "https://via.placeholder.com/800x200/DC2626/FFFFFF?text=Global+Enterprises",
    is_verified: true,
    is_premium: true,
    status: "active",
    total_employees: 2500,
    active_jobs: 5,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z"
  },
  {
    id: "4",
    name: "DesignStudio Pro",
    industry: "Design & Creative",
    description: "Creative agency specializing in digital design and branding",
    company_size: "small",
    website: "https://designstudiopro.com",
    email: "contact@designstudiopro.com",
    phone: "+1-555-0126",
    location: "Austin, TX",
    address: "321 Creative Lane",
    city: "Austin",
    country: "USA",
    postal_code: "78701",
    founded_year: 2018,
    logo_url: "https://via.placeholder.com/100x100/F59E0B/FFFFFF?text=DS",
    cover_image_url: "https://via.placeholder.com/800x200/F59E0B/FFFFFF?text=DesignStudio",
    social_media: {
      linkedin: "https://linkedin.com/company/designstudiopro",
      instagram: "https://instagram.com/designstudiopro"
    },
    is_verified: false,
    is_premium: false,
    status: "active",
    total_employees: 15,
    active_jobs: 3,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z"
  }
];

// Mock Jobs Data
export const mockJobs: Job[] = [
  {
    id: "1",
    title: "Senior Full Stack Developer",
    description: "We are looking for an experienced Full Stack Developer to join our growing team. You'll work on cutting-edge projects using modern technologies.",
    responsibilities: "• Develop and maintain web applications\n• Collaborate with cross-functional teams\n• Write clean, maintainable code\n• Participate in code reviews\n• Mentor junior developers",
    requirements: "• 5+ years of experience in full stack development\n• Strong knowledge of React and Node.js\n• Experience with PostgreSQL\n• Knowledge of AWS services\n• Excellent communication skills",
    location: "San Francisco, CA",
    is_remote: true,
    is_hybrid: true,
    contract_type: "full_time",
    job_type: "hybrid",
    experience_level: "senior",
    salary_min: 120000,
    salary_max: 180000,
    salary_currency: "USD",
    status: "open",
    posting_date: "2024-01-10T00:00:00Z",
    deadline_date: "2024-03-10T00:00:00Z",
    created_at: "2024-01-10T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    benefits: "Health insurance, 401k, flexible PTO, remote work allowance",
    company_culture: "Collaborative, innovative, work-life balance focused",
    requires_cover_letter: true,
    internal_notes: "High priority position, urgent hiring need",
    is_featured: true,
    view_count: 245,
    application_count: 18,
    company_id: "1",
    posted_by: "hr@techcorp.com",
    assigned_consultant_id: null,
    company_name: "TechCorp Solutions"
  },
  {
    id: "2",
    title: "Frontend Developer",
    description: "Join our innovative team to build beautiful and responsive user interfaces for our fintech platform.",
    responsibilities: "• Build responsive web applications using React\n• Implement pixel-perfect designs\n• Optimize application performance\n• Work closely with designers and backend developers\n• Write comprehensive tests",
    requirements: "• 3+ years of React experience\n• Strong CSS and JavaScript skills\n• Experience with TypeScript\n• Knowledge of modern build tools\n• Understanding of responsive design principles",
    location: "New York, NY",
    is_remote: false,
    is_hybrid: true,
    contract_type: "full_time",
    job_type: "hybrid",
    experience_level: "mid",
    salary_min: 90000,
    salary_max: 130000,
    salary_currency: "USD",
    status: "open",
    posting_date: "2024-01-12T00:00:00Z",
    deadline_date: "2024-02-28T00:00:00Z",
    created_at: "2024-01-12T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    benefits: "Equity package, health insurance, catered meals, learning budget",
    company_culture: "Fast-paced startup environment, innovation-driven",
    requires_cover_letter: false,
    internal_notes: "Great culture fit important, technical skills priority",
    is_featured: false,
    view_count: 89,
    application_count: 12,
    company_id: "2",
    posted_by: "hiring@startupx.io",
    assigned_consultant_id: null,
    company_name: "StartupX"
  },
  {
    id: "3",
    title: "DevOps Engineer",
    description: "We're seeking a DevOps Engineer to help scale our infrastructure and improve our deployment processes.",
    responsibilities: "• Manage cloud infrastructure on AWS\n• Implement CI/CD pipelines\n• Monitor system performance and reliability\n• Automate deployment processes\n• Ensure security best practices",
    requirements: "• 4+ years of DevOps experience\n• Strong knowledge of AWS services\n• Experience with Docker and Kubernetes\n• Proficiency in infrastructure as code (Terraform)\n• Experience with monitoring tools",
    location: "Remote",
    is_remote: true,
    is_hybrid: false,
    contract_type: "full_time",
    job_type: "remote",
    experience_level: "senior",
    salary_min: 110000,
    salary_max: 160000,
    salary_currency: "USD",
    status: "open",
    posting_date: "2024-01-08T00:00:00Z",
    deadline_date: "2024-03-01T00:00:00Z",
    created_at: "2024-01-08T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    benefits: "Comprehensive health coverage, retirement plan, professional development budget",
    company_culture: "Established company culture, process-oriented, collaborative",
    requires_cover_letter: true,
    internal_notes: "Enterprise client, thorough screening process required",
    is_featured: true,
    view_count: 156,
    application_count: 8,
    company_id: "3",
    posted_by: "talent@globalenterprises.com",
    assigned_consultant_id: null,
    company_name: "Global Enterprises Inc"
  },
  {
    id: "4",
    title: "UX/UI Designer",
    description: "Creative UX/UI Designer needed to craft exceptional user experiences for our digital products.",
    responsibilities: "• Create user-centered design solutions\n• Develop wireframes and prototypes\n• Conduct user research and testing\n• Collaborate with developers and stakeholders\n• Maintain design systems and guidelines",
    requirements: "• 3+ years of UX/UI design experience\n• Proficiency in Figma and Adobe Creative Suite\n• Strong portfolio demonstrating design thinking\n• Understanding of design systems\n• Experience with user research methods",
    location: "Austin, TX",
    is_remote: false,
    is_hybrid: true,
    contract_type: "full_time",
    job_type: "hybrid",
    experience_level: "mid",
    salary_min: 70000,
    salary_max: 95000,
    salary_currency: "USD",
    status: "open",
    posting_date: "2024-01-14T00:00:00Z",
    deadline_date: "2024-02-14T00:00:00Z",
    created_at: "2024-01-14T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    benefits: "Creative freedom, flexible hours, health insurance, design conference budget",
    company_culture: "Creative, collaborative, design-focused environment",
    requires_cover_letter: true,
    internal_notes: "Portfolio review essential, creative culture fit important",
    is_featured: false,
    view_count: 67,
    application_count: 5,
    company_id: "4",
    posted_by: "studio@designstudiopro.com",
    assigned_consultant_id: null,
    company_name: "DesignStudio Pro"
  },
  {
    id: "5",
    title: "Python Backend Developer",
    description: "Join our backend team to build scalable APIs and microservices using Python and modern frameworks.",
    responsibilities: "• Develop and maintain REST APIs\n• Design database schemas\n• Implement microservices architecture\n• Write comprehensive tests\n• Optimize application performance",
    requirements: "• 4+ years of Python development experience\n• Strong knowledge of Django or FastAPI\n• Experience with PostgreSQL\n• Understanding of microservices architecture\n• Knowledge of API design principles",
    location: "San Francisco, CA",
    is_remote: true,
    is_hybrid: true,
    contract_type: "full_time",
    job_type: "hybrid",
    experience_level: "mid",
    salary_min: 100000,
    salary_max: 140000,
    salary_currency: "USD",
    status: "open",
    posting_date: "2024-01-11T00:00:00Z",
    deadline_date: "2024-03-15T00:00:00Z",
    created_at: "2024-01-11T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    benefits: "Stock options, health insurance, flexible PTO, learning stipend",
    company_culture: "Engineering excellence, continuous learning, remote-first",
    requires_cover_letter: false,
    internal_notes: "Backend focus, Python expertise crucial, good growth opportunity",
    is_featured: true,
    view_count: 134,
    application_count: 14,
    company_id: "1",
    posted_by: "engineering@techcorp.com",
    assigned_consultant_id: null,
    company_name: "TechCorp Solutions"
  }
];

// Mock Candidate Education Data
const mockEducation: Education[] = [
  {
    id: "1",
    candidate_id: "1",
    institution: "Stanford University",
    degree: "Bachelor of Science",
    field_of_study: "Computer Science",
    start_date: "2018-09-01",
    end_date: "2022-06-15",
    grade: "3.8 GPA",
    description: "Focused on software engineering and algorithms. Graduated magna cum laude.",
    is_current: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "2",
    candidate_id: "2",
    institution: "MIT",
    degree: "Master of Science",
    field_of_study: "Computer Science",
    start_date: "2020-09-01",
    end_date: "2022-06-15",
    grade: "3.9 GPA",
    description: "Specialized in Machine Learning and AI. Thesis on neural networks.",
    is_current: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  }
];

// Mock Candidate Work Experience Data
const mockWorkExperience: WorkExperience[] = [
  {
    id: "1",
    candidate_id: "1",
    company_name: "Google",
    position: "Software Engineer",
    start_date: "2022-07-01",
    end_date: "2024-01-01",
    location: "Mountain View, CA",
    description: "Developed and maintained large-scale web applications. Led a team of 3 junior developers on key projects.",
    is_current: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "2",
    candidate_id: "1",
    company_name: "Facebook",
    position: "Senior Software Engineer",
    start_date: "2024-01-15",
    location: "Menlo Park, CA",
    description: "Leading frontend development for the main Facebook platform. Working on performance optimization and new features.",
    is_current: true,
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z"
  },
  {
    id: "3",
    candidate_id: "2",
    company_name: "OpenAI",
    position: "ML Engineer",
    start_date: "2022-08-01",
    location: "San Francisco, CA",
    description: "Working on large language models and AI safety. Contributing to GPT model development and training.",
    is_current: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  }
];

// Mock Candidate Skills Data
const mockCandidateSkills: CandidateSkill[] = [
  {
    candidate_id: "1",
    skill_id: "1",
    skill: mockSkills[0], // JavaScript
    proficiency_level: 5,
    years_of_experience: 6,
    is_primary: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    candidate_id: "1",
    skill_id: "2",
    skill: mockSkills[1], // TypeScript
    proficiency_level: 4,
    years_of_experience: 4,
    is_primary: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    candidate_id: "1",
    skill_id: "3",
    skill: mockSkills[2], // React
    proficiency_level: 5,
    years_of_experience: 5,
    is_primary: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    candidate_id: "2",
    skill_id: "5",
    skill: mockSkills[4], // Python
    proficiency_level: 5,
    years_of_experience: 7,
    is_primary: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    candidate_id: "2",
    skill_id: "6",
    skill: mockSkills[5], // AWS
    proficiency_level: 4,
    years_of_experience: 3,
    is_primary: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  }
];

// Mock Candidate Job Preferences Data
const mockJobPreferences: CandidateJobPreference[] = [
  {
    id: "1",
    candidate_id: "1",
    desired_job_types: ["full_time", "contract"],
    desired_locations: ["San Francisco, CA", "New York, NY", "Remote"],
    remote_preference: "hybrid",
    relocation_willingness: true,
    desired_salary_min: 150000,
    desired_salary_max: 200000,
    desired_benefits: ["Health Insurance", "401k", "Flexible PTO", "Remote Work"],
    availability_date: "2024-02-01",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "2",
    candidate_id: "2",
    desired_job_types: ["full_time"],
    desired_locations: ["San Francisco, CA", "Remote"],
    remote_preference: "remote",
    relocation_willingness: false,
    desired_salary_min: 180000,
    desired_salary_max: 250000,
    desired_benefits: ["Health Insurance", "Stock Options", "Learning Budget"],
    availability_date: "2024-03-01",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  }
];

// Mock Candidates Data
export const mockCandidates: CandidateProfile[] = [
  {
    id: "1",
    user_id: "user_1",
    summary: "Experienced full-stack developer with 6+ years of experience building scalable web applications. Passionate about clean code, performance optimization, and mentoring junior developers. Currently working at Facebook as a Senior Software Engineer.",
    years_of_experience: 6,
    linkedin_url: "https://linkedin.com/in/johndoe",
    github_url: "https://github.com/johndoe",
    portfolio_url: "https://johndoe.dev",
    resume_url: "https://johndoe.dev/resume.pdf",
    career_level: "senior",
    profile_completion: 95,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z"
  },
  {
    id: "2",
    user_id: "user_2",
    summary: "AI/ML Engineer with expertise in deep learning and natural language processing. Currently working at OpenAI on large language models. MIT graduate with strong research background and industry experience.",
    years_of_experience: 5,
    linkedin_url: "https://linkedin.com/in/janesmith",
    github_url: "https://github.com/janesmith",
    portfolio_url: "https://janesmith.ai",
    resume_url: "https://janesmith.ai/resume.pdf",
    career_level: "senior",
    profile_completion: 88,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-12T00:00:00Z"
  },
  {
    id: "3",
    user_id: "user_3",
    summary: "Creative UX/UI Designer with 4 years of experience designing user-centered digital products. Skilled in user research, prototyping, and design systems. Passionate about accessibility and inclusive design.",
    years_of_experience: 4,
    linkedin_url: "https://linkedin.com/in/mikejohnson",
    portfolio_url: "https://mikejohnson.design",
    resume_url: "https://mikejohnson.design/resume.pdf",
    career_level: "mid",
    profile_completion: 78,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-10T00:00:00Z"
  },
  {
    id: "4",
    user_id: "user_4",
    summary: "DevOps Engineer with 7+ years of experience in cloud infrastructure, CI/CD, and automation. Expert in AWS, Docker, and Kubernetes. Strong background in security and scalability best practices.",
    years_of_experience: 7,
    linkedin_url: "https://linkedin.com/in/sarahwilson",
    github_url: "https://github.com/sarahwilson",
    resume_url: "https://sarahwilson.dev/resume.pdf",
    career_level: "senior",
    profile_completion: 92,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-08T00:00:00Z"
  },
  {
    id: "5",
    user_id: "user_5",
    summary: "Junior Frontend Developer passionate about creating beautiful and accessible web experiences. Recent bootcamp graduate with strong foundation in React, JavaScript, and modern CSS. Eager to learn and grow in a supportive team environment.",
    years_of_experience: 1,
    linkedin_url: "https://linkedin.com/in/alexchen",
    github_url: "https://github.com/alexchen",
    portfolio_url: "https://alexchen.dev",
    career_level: "entry",
    profile_completion: 65,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-05T00:00:00Z"
  }
];

// Combined mock data export
export const mockData = {
  skills: mockSkills,
  companies: mockCompanies,
  jobs: mockJobs,
  candidates: mockCandidates,
  education: mockEducation,
  workExperience: mockWorkExperience,
  candidateSkills: mockCandidateSkills,
  jobPreferences: mockJobPreferences,
  
  // Helper functions to get related data
  getCandidateEducation: (candidateId: string) => 
    mockEducation.filter(edu => edu.candidate_id === candidateId),
  
  getCandidateExperience: (candidateId: string) => 
    mockWorkExperience.filter(exp => exp.candidate_id === candidateId),
  
  getCandidateSkills: (candidateId: string) => 
    mockCandidateSkills.filter(skill => skill.candidate_id === candidateId),
  
  getCandidatePreferences: (candidateId: string) => 
    mockJobPreferences.find(pref => pref.candidate_id === candidateId),
  
  getCompanyJobs: (companyId: string) => 
    mockJobs.filter(job => job.company_id === companyId),
  
  getJobsBySkill: (skillId: string) => 
    mockJobs.filter(job => 
      job.title.toLowerCase().includes(mockSkills.find(s => s.id === skillId)?.name.toLowerCase() || '')
    )
};