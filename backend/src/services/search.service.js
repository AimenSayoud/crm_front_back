const { User, CandidateProfile, Company, Job, Application, Skill } = require('../models/sql');
const { createResponse, createError } = require('../utils/response');
const logger = require('../utils/logger');

class SearchService {
    constructor() {
        this.entityTypes = ['candidates', 'companies', 'jobs', 'applications'];
        this.jobTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
        this.experienceLevels = ['Entry', 'Junior', 'Mid', 'Senior', 'Lead', 'Principal', 'Executive'];
        this.companySizes = ['Startup (1-10)', 'Small (11-50)', 'Medium (51-200)', 'Large (201-1000)', 'Enterprise (1000+)'];
        this.salaryRanges = [
            { min: 0, max: 50000, label: 'Under $50K' },
            { min: 50000, max: 75000, label: '$50K - $75K' },
            { min: 75000, max: 100000, label: '$75K - $100K' },
            { min: 100000, max: 150000, label: '$100K - $150K' },
            { min: 150000, max: 200000, label: '$150K - $200K' },
            { min: 200000, max: null, label: '$200K+' }
        ];
    }

    async globalSearch(db, filters, currentUser, limit = 20, offset = 0) {
        try {
            const startTime = Date.now();
            const results = [];
            const entityTypes = filters.entity_types || this.entityTypes;

            // Search candidates
            if (entityTypes.includes('candidates')) {
                const candidateResults = await this.searchCandidates(
                    db,
                    filters.query,
                    filters.location,
                    filters.skills,
                    filters.experience_level,
                    Math.floor(limit / entityTypes.length),
                    Math.floor(offset / entityTypes.length)
                );

                for (const candidate of candidateResults.candidates || []) {
                    results.push({
                        id: candidate.id,
                        type: 'candidate',
                        title: `${candidate.first_name || ''} ${candidate.last_name || ''}`,
                        description: candidate.professional_summary,
                        score: candidate.relevance_score || 0.5,
                        metadata: {
                            location: candidate.location,
                            experience_years: candidate.experience_years,
                            skills: (candidate.skills || []).slice(0, 5) // Top 5 skills
                        }
                    });
                }
            }

            // Search companies
            if (entityTypes.includes('companies')) {
                const companyResults = await this.searchCompanies(
                    db,
                    filters.query,
                    filters.location,
                    filters.company_size,
                    Math.floor(limit / entityTypes.length),
                    Math.floor(offset / entityTypes.length)
                );

                for (const company of companyResults.companies || []) {
                    results.push({
                        id: company.id,
                        type: 'company',
                        title: company.name || '',
                        description: company.description,
                        score: company.relevance_score || 0.5,
                        metadata: {
                            industry: company.industry,
                            size: company.size,
                            location: company.location,
                            active_jobs: company.active_jobs_count || 0
                        }
                    });
                }
            }

            // Search jobs
            if (entityTypes.includes('jobs')) {
                const jobResults = await this.searchJobs(
                    db,
                    filters.query,
                    filters.location,
                    filters.skills,
                    filters.job_type,
                    filters.salary_min,
                    filters.salary_max,
                    Math.floor(limit / entityTypes.length),
                    Math.floor(offset / entityTypes.length)
                );

                for (const job of jobResults.jobs || []) {
                    results.push({
                        id: job.id,
                        type: 'job',
                        title: job.title || '',
                        description: job.description,
                        score: job.relevance_score || 0.5,
                        metadata: {
                            company_name: job.company_name,
                            location: job.location,
                            job_type: job.job_type,
                            salary_range: `${job.salary_min || 0}-${job.salary_max || 0}`,
                            required_skills: (job.required_skills || []).slice(0, 5)
                        }
                    });
                }
            }

            // Search applications (for recruiters/admins)
            if (entityTypes.includes('applications') &&
                ['recruiter', 'admin', 'superadmin'].includes(currentUser.role)) {
                const applicationResults = await this.searchApplications(
                    db,
                    filters.query,
                    filters.date_from,
                    filters.date_to,
                    Math.floor(limit / entityTypes.length),
                    Math.floor(offset / entityTypes.length)
                );

                for (const application of applicationResults.applications || []) {
                    results.push({
                        id: application.id,
                        type: 'application',
                        title: `Application: ${application.candidate_name || ''} -> ${application.job_title || ''}`,
                        description: `Status: ${application.status || ''}`,
                        score: application.relevance_score || 0.5,
                        metadata: {
                            candidate_name: application.candidate_name,
                            job_title: application.job_title,
                            company_name: application.company_name,
                            status: application.status,
                            applied_date: application.applied_date
                        }
                    });
                }
            }

            // Sort by relevance score
            results.sort((a, b) => b.score - a.score);

            // Apply pagination
            const paginatedResults = results.slice(offset, offset + limit);

            const tookMs = Date.now() - startTime;

            return {
                results: paginatedResults,
                total_count: results.length,
                query: filters.query,
                took_ms: tookMs
            };
        } catch (error) {
            logger.error('Error in global search:', error);
            throw error;
        }
    }

    async getSearchSuggestions(db, query, limit = 10) {
        try {
            const suggestions = [];

            // Get skill suggestions
            const skillSuggestions = await this.getSkillSuggestions(db, query, Math.floor(limit / 2));
            suggestions.push(...skillSuggestions);

            // Get company name suggestions
            const companySuggestions = await this.getCompanyNameSuggestions(db, query, Math.floor(limit / 2));
            suggestions.push(...companySuggestions);

            // Get job title suggestions
            const jobSuggestions = await this.getJobTitleSuggestions(db, query, Math.floor(limit / 2));
            suggestions.push(...jobSuggestions);

            // Remove duplicates and limit
            const uniqueSuggestions = [...new Set(suggestions)].slice(0, limit);

            return uniqueSuggestions;
        } catch (error) {
            logger.error('Error getting search suggestions:', error);
            throw error;
        }
    }

    async getTrendingSearches(db) {
        try {
            // This would typically come from search analytics
            // For now, returning mock trending data
            return {
                trending_skills: [
                    'Python', 'React', 'AWS', 'Machine Learning', 'DevOps',
                    'TypeScript', 'Kubernetes', 'Data Science', 'Node.js', 'Java'
                ],
                trending_locations: [
                    'Remote', 'San Francisco', 'New York', 'London', 'Berlin',
                    'Toronto', 'Austin', 'Seattle', 'Boston', 'Amsterdam'
                ],
                trending_job_types: [
                    'Full-time', 'Remote', 'Contract', 'Part-time', 'Freelance'
                ],
                popular_searches: [
                    'Senior Software Engineer', 'Frontend Developer', 'Data Scientist',
                    'Product Manager', 'DevOps Engineer', 'UX Designer', 'Full Stack Developer'
                ]
            };
        } catch (error) {
            logger.error('Error getting trending searches:', error);
            throw error;
        }
    }

    async advancedSearch(db, filters, query = '', currentUser, limit = 20, offset = 0, sortBy = 'relevance', sortOrder = 'desc') {
        try {
            const startTime = Date.now();
            const results = [];
            const entityTypes = filters.entity_types || ['candidates', 'companies', 'jobs'];

            // Advanced candidate search
            if (entityTypes.includes('candidates')) {
                const candidateResults = await this.advancedSearchCandidates(
                    db,
                    query,
                    filters,
                    limit,
                    offset,
                    sortBy,
                    sortOrder
                );

                for (const candidate of candidateResults.candidates || []) {
                    results.push({
                        id: candidate.id,
                        type: 'candidate',
                        title: `${candidate.first_name || ''} ${candidate.last_name || ''}`,
                        description: candidate.professional_summary,
                        score: candidate.relevance_score || 0.5,
                        metadata: {
                            location: candidate.location,
                            experience_years: candidate.experience_years,
                            skills: candidate.skills || [],
                            availability: candidate.availability,
                            salary_expectation: candidate.salary_expectation
                        }
                    });
                }
            }

            // Advanced company search
            if (entityTypes.includes('companies')) {
                const companyResults = await this.advancedSearchCompanies(
                    db,
                    query,
                    filters,
                    limit,
                    offset,
                    sortBy,
                    sortOrder
                );

                for (const company of companyResults.companies || []) {
                    results.push({
                        id: company.id,
                        type: 'company',
                        title: company.name || '',
                        description: company.description,
                        score: company.relevance_score || 0.5,
                        metadata: {
                            industry: company.industry,
                            size: company.size,
                            location: company.location,
                            founded_year: company.founded_year,
                            active_jobs: company.active_jobs_count || 0
                        }
                    });
                }
            }

            // Advanced job search
            if (entityTypes.includes('jobs')) {
                const jobResults = await this.advancedSearchJobs(
                    db,
                    query,
                    filters,
                    limit,
                    offset,
                    sortBy,
                    sortOrder
                );

                for (const job of jobResults.jobs || []) {
                    results.push({
                        id: job.id,
                        type: 'job',
                        title: job.title || '',
                        description: job.description,
                        score: job.relevance_score || 0.5,
                        metadata: {
                            company_name: job.company_name,
                            location: job.location,
                            job_type: job.job_type,
                            experience_level: job.experience_level,
                            salary_min: job.salary_min,
                            salary_max: job.salary_max,
                            required_skills: job.required_skills || [],
                            posted_date: job.posted_date
                        }
                    });
                }
            }

            // Apply sorting
            if (sortBy === 'relevance') {
                results.sort((a, b) => sortOrder === 'desc' ? b.score - a.score : a.score - b.score);
            } else if (sortBy === 'name') {
                results.sort((a, b) => {
                    const comparison = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
                    return sortOrder === 'desc' ? -comparison : comparison;
                });
            } else if (sortBy === 'date') {
                results.sort((a, b) => {
                    const dateA = new Date(a.metadata.posted_date || 0);
                    const dateB = new Date(b.metadata.posted_date || 0);
                    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
                });
            }

            const tookMs = Date.now() - startTime;

            return {
                results: results,
                total_count: results.length,
                query: query || '',
                took_ms: tookMs
            };
        } catch (error) {
            logger.error('Error in advanced search:', error);
            throw error;
        }
    }

    async getSearchFilters(db) {
        try {
            return {
                skills: await this.getAllSkills(db),
                locations: await this.getAllLocations(db),
                industries: await this.getAllIndustries(db),
                job_types: this.jobTypes,
                experience_levels: this.experienceLevels,
                company_sizes: this.companySizes,
                salary_ranges: this.salaryRanges
            };
        } catch (error) {
            logger.error('Error getting search filters:', error);
            throw error;
        }
    }

    // Helper methods for candidate search
    async searchCandidates(db, query, location, skills, experienceLevel, limit, offset) {
        try {
            const searchQuery = {};

            if (query) {
                searchQuery.$or = [
                    { first_name: { $regex: query, $options: 'i' } },
                    { last_name: { $regex: query, $options: 'i' } },
                    { professional_summary: { $regex: query, $options: 'i' } }
                ];
            }

            if (location) {
                searchQuery.location = { $regex: location, $options: 'i' };
            }

            if (skills && skills.length > 0) {
                searchQuery['skills.name'] = { $in: skills };
            }

            if (experienceLevel) {
                searchQuery.experience_level = experienceLevel;
            }

            const candidates = await CandidateProfile.find(searchQuery)
                .populate('user', 'first_name last_name email')
                .populate('skills', 'name level')
                .limit(limit)
                .skip(offset)
                .lean();

            return {
                candidates: candidates.map(candidate => ({
                    ...candidate,
                    relevance_score: this.calculateRelevanceScore(candidate, query)
                }))
            };
        } catch (error) {
            logger.error('Error searching candidates:', error);
            return { candidates: [] };
        }
    }

    async advancedSearchCandidates(db, query, filters, limit, offset, sortBy, sortOrder) {
        try {
            // Advanced candidate search implementation
            // This would include more sophisticated filtering and scoring
            return await this.searchCandidates(db, query, filters.location, filters.skills, filters.experience_level, limit, offset);
        } catch (error) {
            logger.error('Error in advanced candidate search:', error);
            return { candidates: [] };
        }
    }

    // Helper methods for company search
    async searchCompanies(db, query, location, companySize, limit, offset) {
        try {
            const searchQuery = {};

            if (query) {
                searchQuery.$or = [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                    { industry: { $regex: query, $options: 'i' } }
                ];
            }

            if (location) {
                searchQuery.location = { $regex: location, $options: 'i' };
            }

            if (companySize) {
                searchQuery.size = companySize;
            }

            const companies = await Company.find(searchQuery)
                .populate('employer_profile')
                .limit(limit)
                .skip(offset)
                .lean();

            return {
                companies: companies.map(company => ({
                    ...company,
                    relevance_score: this.calculateRelevanceScore(company, query)
                }))
            };
        } catch (error) {
            logger.error('Error searching companies:', error);
            return { companies: [] };
        }
    }

    async advancedSearchCompanies(db, query, filters, limit, offset, sortBy, sortOrder) {
        try {
            const searchQuery = {};

            if (query) {
                searchQuery.$or = [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } },
                    { industry: { $regex: query, $options: 'i' } }
                ];
            }

            if (filters.location) {
                searchQuery.location = { $regex: filters.location, $options: 'i' };
            }

            if (filters.company_size) {
                searchQuery.size = filters.company_size;
            }

            if (filters.industry) {
                searchQuery.industry = { $regex: filters.industry, $options: 'i' };
            }

            let sortOptions = {};
            if (sortBy === 'name') {
                sortOptions.name = sortOrder === 'desc' ? -1 : 1;
            } else if (sortBy === 'founded_year') {
                sortOptions.founded_year = sortOrder === 'desc' ? -1 : 1;
            }

            const companies = await Company.find(searchQuery)
                .populate('employer_profile')
                .sort(sortOptions)
                .limit(limit)
                .skip(offset)
                .lean();

            return {
                companies: companies.map(company => ({
                    ...company,
                    relevance_score: this.calculateRelevanceScore(company, query)
                }))
            };
        } catch (error) {
            logger.error('Error in advanced company search:', error);
            return { companies: [] };
        }
    }

    // Helper methods for job search
    async searchJobs(db, query, location, skills, jobType, salaryMin, salaryMax, limit, offset) {
        try {
            const searchQuery = {};

            if (query) {
                searchQuery.$or = [
                    { title: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ];
            }

            if (location) {
                searchQuery.location = { $regex: location, $options: 'i' };
            }

            if (skills && skills.length > 0) {
                searchQuery['required_skills.name'] = { $in: skills };
            }

            if (jobType) {
                searchQuery.job_type = jobType;
            }

            if (salaryMin || salaryMax) {
                searchQuery.salary_min = {};
                if (salaryMin) searchQuery.salary_min.$gte = salaryMin;
                if (salaryMax) searchQuery.salary_min.$lte = salaryMax;
            }

            const jobs = await Job.find(searchQuery)
                .populate('company', 'name industry')
                .populate('required_skills', 'name level')
                .limit(limit)
                .skip(offset)
                .lean();

            return {
                jobs: jobs.map(job => ({
                    ...job,
                    relevance_score: this.calculateRelevanceScore(job, query)
                }))
            };
        } catch (error) {
            logger.error('Error searching jobs:', error);
            return { jobs: [] };
        }
    }

    async advancedSearchJobs(db, query, filters, limit, offset, sortBy, sortOrder) {
        try {
            // Advanced job search implementation
            // This would include more sophisticated filtering and scoring
            return await this.searchJobs(db, query, filters.location, filters.skills, filters.job_type, filters.salary_min, filters.salary_max, limit, offset);
        } catch (error) {
            logger.error('Error in advanced job search:', error);
            return { jobs: [] };
        }
    }

    // Helper methods for application search
    async searchApplications(db, query, dateFrom, dateTo, limit, offset) {
        try {
            const searchQuery = {};

            if (query) {
                searchQuery.$or = [
                    { 'candidate.first_name': { $regex: query, $options: 'i' } },
                    { 'candidate.last_name': { $regex: query, $options: 'i' } },
                    { 'job.title': { $regex: query, $options: 'i' } }
                ];
            }

            if (dateFrom || dateTo) {
                searchQuery.applied_date = {};
                if (dateFrom) searchQuery.applied_date.$gte = new Date(dateFrom);
                if (dateTo) searchQuery.applied_date.$lte = new Date(dateTo);
            }

            const applications = await Application.find(searchQuery)
                .populate('candidate', 'first_name last_name')
                .populate('job', 'title company')
                .populate('company', 'name')
                .limit(limit)
                .skip(offset)
                .lean();

            return {
                applications: applications.map(application => ({
                    ...application,
                    relevance_score: this.calculateRelevanceScore(application, query)
                }))
            };
        } catch (error) {
            logger.error('Error searching applications:', error);
            return { applications: [] };
        }
    }

    // Suggestion methods
    async getSkillSuggestions(db, query, limit) {
        try {
            const skills = await Skill.find({
                name: { $regex: query, $options: 'i' }
            })
                .limit(limit)
                .select('name')
                .lean();

            return skills.map(skill => skill.name);
        } catch (error) {
            logger.error('Error getting skill suggestions:', error);
            return [];
        }
    }

    async getCompanyNameSuggestions(db, query, limit) {
        try {
            const companies = await Company.find({
                name: { $regex: query, $options: 'i' }
            })
                .limit(limit)
                .select('name')
                .lean();

            return companies.map(company => company.name);
        } catch (error) {
            logger.error('Error getting company name suggestions:', error);
            return [];
        }
    }

    async getJobTitleSuggestions(db, query, limit) {
        try {
            const jobs = await Job.find({
                title: { $regex: query, $options: 'i' }
            })
                .limit(limit)
                .select('title')
                .lean();

            return jobs.map(job => job.title);
        } catch (error) {
            logger.error('Error getting job title suggestions:', error);
            return [];
        }
    }

    // Filter methods
    async getAllSkills(db) {
        try {
            const skills = await Skill.find({})
                .select('name')
                .lean();

            return skills.map(skill => skill.name);
        } catch (error) {
            logger.error('Error getting all skills:', error);
            return [];
        }
    }

    async getAllLocations(db) {
        try {
            const locations = await Company.distinct('location');
            return locations.filter(location => location); // Remove null/undefined values
        } catch (error) {
            logger.error('Error getting all locations:', error);
            return [];
        }
    }

    async getAllIndustries(db) {
        try {
            const industries = await Company.distinct('industry');
            return industries.filter(industry => industry); // Remove null/undefined values
        } catch (error) {
            logger.error('Error getting all industries:', error);
            return [];
        }
    }

    // Utility methods
    calculateRelevanceScore(item, query) {
        if (!query) return 0.5;

        let score = 0;
        const queryLower = query.toLowerCase();

        // Check title/name matches
        if (item.title && item.title.toLowerCase().includes(queryLower)) {
            score += 0.4;
        }
        if (item.name && item.name.toLowerCase().includes(queryLower)) {
            score += 0.4;
        }
        if (item.first_name && item.first_name.toLowerCase().includes(queryLower)) {
            score += 0.3;
        }
        if (item.last_name && item.last_name.toLowerCase().includes(queryLower)) {
            score += 0.3;
        }

        // Check description matches
        if (item.description && item.description.toLowerCase().includes(queryLower)) {
            score += 0.2;
        }
        if (item.professional_summary && item.professional_summary.toLowerCase().includes(queryLower)) {
            score += 0.2;
        }

        // Check skills matches
        if (item.skills && Array.isArray(item.skills)) {
            const skillMatches = item.skills.filter(skill =>
                skill.name && skill.name.toLowerCase().includes(queryLower)
            ).length;
            score += skillMatches * 0.1;
        }

        // Check required skills matches
        if (item.required_skills && Array.isArray(item.required_skills)) {
            const skillMatches = item.required_skills.filter(skill =>
                skill.name && skill.name.toLowerCase().includes(queryLower)
            ).length;
            score += skillMatches * 0.1;
        }

        return Math.min(score, 1.0); // Cap at 1.0
    }
}

module.exports = new SearchService(); 