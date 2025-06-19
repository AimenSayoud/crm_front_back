const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './.env' });

const { User, CandidateProfile, Company, Skill, Job } = require('../src/models/mongodb');

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI_ATLAS || process.env.MONGO_URI || 'mongodb://localhost:27017/recruitment_db';
        const dbName = process.env.DB_NAME || 'recruitment_db';
        await mongoose.connect(mongoUri, { dbName: dbName });
        console.log('MongoDB connected successfully');
        console.log('Using database:', dbName);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const clearDatabase = async () => {
    try {
        await User.deleteMany({});
        await CandidateProfile.deleteMany({});
        await Company.deleteMany({});
        await Skill.deleteMany({});
        await Job.deleteMany({});
        console.log('Database cleared successfully');
    } catch (error) {
        console.error('Error clearing database:', error);
    }
};

const seedSkills = async () => {
    const skills = [
        // Programming Languages
        { name: 'javascript', category: 'programming_language', description: 'JavaScript programming language' },
        { name: 'python', category: 'programming_language', description: 'Python programming language' },
        { name: 'java', category: 'programming_language', description: 'Java programming language' },
        { name: 'typescript', category: 'programming_language', description: 'TypeScript programming language' },
        { name: 'c#', category: 'programming_language', description: 'C# programming language' },
        { name: 'php', category: 'programming_language', description: 'PHP programming language' },
        { name: 'ruby', category: 'programming_language', description: 'Ruby programming language' },
        { name: 'go', category: 'programming_language', description: 'Go programming language' },
        { name: 'rust', category: 'programming_language', description: 'Rust programming language' },
        { name: 'swift', category: 'programming_language', description: 'Swift programming language' },
        
        // Frameworks
        { name: 'react', category: 'framework', description: 'React JavaScript library' },
        { name: 'angular', category: 'framework', description: 'Angular framework' },
        { name: 'vue.js', category: 'framework', description: 'Vue.js framework' },
        { name: 'node.js', category: 'framework', description: 'Node.js runtime' },
        { name: 'express.js', category: 'framework', description: 'Express.js framework' },
        { name: 'django', category: 'framework', description: 'Django Python framework' },
        { name: 'flask', category: 'framework', description: 'Flask Python framework' },
        { name: 'spring', category: 'framework', description: 'Spring Java framework' },
        { name: '.net', category: 'framework', description: '.NET framework' },
        { name: 'rails', category: 'framework', description: 'Ruby on Rails framework' },
        { name: 'laravel', category: 'framework', description: 'Laravel PHP framework' },
        
        // Design & UI Tools
        { name: 'figma', category: 'design', description: 'Figma design tool' },
        { name: 'adobe creative suite', category: 'design', description: 'Adobe Creative Suite' },
        { name: 'sketch', category: 'design', description: 'Sketch design tool' },
        
        // Databases
        { name: 'mongodb', category: 'database', description: 'MongoDB NoSQL database' },
        { name: 'postgresql', category: 'database', description: 'PostgreSQL relational database' },
        { name: 'mysql', category: 'database', description: 'MySQL relational database' },
        { name: 'redis', category: 'database', description: 'Redis in-memory database' },
        { name: 'elasticsearch', category: 'database', description: 'Elasticsearch search engine' },
        
        // Cloud & DevOps
        { name: 'aws', category: 'cloud', description: 'Amazon Web Services' },
        { name: 'azure', category: 'cloud', description: 'Microsoft Azure' },
        { name: 'gcp', category: 'cloud', description: 'Google Cloud Platform' },
        { name: 'docker', category: 'devops', description: 'Docker containerization' },
        { name: 'kubernetes', category: 'devops', description: 'Kubernetes orchestration' },
        { name: 'jenkins', category: 'devops', description: 'Jenkins CI/CD' },
        { name: 'git', category: 'tool', description: 'Git version control' },
        
        // Soft Skills
        { name: 'leadership', category: 'soft_skill', description: 'Leadership skills', is_technical: false },
        { name: 'communication', category: 'soft_skill', description: 'Communication skills', is_technical: false },
        { name: 'teamwork', category: 'soft_skill', description: 'Teamwork and collaboration', is_technical: false },
        { name: 'problem solving', category: 'soft_skill', description: 'Problem solving skills', is_technical: false },
        { name: 'project management', category: 'soft_skill', description: 'Project management skills', is_technical: false }
    ];

    try {
        const createdSkills = await Skill.insertMany(skills);
        console.log(`Created ${createdSkills.length} skills`);
        return createdSkills;
    } catch (error) {
        console.error('Error seeding skills:', error);
        return [];
    }
};

const seedUsers = async () => {
    const users = [
        // Candidates - Diverse set of profiles
        {
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            email: 'john.doe@example.com',
            password: 'password123',
            role: 'candidate',
            is_verified: true
        },
        {
            firstName: 'Jane',
            lastName: 'Smith',
            username: 'janesmith',
            email: 'jane.smith@example.com',
            password: 'password123',
            role: 'candidate',
            is_verified: true
        },
        {
            firstName: 'Mike',
            lastName: 'Johnson',
            username: 'mikejohnson',
            email: 'mike.johnson@example.com',
            password: 'password123',
            role: 'candidate',
            is_verified: true
        },
        {
            firstName: 'Sarah',
            lastName: 'Chen',
            username: 'sarahchen',
            email: 'sarah.chen@example.com',
            password: 'password123',
            role: 'candidate',
            is_verified: true
        },
        {
            firstName: 'David',
            lastName: 'Rodriguez',
            username: 'davidrodriguez',
            email: 'david.rodriguez@example.com',
            password: 'password123',
            role: 'candidate',
            is_verified: true
        },
        {
            firstName: 'Emily',
            lastName: 'Thompson',
            username: 'emilythompson',
            email: 'emily.thompson@example.com',
            password: 'password123',
            role: 'candidate',
            is_verified: true
        },
        {
            firstName: 'Alex',
            lastName: 'Kim',
            username: 'alexkim',
            email: 'alex.kim@example.com',
            password: 'password123',
            role: 'candidate',
            is_verified: true
        },
        {
            firstName: 'Maria',
            lastName: 'Garcia',
            username: 'mariagarcia',
            email: 'maria.garcia@example.com',
            password: 'password123',
            role: 'candidate',
            is_verified: true
        },
        {
            firstName: 'Robert',
            lastName: 'Wilson',
            username: 'robertwilson',
            email: 'robert.wilson@example.com',
            password: 'password123',
            role: 'candidate',
            is_verified: true
        },
        // Employers
        {
            firstName: 'Alice',
            lastName: 'Williams',
            username: 'alicewilliams',
            email: 'alice.williams@techcorp.com',
            password: 'password123',
            role: 'employer',
            is_verified: true
        },
        {
            firstName: 'David',
            lastName: 'Brown',
            username: 'davidbrown',
            email: 'david.brown@startupinc.com',
            password: 'password123',
            role: 'employer',
            is_verified: true
        },
        // Admin
        {
            firstName: 'Admin',
            lastName: 'User',
            username: 'admin',
            email: 'admin@recruitment.com',
            password: 'admin123',
            role: 'admin',
            is_verified: true
        },
        // Superadmin
        {
            firstName: 'Super',
            lastName: 'Admin',
            username: 'superadmin',
            email: 'superadmin@recruitment.com',
            password: 'superadmin123',
            role: 'superadmin',
            is_verified: true
        },
        // Team Members - HR Staff (employee role)
        {
            firstName: 'Jennifer',
            lastName: 'Martinez',
            username: 'jennifermartinez',
            email: 'jennifer.martinez@recruitment.com',
            password: 'password123',
            role: 'employee',
            is_verified: true
        },
        {
            firstName: 'Michael',
            lastName: 'Johnson',
            username: 'michaeljohnson',
            email: 'michael.johnson@recruitment.com',
            password: 'password123',
            role: 'employee',
            is_verified: true
        },
        {
            firstName: 'Sarah',
            lastName: 'Davis',
            username: 'sarahdavis',
            email: 'sarah.davis@recruitment.com',
            password: 'password123',
            role: 'employee',
            is_verified: true
        },
        // Team Members - Recruiters (employee role)
        {
            firstName: 'Kevin',
            lastName: 'Anderson',
            username: 'kevinanderson',
            email: 'kevin.anderson@recruitment.com',
            password: 'password123',
            role: 'employee',
            is_verified: true
        },
        {
            firstName: 'Lisa',
            lastName: 'Thompson',
            username: 'lisathompson',
            email: 'lisa.thompson@recruitment.com',
            password: 'password123',
            role: 'employee',
            is_verified: true
        },
        // Team Members - Additional Admins
        {
            firstName: 'James',
            lastName: 'Wilson',
            username: 'jameswilson',
            email: 'james.wilson@recruitment.com',
            password: 'password123',
            role: 'admin',
            is_verified: true
        },
        {
            firstName: 'Amanda',
            lastName: 'Taylor',
            username: 'amandataylor',
            email: 'amanda.taylor@recruitment.com',
            password: 'password123',
            role: 'admin',
            is_verified: true
        }
    ];

    try {
        console.log('Creating users...');
        const createdUsers = [];
        
        for (const userData of users) {
            const user = new User(userData);
            const savedUser = await user.save();
            createdUsers.push(savedUser);
        }
        
        console.log(`Created ${createdUsers.length} users`);
        return createdUsers;
    } catch (error) {
        console.error('Error seeding users:', error.message);
        console.error('Full error:', error);
        return [];
    }
};

const seedCompanies = async (users) => {
    const employers = users.filter(u => u.role === 'employer');
    
    const companies = [
        // TechCorp Solutions - Large Enterprise Technology Company
        {
            name: 'TechCorp Solutions',
            industry: 'Technology',
            description: 'Leading enterprise software company specializing in cloud computing, AI solutions, and digital transformation. We help Fortune 500 companies modernize their technology infrastructure and optimize business processes.',
            company_size: 'large',
            website: 'https://techcorp-solutions.com',
            email: 'careers@techcorp-solutions.com',
            phone: '+1-415-555-0100',
            address: '1 Market Street, Suite 3000, San Francisco, CA 94105',
            location: 'San Francisco, CA',
            city: 'San Francisco',
            country: 'USA',
            founded_year: 2008,
            is_verified: true,
            is_premium: true,
            status: 'active',
            total_employees: 2500,
            active_jobs: 15,
            created_by: employers[0]._id,
            contact_person: 'Alice Williams',
            benefits: ['Health Insurance', '401k Match', 'Stock Options', 'Flexible PTO', 'Remote Work', 'Learning Budget'],
            company_culture: 'Innovation-driven culture with emphasis on work-life balance and professional growth',
            tech_stack: ['React', 'Node.js', 'AWS', 'Kubernetes', 'Python', 'TypeScript'],
            contacts: [
                {
                    name: 'Alice Williams',
                    title: 'VP of Human Resources',
                    email: 'alice.williams@techcorp-solutions.com',
                    phone: '+1-415-555-0101',
                    is_primary: true
                },
                {
                    name: 'Michael Chen',
                    title: 'Engineering Manager',
                    email: 'michael.chen@techcorp-solutions.com',
                    phone: '+1-415-555-0102',
                    is_primary: false
                }
            ]
        },
        // InnovateLab - AI/ML Startup
        {
            name: 'InnovateLab',
            industry: 'Artificial Intelligence',
            description: 'Cutting-edge AI startup developing next-generation machine learning solutions for healthcare, finance, and autonomous systems. We\'re building the future of intelligent automation.',
            company_size: 'startup',
            website: 'https://innovatelab.ai',
            email: 'join@innovatelab.ai',
            phone: '+1-646-555-0200',
            address: '123 Broadway, Floor 15, New York, NY 10001',
            location: 'New York, NY',
            city: 'New York',
            country: 'USA',
            founded_year: 2021,
            is_verified: true,
            is_premium: false,
            status: 'active',
            total_employees: 45,
            active_jobs: 8,
            created_by: employers[1]._id,
            contact_person: 'David Brown',
            benefits: ['Equity Package', 'Health Insurance', 'Unlimited PTO', 'Home Office Budget', 'Conference Budget'],
            company_culture: 'Fast-paced startup environment with flat hierarchy and direct impact on product development',
            tech_stack: ['Python', 'TensorFlow', 'PyTorch', 'AWS', 'Docker', 'Kubernetes'],
            contacts: [
                {
                    name: 'David Brown',
                    title: 'CEO & Co-Founder',
                    email: 'david.brown@innovatelab.ai',
                    phone: '+1-646-555-0201',
                    is_primary: true
                },
                {
                    name: 'Sarah Kim',
                    title: 'Head of Talent',
                    email: 'sarah.kim@innovatelab.ai',
                    phone: '+1-646-555-0202',
                    is_primary: false
                }
            ]
        },
        // DesignCraft Studio - Creative Agency
        {
            name: 'DesignCraft Studio',
            industry: 'Design & Creative',
            description: 'Award-winning design studio specializing in brand identity, digital experiences, and product design. We work with startups and established brands to create memorable visual experiences.',
            company_size: 'small',
            website: 'https://designcraft-studio.com',
            email: 'hello@designcraft-studio.com',
            phone: '+1-512-555-0300',
            address: '456 South Lamar Blvd, Austin, TX 78704',
            location: 'Austin, TX',
            city: 'Austin',
            country: 'USA',
            founded_year: 2018,
            is_verified: true,
            is_premium: false,
            status: 'active',
            total_employees: 25,
            active_jobs: 4,
            created_by: employers[0]._id,
            contact_person: 'Emma Rodriguez',
            benefits: ['Health Insurance', 'Creative Freedom', 'Flexible Hours', 'Professional Development', 'Team Retreats'],
            company_culture: 'Creative and collaborative environment with emphasis on artistic expression and client satisfaction',
            tech_stack: ['Figma', 'Adobe Creative Suite', 'React', 'Next.js', 'Webflow'],
            contacts: [
                {
                    name: 'Emma Rodriguez',
                    title: 'Creative Director',
                    email: 'emma.rodriguez@designcraft-studio.com',
                    phone: '+1-512-555-0301',
                    is_primary: true
                }
            ]
        },
        // CloudScale Systems - DevOps & Infrastructure
        {
            name: 'CloudScale Systems',
            industry: 'Cloud Infrastructure',
            description: 'Enterprise cloud infrastructure and DevOps consulting company. We help organizations scale their infrastructure, implement CI/CD pipelines, and optimize cloud costs.',
            company_size: 'medium',
            website: 'https://cloudscale-systems.com',
            email: 'careers@cloudscale-systems.com',
            phone: '+1-206-555-0400',
            address: '789 Pine Street, Seattle, WA 98101',
            location: 'Seattle, WA',
            city: 'Seattle',
            country: 'USA',
            founded_year: 2015,
            is_verified: true,
            is_premium: true,
            status: 'active',
            total_employees: 180,
            active_jobs: 12,
            created_by: employers[1]._id,
            contact_person: 'James Wilson',
            benefits: ['Health Insurance', '401k', 'Stock Options', 'Remote Work', 'Certification Budget', 'Flexible PTO'],
            company_culture: 'Technical excellence focused with strong emphasis on automation and best practices',
            tech_stack: ['AWS', 'Azure', 'GCP', 'Kubernetes', 'Terraform', 'Jenkins', 'Docker'],
            contacts: [
                {
                    name: 'James Wilson',
                    title: 'VP of Engineering',
                    email: 'james.wilson@cloudscale-systems.com',
                    phone: '+1-206-555-0401',
                    is_primary: true
                },
                {
                    name: 'Lisa Chang',
                    title: 'Talent Acquisition Manager',
                    email: 'lisa.chang@cloudscale-systems.com',
                    phone: '+1-206-555-0402',
                    is_primary: false
                }
            ]
        },
        // DataFlow Analytics - Data Science & Analytics
        {
            name: 'DataFlow Analytics',
            industry: 'Data & Analytics',
            description: 'Leading data analytics company providing business intelligence, data engineering, and machine learning solutions. We transform raw data into actionable business insights.',
            company_size: 'medium',
            website: 'https://dataflow-analytics.com',
            email: 'talent@dataflow-analytics.com',
            phone: '+1-617-555-0500',
            address: '321 Newbury Street, Boston, MA 02115',
            location: 'Boston, MA',
            city: 'Boston',
            country: 'USA',
            founded_year: 2017,
            is_verified: true,
            is_premium: true,
            status: 'active',
            total_employees: 120,
            active_jobs: 9,
            created_by: employers[0]._id,
            contact_person: 'Dr. Maria Santos',
            benefits: ['Health Insurance', 'Research Budget', 'Conference Attendance', 'Flexible Hours', 'Learning Stipend'],
            company_culture: 'Data-driven culture with focus on research, experimentation, and continuous learning',
            tech_stack: ['Python', 'R', 'SQL', 'Spark', 'Tableau', 'AWS', 'Snowflake'],
            contacts: [
                {
                    name: 'Dr. Maria Santos',
                    title: 'Chief Data Officer',
                    email: 'maria.santos@dataflow-analytics.com',
                    phone: '+1-617-555-0501',
                    is_primary: true
                }
            ]
        },
        // WebCraft Solutions - Full-Service Web Development
        {
            name: 'WebCraft Solutions',
            industry: 'Web Development',
            description: 'Full-service web development agency specializing in e-commerce, custom web applications, and digital marketing solutions. We build scalable web solutions for businesses of all sizes.',
            company_size: 'small',
            website: 'https://webcraft-solutions.com',
            email: 'info@webcraft-solutions.com',
            phone: '+1-312-555-0600',
            address: '654 West Lake Street, Chicago, IL 60661',
            location: 'Chicago, IL',
            city: 'Chicago',
            country: 'USA',
            founded_year: 2019,
            is_verified: true,
            is_premium: false,
            status: 'active',
            total_employees: 35,
            active_jobs: 6,
            created_by: employers[1]._id,
            contact_person: 'Robert Kim',
            benefits: ['Health Insurance', 'Flexible Hours', 'Remote Work', 'Professional Development', 'Team Events'],
            company_culture: 'Collaborative environment with focus on quality code, client satisfaction, and work-life balance',
            tech_stack: ['PHP', 'Laravel', 'React', 'Vue.js', 'MySQL', 'WordPress'],
            contacts: [
                {
                    name: 'Robert Kim',
                    title: 'Lead Developer',
                    email: 'robert.kim@webcraft-solutions.com',
                    phone: '+1-312-555-0601',
                    is_primary: true
                }
            ]
        },
        // AgileFlow Consulting - Project Management & Consulting
        {
            name: 'AgileFlow Consulting',
            industry: 'Business Consulting',
            description: 'Management consulting firm specializing in Agile transformation, project management, and organizational change. We help companies improve their processes and team efficiency.',
            company_size: 'medium',
            website: 'https://agileflow-consulting.com',
            email: 'careers@agileflow-consulting.com',
            phone: '+1-305-555-0700',
            address: '987 Biscayne Boulevard, Miami, FL 33132',
            location: 'Miami, FL',
            city: 'Miami',
            country: 'USA',
            founded_year: 2014,
            is_verified: true,
            is_premium: true,
            status: 'active',
            total_employees: 95,
            active_jobs: 7,
            created_by: employers[0]._id,
            contact_person: 'Carlos Martinez',
            benefits: ['Health Insurance', '401k', 'Travel Opportunities', 'Professional Certifications', 'Flexible PTO'],
            company_culture: 'Results-oriented culture with emphasis on continuous improvement and client success',
            tech_stack: ['Jira', 'Confluence', 'Slack', 'Microsoft Project', 'Tableau'],
            contacts: [
                {
                    name: 'Carlos Martinez',
                    title: 'Managing Partner',
                    email: 'carlos.martinez@agileflow-consulting.com',
                    phone: '+1-305-555-0701',
                    is_primary: true
                }
            ]
        }
    ];

    try {
        const createdCompanies = await Company.insertMany(companies);
        console.log(`Created ${createdCompanies.length} companies`);
        return createdCompanies;
    } catch (error) {
        console.error('Error seeding companies:', error);
        return [];
    }
};

const seedCandidateProfiles = async (users, skills) => {
    const candidates = users.filter(u => u.role === 'candidate');
    const skillIds = skills.map(s => s._id);
    
    const profiles = [
        // John Doe - Senior Full Stack Developer
        {
            user_id: candidates[0]._id,
            summary: 'Senior Full Stack Developer with 6+ years of experience building scalable web applications. Expert in React, Node.js, and cloud technologies. Strong team leadership and mentoring skills.',
            years_of_experience: 6,
            phone: '+1-555-0101',
            location: 'New York, NY',
            linkedin_url: 'https://linkedin.com/in/johndoe',
            github_url: 'https://github.com/johndoe',
            portfolio_url: 'https://johndoe.dev',
            resume_url: 'https://example.com/resumes/johndoe.pdf',
            career_level: 'senior',
            education: [
                {
                    institution: 'MIT',
                    degree: 'Bachelor of Science',
                    field_of_study: 'Computer Science',
                    start_date: new Date('2014-09-01'),
                    end_date: new Date('2018-05-01'),
                    grade: '3.8 GPA'
                }
            ],
            work_experience: [
                {
                    company_name: 'Google',
                    position: 'Senior Software Engineer',
                    start_date: new Date('2021-03-01'),
                    location: 'New York, NY',
                    description: 'Led development of large-scale web applications serving millions of users. Mentored junior developers and implemented best practices.',
                    is_current: true
                },
                {
                    company_name: 'Facebook',
                    position: 'Software Engineer',
                    start_date: new Date('2018-06-01'),
                    end_date: new Date('2021-02-01'),
                    location: 'Menlo Park, CA',
                    description: 'Developed React components and Node.js services for the main Facebook platform.'
                }
            ],
            skills: [
                { skill_id: skills.find(s => s.name === 'javascript')._id, proficiency_level: 5, years_of_experience: 6, is_primary: true },
                { skill_id: skills.find(s => s.name === 'react')._id, proficiency_level: 5, years_of_experience: 5, is_primary: true },
                { skill_id: skills.find(s => s.name === 'node.js')._id, proficiency_level: 5, years_of_experience: 5, is_primary: true },
                { skill_id: skills.find(s => s.name === 'typescript')._id, proficiency_level: 4, years_of_experience: 4 },
                { skill_id: skills.find(s => s.name === 'aws')._id, proficiency_level: 4, years_of_experience: 3 },
                { skill_id: skills.find(s => s.name === 'docker')._id, proficiency_level: 4, years_of_experience: 3 }
            ],
            job_preferences: {
                desired_job_types: ['full-time'],
                desired_locations: ['New York', 'San Francisco', 'Remote'],
                remote_preference: 'hybrid',
                relocation_willingness: true,
                desired_salary_min: 160000,
                desired_salary_max: 200000
            }
        },
        // Jane Smith - Data Scientist
        {
            user_id: candidates[1]._id,
            summary: 'Experienced Data Scientist with 5+ years in machine learning and statistical analysis. Specialized in NLP and deep learning with proven track record in production ML systems.',
            years_of_experience: 5,
            phone: '+1-555-0102',
            location: 'San Francisco, CA',
            linkedin_url: 'https://linkedin.com/in/janesmith',
            github_url: 'https://github.com/janesmith',
            portfolio_url: 'https://janesmith.ai',
            career_level: 'mid',
            education: [
                {
                    institution: 'Stanford University',
                    degree: 'Master of Science',
                    field_of_study: 'Computer Science - AI Track',
                    start_date: new Date('2017-09-01'),
                    end_date: new Date('2019-05-01'),
                    grade: '3.9 GPA'
                },
                {
                    institution: 'UC Berkeley',
                    degree: 'Bachelor of Science',
                    field_of_study: 'Mathematics',
                    start_date: new Date('2013-09-01'),
                    end_date: new Date('2017-05-01'),
                    grade: '3.7 GPA'
                }
            ],
            work_experience: [
                {
                    company_name: 'OpenAI',
                    position: 'Senior Data Scientist',
                    start_date: new Date('2021-01-01'),
                    location: 'San Francisco, CA',
                    description: 'Developed and deployed machine learning models for natural language processing. Led research initiatives in deep learning.',
                    is_current: true
                },
                {
                    company_name: 'Tesla',
                    position: 'Data Scientist',
                    start_date: new Date('2019-06-01'),
                    end_date: new Date('2020-12-01'),
                    location: 'Palo Alto, CA',
                    description: 'Built predictive models for autonomous driving systems using computer vision and sensor data.'
                }
            ],
            skills: [
                { skill_id: skills.find(s => s.name === 'python')._id, proficiency_level: 5, years_of_experience: 5, is_primary: true },
                { skill_id: skills.find(s => s.name === 'aws')._id, proficiency_level: 4, years_of_experience: 4 },
                { skill_id: skills.find(s => s.name === 'postgresql')._id, proficiency_level: 4, years_of_experience: 4 },
                { skill_id: skills.find(s => s.name === 'mongodb')._id, proficiency_level: 3, years_of_experience: 3 }
            ],
            job_preferences: {
                desired_job_types: ['full-time'],
                desired_locations: ['San Francisco', 'Seattle', 'Remote'],
                remote_preference: 'remote',
                relocation_willingness: false,
                desired_salary_min: 140000,
                desired_salary_max: 180000
            }
        },
        // Mike Johnson - UX/UI Designer
        {
            user_id: candidates[2]._id,
            summary: 'Creative UX/UI Designer with 4+ years of experience creating user-centered digital products. Passionate about accessibility and inclusive design with strong prototyping skills.',
            years_of_experience: 4,
            phone: '+1-555-0103',
            location: 'Austin, TX',
            linkedin_url: 'https://linkedin.com/in/mikejohnson',
            portfolio_url: 'https://mikejohnson.design',
            career_level: 'mid',
            education: [
                {
                    institution: 'Art Center College of Design',
                    degree: 'Bachelor of Fine Arts',
                    field_of_study: 'Interaction Design',
                    start_date: new Date('2016-09-01'),
                    end_date: new Date('2020-05-01'),
                    grade: '3.6 GPA'
                }
            ],
            work_experience: [
                {
                    company_name: 'Airbnb',
                    position: 'UX Designer',
                    start_date: new Date('2022-01-01'),
                    location: 'Austin, TX',
                    description: 'Designed user experiences for host onboarding and property management tools. Conducted user research and usability testing.',
                    is_current: true
                },
                {
                    company_name: 'Design Studio Pro',
                    position: 'UI/UX Designer',
                    start_date: new Date('2020-06-01'),
                    end_date: new Date('2021-12-01'),
                    location: 'Austin, TX',
                    description: 'Created design systems and user interfaces for various client projects including e-commerce and SaaS applications.'
                }
            ],
            skills: [
                { skill_id: skills.find(s => s.name === 'figma')._id, proficiency_level: 5, years_of_experience: 4, is_primary: true },
                { skill_id: skills.find(s => s.name === 'adobe creative suite')._id, proficiency_level: 4, years_of_experience: 4, is_primary: true },
                { skill_id: skills.find(s => s.name === 'javascript')._id, proficiency_level: 3, years_of_experience: 2 },
                { skill_id: skills.find(s => s.name === 'react')._id, proficiency_level: 3, years_of_experience: 2 }
            ],
            job_preferences: {
                desired_job_types: ['full-time', 'contract'],
                desired_locations: ['Austin', 'San Francisco', 'Remote'],
                remote_preference: 'hybrid',
                relocation_willingness: true,
                desired_salary_min: 85000,
                desired_salary_max: 110000
            }
        },
        // Sarah Chen - Frontend Developer & UI/UX Designer
        {
            user_id: candidates[3]._id,
            summary: 'Frontend Developer and UI/UX Designer with 4 years of experience. Combines technical skills with design thinking to create beautiful, functional user interfaces.',
            years_of_experience: 4,
            phone: '+1-555-0104',
            location: 'Seattle, WA',
            linkedin_url: 'https://linkedin.com/in/sarahchen',
            github_url: 'https://github.com/sarahchen',
            portfolio_url: 'https://sarahchen.design',
            career_level: 'mid',
            education: [
                {
                    institution: 'University of Washington',
                    degree: 'Bachelor of Science',
                    field_of_study: 'Human-Computer Interaction',
                    start_date: new Date('2016-09-01'),
                    end_date: new Date('2020-05-01'),
                    grade: '3.7 GPA'
                }
            ],
            work_experience: [
                {
                    company_name: 'Microsoft',
                    position: 'Frontend Developer',
                    start_date: new Date('2021-03-01'),
                    location: 'Seattle, WA',
                    description: 'Developed React components for Microsoft Teams. Collaborated with designers to implement responsive UI designs.',
                    is_current: true
                },
                {
                    company_name: 'Amazon',
                    position: 'UI Developer',
                    start_date: new Date('2020-06-01'),
                    end_date: new Date('2021-02-01'),
                    location: 'Seattle, WA',
                    description: 'Built and maintained user interfaces for Amazon Web Services console using React and TypeScript.'
                }
            ],
            skills: [
                { skill_id: skills.find(s => s.name === 'javascript')._id, proficiency_level: 4, years_of_experience: 4, is_primary: true },
                { skill_id: skills.find(s => s.name === 'react')._id, proficiency_level: 4, years_of_experience: 4, is_primary: true },
                { skill_id: skills.find(s => s.name === 'typescript')._id, proficiency_level: 4, years_of_experience: 3, is_primary: true },
                { skill_id: skills.find(s => s.name === 'figma')._id, proficiency_level: 4, years_of_experience: 4 }
            ],
            job_preferences: {
                desired_job_types: ['full-time'],
                desired_locations: ['Seattle', 'San Francisco', 'Remote'],
                remote_preference: 'hybrid',
                relocation_willingness: false,
                desired_salary_min: 110000,
                desired_salary_max: 140000
            }
        },
        // David Rodriguez - Senior DevOps Engineer
        {
            user_id: candidates[4]._id,
            summary: 'Senior DevOps Engineer with 6+ years of experience in cloud infrastructure, CI/CD, and automation. Expert in AWS, Docker, and Kubernetes with strong security focus.',
            years_of_experience: 6,
            phone: '+1-555-0105',
            location: 'Denver, CO',
            linkedin_url: 'https://linkedin.com/in/davidrodriguez',
            github_url: 'https://github.com/davidrodriguez',
            career_level: 'senior',
            education: [
                {
                    institution: 'Colorado School of Mines',
                    degree: 'Bachelor of Science',
                    field_of_study: 'Computer Engineering',
                    start_date: new Date('2014-09-01'),
                    end_date: new Date('2018-05-01'),
                    grade: '3.5 GPA'
                }
            ],
            work_experience: [
                {
                    company_name: 'Netflix',
                    position: 'Senior DevOps Engineer',
                    start_date: new Date('2021-01-01'),
                    location: 'Denver, CO',
                    description: 'Led infrastructure automation initiatives and managed cloud deployments at scale. Implemented security best practices and monitoring systems.',
                    is_current: true
                },
                {
                    company_name: 'Uber',
                    position: 'DevOps Engineer',
                    start_date: new Date('2018-07-01'),
                    end_date: new Date('2020-12-01'),
                    location: 'San Francisco, CA',
                    description: 'Built and maintained CI/CD pipelines for microservices architecture. Managed Kubernetes clusters and implemented monitoring solutions.'
                }
            ],
            skills: [
                { skill_id: skills.find(s => s.name === 'aws')._id, proficiency_level: 5, years_of_experience: 6, is_primary: true },
                { skill_id: skills.find(s => s.name === 'docker')._id, proficiency_level: 5, years_of_experience: 5, is_primary: true },
                { skill_id: skills.find(s => s.name === 'kubernetes')._id, proficiency_level: 5, years_of_experience: 4, is_primary: true },
                { skill_id: skills.find(s => s.name === 'jenkins')._id, proficiency_level: 4, years_of_experience: 5 },
                { skill_id: skills.find(s => s.name === 'python')._id, proficiency_level: 4, years_of_experience: 4 }
            ],
            job_preferences: {
                desired_job_types: ['full-time'],
                desired_locations: ['Denver', 'Remote'],
                remote_preference: 'remote',
                relocation_willingness: false,
                desired_salary_min: 150000,
                desired_salary_max: 190000
            }
        },
        // Emily Thompson - PHP Developer
        {
            user_id: candidates[5]._id,
            summary: 'PHP Developer with 5 years of experience building web applications. Specialized in Laravel framework with strong database design and API development skills.',
            years_of_experience: 5,
            phone: '+1-555-0106',
            location: 'Chicago, IL',
            linkedin_url: 'https://linkedin.com/in/emilythompson',
            github_url: 'https://github.com/emilythompson',
            career_level: 'mid',
            education: [
                {
                    institution: 'University of Illinois at Chicago',
                    degree: 'Bachelor of Science',
                    field_of_study: 'Computer Science',
                    start_date: new Date('2015-09-01'),
                    end_date: new Date('2019-05-01'),
                    grade: '3.4 GPA'
                }
            ],
            work_experience: [
                {
                    company_name: 'WP Engine',
                    position: 'Senior PHP Developer',
                    start_date: new Date('2021-06-01'),
                    location: 'Chicago, IL',
                    description: 'Developed and maintained WordPress hosting platform features using PHP and Laravel. Led database optimization projects.',
                    is_current: true
                },
                {
                    company_name: 'Local Web Agency',
                    position: 'PHP Developer',
                    start_date: new Date('2019-06-01'),
                    end_date: new Date('2021-05-01'),
                    location: 'Chicago, IL',
                    description: 'Built custom web applications for clients using PHP, Laravel, and MySQL. Integrated third-party APIs and payment systems.'
                }
            ],
            skills: [
                { skill_id: skills.find(s => s.name === 'php')._id, proficiency_level: 5, years_of_experience: 5, is_primary: true },
                { skill_id: skills.find(s => s.name === 'laravel')._id, proficiency_level: 5, years_of_experience: 4, is_primary: true },
                { skill_id: skills.find(s => s.name === 'mysql')._id, proficiency_level: 4, years_of_experience: 5 },
                { skill_id: skills.find(s => s.name === 'vue.js')._id, proficiency_level: 3, years_of_experience: 2 }
            ],
            job_preferences: {
                desired_job_types: ['full-time', 'contract'],
                desired_locations: ['Chicago', 'Remote'],
                remote_preference: 'hybrid',
                relocation_willingness: false,
                desired_salary_min: 95000,
                desired_salary_max: 125000
            }
        },
        // Alex Kim - Junior Frontend Developer
        {
            user_id: candidates[6]._id,
            summary: 'Junior Frontend Developer with 1 year of experience. Recent computer science graduate with strong foundation in JavaScript, React, and modern web development practices.',
            years_of_experience: 1,
            phone: '+1-555-0107',
            location: 'Portland, OR',
            linkedin_url: 'https://linkedin.com/in/alexkim',
            github_url: 'https://github.com/alexkim',
            portfolio_url: 'https://alexkim.dev',
            career_level: 'junior',
            education: [
                {
                    institution: 'Oregon State University',
                    degree: 'Bachelor of Science',
                    field_of_study: 'Computer Science',
                    start_date: new Date('2019-09-01'),
                    end_date: new Date('2023-05-01'),
                    grade: '3.6 GPA'
                }
            ],
            work_experience: [
                {
                    company_name: 'Nike',
                    position: 'Junior Frontend Developer',
                    start_date: new Date('2023-06-01'),
                    location: 'Portland, OR',
                    description: 'Developing user interfaces for Nike\'s e-commerce platform using React and TypeScript. Contributing to the design system and component library.',
                    is_current: true
                }
            ],
            skills: [
                { skill_id: skills.find(s => s.name === 'javascript')._id, proficiency_level: 3, years_of_experience: 1, is_primary: true },
                { skill_id: skills.find(s => s.name === 'react')._id, proficiency_level: 3, years_of_experience: 1, is_primary: true },
                { skill_id: skills.find(s => s.name === 'node.js')._id, proficiency_level: 2, years_of_experience: 1 },
                { skill_id: skills.find(s => s.name === 'git')._id, proficiency_level: 3, years_of_experience: 1 }
            ],
            job_preferences: {
                desired_job_types: ['full-time'],
                desired_locations: ['Portland', 'Seattle', 'San Francisco'],
                remote_preference: 'hybrid',
                relocation_willingness: true,
                desired_salary_min: 75000,
                desired_salary_max: 95000
            }
        },
        // Maria Garcia - Senior Project Manager & Scrum Master
        {
            user_id: candidates[7]._id,
            summary: 'Senior Project Manager and Certified Scrum Master with 7+ years of experience leading cross-functional teams. Expert in Agile methodologies with strong stakeholder management skills.',
            years_of_experience: 7,
            phone: '+1-555-0108',
            location: 'Miami, FL',
            linkedin_url: 'https://linkedin.com/in/mariagarcia',
            career_level: 'senior',
            education: [
                {
                    institution: 'University of Miami',
                    degree: 'Master of Business Administration',
                    field_of_study: 'Project Management',
                    start_date: new Date('2014-09-01'),
                    end_date: new Date('2016-05-01'),
                    grade: '3.8 GPA'
                },
                {
                    institution: 'Florida International University',
                    degree: 'Bachelor of Science',
                    field_of_study: 'Business Administration',
                    start_date: new Date('2010-09-01'),
                    end_date: new Date('2014-05-01'),
                    grade: '3.5 GPA'
                }
            ],
            work_experience: [
                {
                    company_name: 'Salesforce',
                    position: 'Senior Project Manager',
                    start_date: new Date('2020-03-01'),
                    location: 'Miami, FL',
                    description: 'Leading multiple product development initiatives with teams of 15+ developers. Implementing Agile practices and managing stakeholder relationships.',
                    is_current: true
                },
                {
                    company_name: 'IBM',
                    position: 'Scrum Master',
                    start_date: new Date('2017-01-01'),
                    end_date: new Date('2020-02-01'),
                    location: 'Miami, FL',
                    description: 'Facilitated Scrum ceremonies for 3 development teams. Coached teams on Agile practices and removed impediments to delivery.'
                }
            ],
            skills: [
                { skill_id: skills.find(s => s.name === 'leadership')._id, proficiency_level: 5, years_of_experience: 7, is_primary: true },
                { skill_id: skills.find(s => s.name === 'project management')._id, proficiency_level: 5, years_of_experience: 7, is_primary: true },
                { skill_id: skills.find(s => s.name === 'communication')._id, proficiency_level: 5, years_of_experience: 7, is_primary: true },
                { skill_id: skills.find(s => s.name === 'teamwork')._id, proficiency_level: 5, years_of_experience: 7 }
            ],
            job_preferences: {
                desired_job_types: ['full-time'],
                desired_locations: ['Miami', 'Remote'],
                remote_preference: 'hybrid',
                relocation_willingness: false,
                desired_salary_min: 120000,
                desired_salary_max: 150000
            }
        },
        // Robert Wilson - Data Engineer
        {
            user_id: candidates[8]._id,
            summary: 'Data Engineer with 4+ years of experience building data pipelines and analytics infrastructure. Specialized in Python, AWS, and big data technologies.',
            years_of_experience: 4,
            phone: '+1-555-0109',
            location: 'Boston, MA',
            linkedin_url: 'https://linkedin.com/in/robertwilson',
            github_url: 'https://github.com/robertwilson',
            career_level: 'mid',
            education: [
                {
                    institution: 'MIT',
                    degree: 'Master of Science',
                    field_of_study: 'Data Science',
                    start_date: new Date('2018-09-01'),
                    end_date: new Date('2020-05-01'),
                    grade: '3.7 GPA'
                },
                {
                    institution: 'Boston University',
                    degree: 'Bachelor of Science',
                    field_of_study: 'Computer Science',
                    start_date: new Date('2014-09-01'),
                    end_date: new Date('2018-05-01'),
                    grade: '3.5 GPA'
                }
            ],
            work_experience: [
                {
                    company_name: 'Spotify',
                    position: 'Data Engineer',
                    start_date: new Date('2021-01-01'),
                    location: 'Boston, MA',
                    description: 'Building data pipelines for music recommendation systems. Working with large-scale data processing using Python and AWS services.',
                    is_current: true
                },
                {
                    company_name: 'HubSpot',
                    position: 'Junior Data Engineer',
                    start_date: new Date('2020-06-01'),
                    end_date: new Date('2020-12-01'),
                    location: 'Boston, MA',
                    description: 'Developed ETL pipelines for customer analytics. Built data warehousing solutions using PostgreSQL and MongoDB.'
                }
            ],
            skills: [
                { skill_id: skills.find(s => s.name === 'python')._id, proficiency_level: 5, years_of_experience: 4, is_primary: true },
                { skill_id: skills.find(s => s.name === 'aws')._id, proficiency_level: 4, years_of_experience: 3, is_primary: true },
                { skill_id: skills.find(s => s.name === 'postgresql')._id, proficiency_level: 4, years_of_experience: 4 },
                { skill_id: skills.find(s => s.name === 'mongodb')._id, proficiency_level: 4, years_of_experience: 3 }
            ],
            job_preferences: {
                desired_job_types: ['full-time'],
                desired_locations: ['Boston', 'New York', 'Remote'],
                remote_preference: 'flexible',
                relocation_willingness: true,
                desired_salary_min: 130000,
                desired_salary_max: 160000
            }
        }
    ];

    try {
        const createdProfiles = await CandidateProfile.insertMany(profiles);
        console.log(`Created ${createdProfiles.length} candidate profiles`);
        return createdProfiles;
    } catch (error) {
        console.error('Error seeding candidate profiles:', error);
        return [];
    }
};

const seedJobs = async (companies, users, skills) => {
    const jobs = [
        {
            company_id: companies[0]._id,
            posted_by: users.find(u => u.email === 'alice.williams@techcorp.com')._id,
            title: 'Senior Full Stack Developer',
            description: 'We are looking for an experienced full stack developer to join our team and help build the next generation of our platform.',
            requirements: '" 5+ years of experience with JavaScript/TypeScript\n" Strong experience with React and Node.js\n" Experience with MongoDB and PostgreSQL\n" Excellent problem-solving skills',
            responsibilities: '" Design and implement new features\n" Collaborate with cross-functional teams\n" Mentor junior developers\n" Participate in code reviews',
            job_type: 'full-time',
            experience_level: 'senior',
            department: 'Engineering',
            location: 'San Francisco, CA',
            city: 'San Francisco',
            country: 'USA',
            remote_type: 'hybrid',
            salary_range: {
                min: 140000,
                max: 180000,
                currency: 'USD',
                period: 'yearly'
            },
            benefits: ['Health Insurance', '401k', 'Stock Options', 'Flexible Hours'],
            skills_required: [
                { skill_id: skills.find(s => s.name === 'javascript')._id, proficiency_level: 4, is_required: true },
                { skill_id: skills.find(s => s.name === 'react')._id, proficiency_level: 4, is_required: true },
                { skill_id: skills.find(s => s.name === 'node.js')._id, proficiency_level: 4, is_required: true },
                { skill_id: skills.find(s => s.name === 'mongodb')._id, proficiency_level: 3, is_required: false }
            ],
            years_of_experience_min: 5,
            status: 'active',
            published_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
            company_id: companies[1]._id,
            posted_by: users.find(u => u.email === 'david.brown@startupinc.com')._id,
            title: 'Machine Learning Engineer',
            description: 'Join our AI team to build cutting-edge ML models and shape the future of artificial intelligence.',
            requirements: '" 3+ years of ML experience\n" Strong Python skills\n" Experience with TensorFlow or PyTorch\n" MS in Computer Science or related field',
            responsibilities: '" Develop and deploy ML models\n" Work with large datasets\n" Collaborate with product team\n" Research new ML techniques',
            job_type: 'full-time',
            experience_level: 'mid',
            department: 'AI/ML',
            location: 'New York, NY',
            city: 'New York',
            country: 'USA',
            remote_type: 'remote',
            salary_range: {
                min: 120000,
                max: 160000,
                currency: 'USD',
                period: 'yearly'
            },
            benefits: ['Health Insurance', 'Equity', 'Unlimited PTO', 'Home Office Budget'],
            skills_required: [
                { skill_id: skills.find(s => s.name === 'python')._id, proficiency_level: 4, is_required: true },
                { skill_id: skills.find(s => s.name === 'aws')._id, proficiency_level: 3, is_required: false }
            ],
            years_of_experience_min: 3,
            status: 'active',
            published_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
            company_id: companies[2]._id,
            posted_by: users.find(u => u.email === 'alice.williams@techcorp.com')._id,
            title: 'Business Analyst',
            description: 'Looking for a skilled business analyst to help our clients optimize their operations.',
            requirements: '" 2+ years of business analysis experience\n" Strong analytical skills\n" Experience with data visualization tools\n" Excellent communication skills',
            responsibilities: '" Analyze business processes\n" Create detailed reports\n" Present findings to stakeholders\n" Recommend improvements',
            job_type: 'full-time',
            experience_level: 'junior',
            department: 'Consulting',
            location: 'London, UK',
            city: 'London',
            country: 'UK',
            remote_type: 'onsite',
            salary_range: {
                min: 45000,
                max: 60000,
                currency: 'GBP',
                period: 'yearly'
            },
            benefits: ['Health Insurance', 'Pension', 'Training Budget', 'Travel Opportunities'],
            skills_required: [
                { skill_id: skills.find(s => s.name === 'problem solving')._id, proficiency_level: 4, is_required: true },
                { skill_id: skills.find(s => s.name === 'communication')._id, proficiency_level: 4, is_required: true }
            ],
            years_of_experience_min: 2,
            status: 'active',
            published_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
            company_id: companies[3]._id,
            posted_by: users.find(u => u.email === 'david.brown@startupinc.com')._id,
            title: 'Digital Marketing Manager',
            description: 'Lead our digital marketing efforts and drive growth through innovative campaigns.',
            requirements: '" 4+ years in digital marketing\n" Experience with SEO/SEM\n" Strong analytical skills\n" Leadership experience',
            responsibilities: '" Develop marketing strategies\n" Manage marketing team\n" Analyze campaign performance\n" Collaborate with sales team',
            job_type: 'full-time',
            experience_level: 'mid',
            department: 'Marketing',
            location: 'Los Angeles, CA',
            city: 'Los Angeles',
            country: 'USA',
            remote_type: 'hybrid',
            salary_range: {
                min: 80000,
                max: 110000,
                currency: 'USD',
                period: 'yearly'
            },
            benefits: ['Health Insurance', '401k', 'Performance Bonus', 'Professional Development'],
            skills_required: [
                { skill_id: skills.find(s => s.name === 'leadership')._id, proficiency_level: 3, is_required: true },
                { skill_id: skills.find(s => s.name === 'communication')._id, proficiency_level: 4, is_required: true }
            ],
            years_of_experience_min: 4,
            status: 'active',
            published_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
            company_id: companies[0]._id,
            posted_by: users.find(u => u.email === 'alice.williams@techcorp.com')._id,
            title: 'DevOps Engineer',
            description: 'Join our infrastructure team to build and maintain scalable cloud systems.',
            requirements: '" 3+ years DevOps experience\n" Strong AWS/Azure knowledge\n" Experience with Docker/Kubernetes\n" Infrastructure as Code experience',
            responsibilities: '" Design cloud infrastructure\n" Implement CI/CD pipelines\n" Monitor system performance\n" Ensure security compliance',
            job_type: 'full-time',
            experience_level: 'mid',
            department: 'Infrastructure',
            location: 'San Francisco, CA',
            city: 'San Francisco',
            country: 'USA',
            remote_type: 'flexible',
            salary_range: {
                min: 130000,
                max: 170000,
                currency: 'USD',
                period: 'yearly'
            },
            benefits: ['Health Insurance', '401k', 'Stock Options', 'Learning Budget'],
            skills_required: [
                { skill_id: skills.find(s => s.name === 'aws')._id, proficiency_level: 4, is_required: true },
                { skill_id: skills.find(s => s.name === 'docker')._id, proficiency_level: 4, is_required: true },
                { skill_id: skills.find(s => s.name === 'kubernetes')._id, proficiency_level: 3, is_required: true }
            ],
            years_of_experience_min: 3,
            status: 'active',
            published_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
    ];

    try {
        // Update active jobs count for each job
        for (const job of jobs) {
            job.active_jobs = 1;
        }
        
        const createdJobs = await Job.insertMany(jobs);
        
        // Update company active jobs count
        for (const company of companies) {
            const jobCount = createdJobs.filter(j => j.company_id.toString() === company._id.toString()).length;
            await Company.findByIdAndUpdate(company._id, { active_jobs: jobCount });
        }
        
        console.log(`Created ${createdJobs.length} jobs`);
        return createdJobs;
    } catch (error) {
        console.error('Error seeding jobs:', error);
        return [];
    }
};

const seedDatabase = async () => {
    try {
        await connectDB();
        
        console.log('Starting database seeding...');
        
        // Clear existing data
        await clearDatabase();
        
        // Seed data in order
        const skills = await seedSkills();
        const users = await seedUsers();
        const companies = await seedCompanies(users);
        const candidateProfiles = await seedCandidateProfiles(users, skills);
        const jobs = await seedJobs(companies, users, skills);
        
        console.log('\nDatabase seeding completed successfully!');
        console.log('\nTest credentials:');
        console.log('Candidate: john.doe@example.com / password123');
        console.log('Employer: alice.williams@techcorp.com / password123');
        console.log('Admin: admin@recruitment.com / admin123');
        console.log('Superadmin: superadmin@recruitment.com / superadmin123');
        
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

// Run the seeding
seedDatabase();