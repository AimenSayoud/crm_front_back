const mongoose = require('mongoose');
const Application = require('../models/sql/application.model');
const Job = require('../models/sql/job.model');
const CandidateProfile = require('../models/sql/candidate.model');
const Company = require('../models/sql/company.model');
const ConsultantProfile = require('../models/sql/consultant.model');
const User = require('../models/sql/user.model');
const Skill = require('../models/sql/skill.model');
const Message = require('../models/mongodb/message.model');
const Conversation = require('../models/mongodb/conversation.model');
const logger = require('../utils/logger');
const { AppError } = require('../utils/appError');

class AnalyticsService {
    constructor() {
        this.logger = logger;
    }

    // ============== DASHBOARD OVERVIEW ==============

    async getDashboardOverview(dateRange = null) {
        try {
            let startDate, endDate;

            if (dateRange) {
                startDate = dateRange.start_date;
                endDate = dateRange.end_date;
            } else {
                // Default to last 30 days
                endDate = new Date();
                startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000));
            }

            // Basic counts
            const totalUsers = await User.countDocuments();
            const totalCandidates = await CandidateProfile.countDocuments();
            const totalCompanies = await Company.countDocuments();
            const totalJobs = await Job.countDocuments();
            const totalApplications = await Application.countDocuments();

            // Active metrics (within date range)
            const activeJobs = await Job.countDocuments({
                status: 'open',
                created_at: { $gte: startDate, $lte: endDate }
            });

            const newApplications = await Application.countDocuments({
                applied_at: { $gte: startDate, $lte: endDate }
            });

            // Success metrics
            const hiredApplications = await Application.countDocuments({
                status: 'hired',
                last_updated: { $gte: startDate, $lte: endDate }
            });

            // Growth metrics (compare to previous period)
            const periodDuration = endDate.getTime() - startDate.getTime();
            const prevStart = new Date(startDate.getTime() - periodDuration);
            const prevEnd = startDate;

            const prevApplications = await Application.countDocuments({
                applied_at: { $gte: prevStart, $lte: prevEnd }
            });

            const applicationGrowth = prevApplications > 0
                ? ((newApplications - prevApplications) / prevApplications * 100)
                : 0;

            const conversionRates = await this.getConversionRates(startDate, endDate);

            return {
                overview: {
                    total_users: totalUsers,
                    total_candidates: totalCandidates,
                    total_companies: totalCompanies,
                    total_jobs: totalJobs,
                    total_applications: totalApplications
                },
                active_metrics: {
                    active_jobs: activeJobs,
                    new_applications: newApplications,
                    hired_count: hiredApplications,
                    application_growth_percent: Math.round(applicationGrowth * 100) / 100
                },
                conversion_rates: conversionRates,
                period: {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString()
                }
            };
        } catch (error) {
            this.logger.error('Error in getDashboardOverview:', error);
            throw new AppError('Failed to generate dashboard overview', 500);
        }
    }

    // ============== APPLICATION ANALYTICS ==============

    async getApplicationAnalytics(filters = {}) {
        try {
            const { company_id, job_id, consultant_id, date_range } = filters;

            let query = {};

            // Apply filters
            if (company_id) {
                const jobIds = await Job.find({ company_id }).distinct('_id');
                query.job_id = { $in: jobIds };
            }
            if (job_id) {
                query.job_id = job_id;
            }
            if (consultant_id) {
                query.consultant_id = consultant_id;
            }
            if (date_range) {
                query.applied_at = {
                    $gte: date_range.start_date,
                    $lte: date_range.end_date
                };
            }

            const applications = await Application.find(query)
                .populate('job_id')
                .populate('candidate_id')
                .lean();

            if (!applications.length) {
                return this._emptyApplicationAnalytics();
            }

            // Status distribution
            const statusCounts = {};
            applications.forEach(app => {
                statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
            });

            // Time-to-hire analysis
            const hiredApps = applications.filter(app => app.status === 'hired');
            const timeToHireDays = [];

            hiredApps.forEach(app => {
                if (app.last_updated) {
                    const days = Math.floor((new Date(app.last_updated) - new Date(app.applied_at)) / (1000 * 60 * 60 * 24));
                    timeToHireDays.push(days);
                }
            });

            const avgTimeToHire = timeToHireDays.length > 0
                ? timeToHireDays.reduce((sum, days) => sum + days, 0) / timeToHireDays.length
                : 0;

            // Applications by month
            const monthlyData = this._groupByMonth(applications, 'applied_at');

            // Source analysis
            const sourceData = this._analyzeApplicationSources(applications);

            return {
                total_applications: applications.length,
                status_distribution: statusCounts,
                conversion_rates: {
                    application_to_interview: this._calculateConversionRate(
                        applications, 'submitted', ['interviewed', 'offered', 'hired']
                    ),
                    interview_to_offer: this._calculateConversionRate(
                        applications, 'interviewed', ['offered', 'hired']
                    ),
                    offer_to_hire: this._calculateConversionRate(
                        applications, 'offered', ['hired']
                    )
                },
                time_metrics: {
                    average_time_to_hire_days: Math.round(avgTimeToHire * 10) / 10,
                    applications_this_month: monthlyData[new Date().toISOString().slice(0, 7)] || 0
                },
                monthly_trends: monthlyData,
                source_analysis: sourceData
            };
        } catch (error) {
            this.logger.error('Error in getApplicationAnalytics:', error);
            throw new AppError('Failed to generate application analytics', 500);
        }
    }

    // ============== JOB ANALYTICS ==============

    async getJobAnalytics(filters = {}) {
        try {
            const { company_id, date_range } = filters;

            let query = {};

            if (company_id) {
                query.company_id = company_id;
            }
            if (date_range) {
                query.created_at = {
                    $gte: date_range.start_date,
                    $lte: date_range.end_date
                };
            }

            const jobs = await Job.find(query)
                .populate('company_id')
                .lean();

            // Job status distribution
            const statusCounts = {};
            jobs.forEach(job => {
                statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
            });

            // Applications per job
            const jobApplicationCounts = [];
            for (const job of jobs) {
                const appCount = await Application.countDocuments({ job_id: job._id });
                jobApplicationCounts.push({
                    job_id: job._id.toString(),
                    job_title: job.title,
                    application_count: appCount,
                    created_at: job.created_at.toISOString(),
                    status: job.status
                });
            }

            // Sort by application count
            jobApplicationCounts.sort((a, b) => b.application_count - a.application_count);

            // Time to fill analysis
            const filledJobs = jobs.filter(job => job.status === 'filled');
            const timeToFillDays = [];

            filledJobs.forEach(job => {
                if (job.updated_at) {
                    const days = Math.floor((new Date(job.updated_at) - new Date(job.created_at)) / (1000 * 60 * 60 * 24));
                    timeToFillDays.push(days);
                }
            });

            const avgTimeToFill = timeToFillDays.length > 0
                ? timeToFillDays.reduce((sum, days) => sum + days, 0) / timeToFillDays.length
                : 0;

            // Skills demand analysis
            const skillsDemand = await this._analyzeSkillsDemand(jobs);

            return {
                total_jobs: jobs.length,
                status_distribution: statusCounts,
                performance_metrics: {
                    average_applications_per_job: jobs.length > 0
                        ? jobApplicationCounts.reduce((sum, job) => sum + job.application_count, 0) / jobs.length
                        : 0,
                    average_time_to_fill_days: Math.round(avgTimeToFill * 10) / 10,
                    fill_rate: jobs.length > 0 ? (filledJobs.length / jobs.length * 100) : 0
                },
                top_performing_jobs: jobApplicationCounts.slice(0, 10),
                skills_in_demand: skillsDemand,
                monthly_job_postings: this._groupByMonth(jobs, 'created_at')
            };
        } catch (error) {
            this.logger.error('Error in getJobAnalytics:', error);
            throw new AppError('Failed to generate job analytics', 500);
        }
    }

    // ============== CANDIDATE ANALYTICS ==============

    async getCandidateAnalytics(filters = {}) {
        try {
            const { consultant_id, date_range } = filters;

            let query = {};

            if (date_range) {
                query.created_at = {
                    $gte: date_range.start_date,
                    $lte: date_range.end_date
                };
            }

            const candidates = await CandidateProfile.find(query)
                .populate('user_id')
                .lean();

            // Profile completion analysis
            const completedProfiles = candidates.filter(c => c.profile_completed).length;
            const completionRate = candidates.length > 0 ? (completedProfiles / candidates.length * 100) : 0;

            // Experience distribution
            const experienceDistribution = {
                '0-2 years': 0,
                '3-5 years': 0,
                '6-10 years': 0,
                '10+ years': 0
            };

            candidates.forEach(candidate => {
                const years = candidate.years_of_experience || 0;
                if (years <= 2) {
                    experienceDistribution['0-2 years']++;
                } else if (years <= 5) {
                    experienceDistribution['3-5 years']++;
                } else if (years <= 10) {
                    experienceDistribution['6-10 years']++;
                } else {
                    experienceDistribution['10+ years']++;
                }
            });

            // Location distribution
            const locationCounts = {};
            candidates.forEach(candidate => {
                const location = candidate.city || 'Unknown';
                locationCounts[location] = (locationCounts[location] || 0) + 1;
            });

            // Top skills analysis
            const topSkills = await this._analyzeCandidateSkills(candidates);

            // Application success rates by candidate
            const candidateSuccessMetrics = await this._analyzeCandidateSuccessRates(candidates);

            return {
                total_candidates: candidates.length,
                profile_completion_rate: Math.round(completionRate * 10) / 10,
                experience_distribution: experienceDistribution,
                location_distribution: Object.fromEntries(
                    Object.entries(locationCounts)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                ),
                top_skills: topSkills,
                success_metrics: candidateSuccessMetrics,
                monthly_registrations: this._groupByMonth(candidates, 'created_at')
            };
        } catch (error) {
            this.logger.error('Error in getCandidateAnalytics:', error);
            throw new AppError('Failed to generate candidate analytics', 500);
        }
    }

    // ============== CONSULTANT ANALYTICS ==============

    async getConsultantAnalytics(filters = {}) {
        try {
            const { consultant_id, date_range } = filters;

            let query = {};

            if (consultant_id) {
                query.consultant_id = consultant_id;
            }
            if (date_range) {
                query.applied_at = {
                    $gte: date_range.start_date,
                    $lte: date_range.end_date
                };
            }

            const applications = await Application.find(query)
                .populate('consultant_id')
                .lean();

            // Group by consultant
            const consultantMetrics = {};
            applications.forEach(app => {
                if (app.consultant_id) {
                    const consultantIdStr = app.consultant_id.toString();
                    if (!consultantMetrics[consultantIdStr]) {
                        consultantMetrics[consultantIdStr] = {
                            total_applications: 0,
                            hired: 0,
                            interviewed: 0,
                            applications: []
                        };
                    }

                    consultantMetrics[consultantIdStr].total_applications++;
                    consultantMetrics[consultantIdStr].applications.push(app);

                    if (app.status === 'hired') {
                        consultantMetrics[consultantIdStr].hired++;
                    } else if (['interviewed', 'offered'].includes(app.status)) {
                        consultantMetrics[consultantIdStr].interviewed++;
                    }
                }
            });

            // Calculate success rates
            Object.values(consultantMetrics).forEach(metrics => {
                const total = metrics.total_applications;
                metrics.hire_rate = total > 0 ? (metrics.hired / total * 100) : 0;
                metrics.interview_rate = total > 0 ? (metrics.interviewed / total * 100) : 0;
            });

            // Get consultant details
            const consultantPerformance = [];
            for (const [consultantId, metrics] of Object.entries(consultantMetrics)) {
                const consultant = await ConsultantProfile.findById(consultantId)
                    .populate('user_id')
                    .lean();

                if (consultant) {
                    consultantPerformance.push({
                        consultant_id: consultantId,
                        consultant_name: `${consultant.user_id.first_name} ${consultant.user_id.last_name}`,
                        total_applications: metrics.total_applications,
                        hired_count: metrics.hired,
                        hire_rate: Math.round(metrics.hire_rate * 10) / 10,
                        interview_rate: Math.round(metrics.interview_rate * 10) / 10
                    });
                }
            }

            // Sort by hire rate
            consultantPerformance.sort((a, b) => b.hire_rate - a.hire_rate);

            return {
                total_consultants: Object.keys(consultantMetrics).length,
                consultant_performance: consultantPerformance,
                overall_metrics: {
                    total_applications: applications.length,
                    total_hired: Object.values(consultantMetrics).reduce((sum, metrics) => sum + metrics.hired, 0),
                    average_hire_rate: Object.values(consultantMetrics).length > 0
                        ? Object.values(consultantMetrics).reduce((sum, metrics) => sum + metrics.hire_rate, 0) / Object.values(consultantMetrics).length
                        : 0
                }
            };
        } catch (error) {
            this.logger.error('Error in getConsultantAnalytics:', error);
            throw new AppError('Failed to generate consultant analytics', 500);
        }
    }

    // ============== COMPANY ANALYTICS ==============

    async getCompanyAnalytics(filters = {}) {
        try {
            const { company_id, date_range } = filters;

            let query = {};

            if (company_id) {
                query._id = company_id;
            }

            const companies = await Company.find(query).lean();

            const companyMetrics = [];
            for (const company of companies) {
                // Get jobs for this company
                let jobQuery = { company_id: company._id };
                if (date_range) {
                    jobQuery.created_at = {
                        $gte: date_range.start_date,
                        $lte: date_range.end_date
                    };
                }

                const jobs = await Job.find(jobQuery).lean();

                // Get applications for company jobs
                const jobIds = jobs.map(job => job._id);
                const applications = jobIds.length > 0
                    ? await Application.find({ job_id: { $in: jobIds } }).lean()
                    : [];

                // Calculate metrics
                const hiredCount = applications.filter(app => app.status === 'hired').length;

                companyMetrics.push({
                    company_id: company._id.toString(),
                    company_name: company.name,
                    total_jobs: jobs.length,
                    total_applications: applications.length,
                    hired_count: hiredCount,
                    hire_rate: applications.length > 0 ? (hiredCount / applications.length * 100) : 0,
                    avg_applications_per_job: jobs.length > 0 ? (applications.length / jobs.length) : 0
                });
            }

            // Sort by total applications
            companyMetrics.sort((a, b) => b.total_applications - a.total_applications);

            return {
                total_companies: companies.length,
                company_performance: companyMetrics,
                top_hiring_companies: companyMetrics.slice(0, 10)
            };
        } catch (error) {
            this.logger.error('Error in getCompanyAnalytics:', error);
            throw new AppError('Failed to generate company analytics', 500);
        }
    }

    // ============== HELPER METHODS ==============

    async getConversionRates(startDate, endDate) {
        try {
            const applications = await Application.find({
                applied_at: { $gte: startDate, $lte: endDate }
            }).lean();

            if (!applications.length) {
                return {
                    application_to_review: 0,
                    review_to_interview: 0,
                    interview_to_offer: 0,
                    offer_to_hire: 0
                };
            }

            const total = applications.length;
            const reviewed = applications.filter(app => app.status !== 'submitted').length;
            const interviewed = applications.filter(app =>
                ['interviewed', 'offered', 'hired'].includes(app.status)
            ).length;
            const offered = applications.filter(app =>
                ['offered', 'hired'].includes(app.status)
            ).length;
            const hired = applications.filter(app => app.status === 'hired').length;

            return {
                application_to_review: total > 0 ? (reviewed / total * 100) : 0,
                review_to_interview: reviewed > 0 ? (interviewed / reviewed * 100) : 0,
                interview_to_offer: interviewed > 0 ? (offered / interviewed * 100) : 0,
                offer_to_hire: offered > 0 ? (hired / offered * 100) : 0
            };
        } catch (error) {
            this.logger.error('Error in getConversionRates:', error);
            throw new AppError('Failed to calculate conversion rates', 500);
        }
    }

    _emptyApplicationAnalytics() {
        return {
            total_applications: 0,
            status_distribution: {},
            conversion_rates: {
                application_to_interview: 0,
                interview_to_offer: 0,
                offer_to_hire: 0
            },
            time_metrics: {
                average_time_to_hire_days: 0,
                applications_this_month: 0
            },
            monthly_trends: {},
            source_analysis: {}
        };
    }

    _calculateConversionRate(applications, fromStatus, toStatuses) {
        const fromCount = applications.filter(app => app.status === fromStatus).length;
        const toCount = applications.filter(app => toStatuses.includes(app.status)).length;
        return fromCount > 0 ? (toCount / fromCount * 100) : 0;
    }

    _groupByMonth(items, dateField) {
        const monthlyData = {};
        items.forEach(item => {
            const dateValue = item[dateField];
            if (dateValue) {
                const monthKey = new Date(dateValue).toISOString().slice(0, 7);
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
            }
        });
        return monthlyData;
    }

    _analyzeApplicationSources(applications) {
        // This would be implemented based on how you track application sources
        // For now, return empty object
        return {};
    }

    async _analyzeSkillsDemand(jobs) {
        try {
            const jobIds = jobs.map(job => job._id);
            if (!jobIds.length) return [];

            // This assumes JobSkillRequirement model exists
            // For now, return placeholder data
            return [
                { skill: 'JavaScript', demand_count: 15 },
                { skill: 'Python', demand_count: 12 },
                { skill: 'React', demand_count: 10 },
                { skill: 'Node.js', demand_count: 8 },
                { skill: 'SQL', demand_count: 7 }
            ];
        } catch (error) {
            this.logger.error('Error in _analyzeSkillsDemand:', error);
            return [];
        }
    }

    async _analyzeCandidateSkills(candidates) {
        try {
            const candidateIds = candidates.map(c => c._id);
            if (!candidateIds.length) return [];

            // This would query CandidateSkill model
            // For now, return placeholder data
            return [
                { skill: 'JavaScript', candidate_count: 25 },
                { skill: 'Python', candidate_count: 20 },
                { skill: 'React', candidate_count: 18 },
                { skill: 'Node.js', candidate_count: 15 },
                { skill: 'SQL', candidate_count: 12 }
            ];
        } catch (error) {
            this.logger.error('Error in _analyzeCandidateSkills:', error);
            return [];
        }
    }

    async _analyzeCandidateSuccessRates(candidates) {
        try {
            const candidateIds = candidates.map(c => c._id);
            if (!candidateIds.length) {
                return {
                    average_applications_per_candidate: 0,
                    average_success_rate: 0
                };
            }

            const totalApplications = await Application.countDocuments({
                candidate_id: { $in: candidateIds }
            });

            const hiredApplications = await Application.countDocuments({
                candidate_id: { $in: candidateIds },
                status: 'hired'
            });

            return {
                average_applications_per_candidate: Math.round((totalApplications / candidates.length) * 10) / 10,
                average_success_rate: totalApplications > 0
                    ? Math.round((hiredApplications / totalApplications * 100) * 10) / 10
                    : 0
            };
        } catch (error) {
            this.logger.error('Error in _analyzeCandidateSuccessRates:', error);
            return {
                average_applications_per_candidate: 0,
                average_success_rate: 0
            };
        }
    }
}

module.exports = new AnalyticsService();
