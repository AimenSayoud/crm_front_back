const createError = require('http-errors');
const { Company, Job } = require('../models/mongodb');

class CompaniesController {
    // Get all companies with filtering
    async getAllCompanies(req, res, next) {
        try {
            const {
                search,
                industry,
                company_size,
                location,
                is_verified,
                is_premium,
                status,
                sort_by = 'created_at',
                sort_order = 'desc',
                page = 1,
                page_size = 10
            } = req.query;

            // Build query
            let query = {};

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { industry: { $regex: search, $options: 'i' } }
                ];
            }

            if (industry) query.industry = industry;
            if (company_size) query.company_size = company_size;
            if (location) query.location = { $regex: location, $options: 'i' };
            if (is_verified !== undefined) query.is_verified = is_verified === 'true';
            if (is_premium !== undefined) query.is_premium = is_premium === 'true';
            if (status) query.status = status;

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(page_size);
            const limit = parseInt(page_size);

            // Sort
            const sortOptions = {};
            sortOptions[sort_by] = sort_order === 'asc' ? 1 : -1;

            // Execute query
            const [companies, total] = await Promise.all([
                Company.find(query)
                    .skip(skip)
                    .limit(limit)
                    .sort(sortOptions),
                Company.countDocuments(query)
            ]);

            res.json({
                companies,
                total,
                page: parseInt(page),
                page_size: parseInt(page_size),
                total_pages: Math.ceil(total / parseInt(page_size))
            });
        } catch (error) {
            next(error);
        }
    }

    // Get company by ID
    async getCompanyById(req, res, next) {
        try {
            const company = await Company.findById(req.params.id)
                .populate('created_by', 'firstName lastName email');

            if (!company) {
                throw createError.NotFound('Company not found');
            }

            res.json(company);
        } catch (error) {
            next(error);
        }
    }

    // Get company jobs
    async getCompanyJobs(req, res, next) {
        try {
            const { status = 'active', page = 1, page_size = 10 } = req.query;

            const skip = (parseInt(page) - 1) * parseInt(page_size);
            const limit = parseInt(page_size);

            const query = { company_id: req.params.id };
            if (status !== 'all') {
                query.status = status;
            }

            const [jobs, total] = await Promise.all([
                Job.find(query)
                    .populate('skills_required.skill_id')
                    .skip(skip)
                    .limit(limit)
                    .sort('-published_at'),
                Job.countDocuments(query)
            ]);

            res.json({
                jobs,
                total,
                page: parseInt(page),
                page_size: parseInt(page_size),
                total_pages: Math.ceil(total / parseInt(page_size))
            });
        } catch (error) {
            next(error);
        }
    }

    // Create company
    async createCompany(req, res, next) {
        try {
            const company = new Company({
                ...req.body,
                created_by: req.user._id,
                updated_by: req.user._id
            });

            await company.save();
            res.status(201).json(company);
        } catch (error) {
            if (error.code === 11000) {
                next(createError.Conflict('Company name already exists'));
            } else {
                next(error);
            }
        }
    }

    // Update company
    async updateCompany(req, res, next) {
        try {
            // Check if user has permission to update
            const company = await Company.findById(req.params.id);
            if (!company) {
                throw createError.NotFound('Company not found');
            }

            if (req.user.role !== 'admin' && company.created_by.toString() !== req.user._id.toString()) {
                throw createError.Forbidden('You do not have permission to update this company');
            }

            const updatedCompany = await Company.findByIdAndUpdate(
                req.params.id,
                {
                    ...req.body,
                    updated_by: req.user._id
                },
                { new: true, runValidators: true }
            );

            res.json(updatedCompany);
        } catch (error) {
            next(error);
        }
    }

    // Delete company
    async deleteCompany(req, res, next) {
        try {
            const company = await Company.findById(req.params.id);
            if (!company) {
                throw createError.NotFound('Company not found');
            }

            // Check if company has active jobs
            const activeJobs = await Job.countDocuments({ 
                company_id: req.params.id, 
                status: 'active' 
            });

            if (activeJobs > 0) {
                throw createError.BadRequest('Cannot delete company with active jobs');
            }

            await Company.findByIdAndDelete(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    // Verify company (admin only)
    async verifyCompany(req, res, next) {
        try {
            const company = await Company.findByIdAndUpdate(
                req.params.id,
                {
                    is_verified: true,
                    updated_by: req.user._id
                },
                { new: true }
            );

            if (!company) {
                throw createError.NotFound('Company not found');
            }

            res.json(company);
        } catch (error) {
            next(error);
        }
    }

    // Add contact
    async addContact(req, res, next) {
        try {
            const company = await Company.findById(req.params.id);
            if (!company) {
                throw createError.NotFound('Company not found');
            }

            // Check permission
            if (req.user.role !== 'admin' && company.created_by.toString() !== req.user._id.toString()) {
                throw createError.Forbidden('You do not have permission to add contacts to this company');
            }

            // If this is marked as primary, unset other primary contacts
            if (req.body.is_primary) {
                company.contacts.forEach(contact => {
                    contact.is_primary = false;
                });
            }

            company.contacts.push(req.body);
            await company.save();

            res.json(company);
        } catch (error) {
            next(error);
        }
    }

    // Update contact
    async updateContact(req, res, next) {
        try {
            const company = await Company.findById(req.params.id);
            if (!company) {
                throw createError.NotFound('Company not found');
            }

            // Check permission
            if (req.user.role !== 'admin' && company.created_by.toString() !== req.user._id.toString()) {
                throw createError.Forbidden('You do not have permission to update contacts');
            }

            const contact = company.contacts.id(req.params.contactId);
            if (!contact) {
                throw createError.NotFound('Contact not found');
            }

            // If this is marked as primary, unset other primary contacts
            if (req.body.is_primary && !contact.is_primary) {
                company.contacts.forEach(c => {
                    c.is_primary = false;
                });
            }

            Object.assign(contact, req.body);
            await company.save();

            res.json(company);
        } catch (error) {
            next(error);
        }
    }

    // Delete contact
    async deleteContact(req, res, next) {
        try {
            const company = await Company.findById(req.params.id);
            if (!company) {
                throw createError.NotFound('Company not found');
            }

            // Check permission
            if (req.user.role !== 'admin' && company.created_by.toString() !== req.user._id.toString()) {
                throw createError.Forbidden('You do not have permission to delete contacts');
            }

            company.contacts.pull(req.params.contactId);
            await company.save();

            res.json(company);
        } catch (error) {
            next(error);
        }
    }

    // Get company analytics
    async getCompanyAnalytics(req, res, next) {
        try {
            const company = await Company.findById(req.params.id);
            if (!company) {
                throw createError.NotFound('Company not found');
            }

            // Check permission
            if (req.user.role !== 'admin' && company.created_by.toString() !== req.user._id.toString()) {
                throw createError.Forbidden('You do not have permission to view analytics');
            }

            // Get job statistics
            const [totalJobs, activeJobs, applications] = await Promise.all([
                Job.countDocuments({ company_id: req.params.id }),
                Job.countDocuments({ company_id: req.params.id, status: 'active' }),
                Job.aggregate([
                    { $match: { company_id: company._id } },
                    { $group: { _id: null, total_applications: { $sum: '$applications_count' } } }
                ])
            ]);

            const totalApplications = applications[0]?.total_applications || 0;

            res.json({
                company_id: company._id,
                total_jobs: totalJobs,
                active_jobs: activeJobs,
                total_applications: totalApplications,
                average_applications_per_job: totalJobs > 0 ? (totalApplications / totalJobs).toFixed(2) : 0
            });
        } catch (error) {
            next(error);
        }
    }

    // Get company stats
    async getCompanyStats(req, res, next) {
        try {
            const company = await Company.findById(req.params.id);
            if (!company) {
                throw createError.NotFound('Company not found');
            }

            // Check permission
            if (req.user.role !== 'admin' && company.created_by.toString() !== req.user._id.toString()) {
                throw createError.Forbidden('You do not have permission to view stats');
            }

            // Get detailed statistics
            const jobs = await Job.find({ company_id: req.params.id });
            
            const stats = {
                total_jobs: jobs.length,
                active_jobs: jobs.filter(j => j.status === 'active').length,
                filled_jobs: jobs.filter(j => j.status === 'filled').length,
                total_applications: jobs.reduce((sum, job) => sum + job.applications_count, 0),
                average_time_to_fill: 0, // This would require tracking filled_at dates
                job_posting_trend: {},
                application_trend: {}
            };

            // Group jobs by month for trend data
            const monthlyJobs = {};
            jobs.forEach(job => {
                if (job.published_at) {
                    const month = job.published_at.toISOString().substring(0, 7);
                    monthlyJobs[month] = (monthlyJobs[month] || 0) + 1;
                }
            });
            stats.job_posting_trend = monthlyJobs;

            res.json(stats);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CompaniesController();