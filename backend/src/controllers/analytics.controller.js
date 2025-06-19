const analyticsService = require('../services/analytics.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const { AppError } = require('../utils/appError');

class AnalyticsController {
    constructor() {
        this.logger = logger;
    }

    // Helper function to parse date range
    parseDateRange(startDate, endDate) {
        if (!startDate && !endDate) {
            return null;
        }

        try {
            let start, end;

            if (startDate && endDate) {
                start = new Date(startDate);
                end = new Date(endDate);
            } else if (startDate) {
                start = new Date(startDate);
                end = new Date();
            } else {
                end = new Date(endDate);
                start = new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000)); // Default to 30 days
            }

            return { start_date: start, end_date: end };
        } catch (error) {
            throw new AppError('Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)', 400);
        }
    }

    // ============== DASHBOARD OVERVIEW ==============

    async getDashboardOverview(req, res) {
        try {
            const { start_date, end_date } = req.query;
            const dateRange = this.parseDateRange(start_date, end_date);

            const overviewData = await analyticsService.getDashboardOverview(dateRange);

            return successResponse(res, 'Dashboard overview retrieved successfully', overviewData);
        } catch (error) {
            this.logger.error('Error in getDashboardOverview:', error);
            return errorResponse(res, error.message || 'Failed to generate dashboard overview', error.statusCode || 500);
        }
    }

    // ============== APPLICATION ANALYTICS ==============

    async getApplicationAnalytics(req, res) {
        try {
            const { company_id, job_id, consultant_id, start_date, end_date } = req.query;
            const dateRange = this.parseDateRange(start_date, end_date);

            // Role-based access control
            const user = req.user;
            let filters = { date_range: dateRange };

            if (company_id) {
                if (user.role === 'employer') {
                    // Employers can only see their company data
                    const userCompany = await this.getUserCompany(user.id);
                    if (userCompany !== company_id) {
                        throw new AppError('Access denied to company data', 403);
                    }
                }
                filters.company_id = company_id;
            }

            if (job_id) {
                filters.job_id = job_id;
            }

            if (consultant_id) {
                if (user.role === 'consultant') {
                    // Consultants can only see their own data
                    if (user.consultant_profile !== consultant_id) {
                        throw new AppError('Access denied to consultant data', 403);
                    }
                }
                filters.consultant_id = consultant_id;
            }

            // If user is employer and no company_id provided, get their company
            if (user.role === 'employer' && !company_id) {
                const userCompany = await this.getUserCompany(user.id);
                if (userCompany) {
                    filters.company_id = userCompany;
                }
            }

            // If user is consultant and no consultant_id provided, set to their profile
            if (user.role === 'consultant' && !consultant_id) {
                filters.consultant_id = user.consultant_profile;
            }

            const analyticsData = await analyticsService.getApplicationAnalytics(filters);

            return successResponse(res, 'Application analytics retrieved successfully', analyticsData);
        } catch (error) {
            this.logger.error('Error in getApplicationAnalytics:', error);
            return errorResponse(res, error.message || 'Failed to generate application analytics', error.statusCode || 500);
        }
    }

    // ============== JOB ANALYTICS ==============

    async getJobAnalytics(req, res) {
        try {
            const { company_id, start_date, end_date } = req.query;
            const dateRange = this.parseDateRange(start_date, end_date);

            // Role-based access control
            const user = req.user;
            let filters = { date_range: dateRange };

            if (company_id) {
                if (user.role === 'employer') {
                    // Employers can only see their company data
                    const userCompany = await this.getUserCompany(user.id);
                    if (userCompany !== company_id) {
                        throw new AppError('Access denied to company data', 403);
                    }
                }
                filters.company_id = company_id;
            } else if (user.role === 'employer') {
                // If no company_id provided, get user's company
                const userCompany = await this.getUserCompany(user.id);
                if (userCompany) {
                    filters.company_id = userCompany;
                }
            }

            const analyticsData = await analyticsService.getJobAnalytics(filters);

            return successResponse(res, 'Job analytics retrieved successfully', analyticsData);
        } catch (error) {
            this.logger.error('Error in getJobAnalytics:', error);
            return errorResponse(res, error.message || 'Failed to generate job analytics', error.statusCode || 500);
        }
    }

    // ============== CANDIDATE ANALYTICS ==============

    async getCandidateAnalytics(req, res) {
        try {
            const { consultant_id, start_date, end_date } = req.query;
            const dateRange = this.parseDateRange(start_date, end_date);

            // Role-based access control
            const user = req.user;
            let filters = { date_range: dateRange };

            if (consultant_id) {
                if (user.role === 'consultant') {
                    // Consultants can only see their own data
                    if (user.consultant_profile !== consultant_id) {
                        throw new AppError('Access denied to consultant data', 403);
                    }
                }
                filters.consultant_id = consultant_id;
            } else if (user.role === 'consultant') {
                // Set consultant_id to current user if not provided
                filters.consultant_id = user.consultant_profile;
            }

            const analyticsData = await analyticsService.getCandidateAnalytics(filters);

            return successResponse(res, 'Candidate analytics retrieved successfully', analyticsData);
        } catch (error) {
            this.logger.error('Error in getCandidateAnalytics:', error);
            return errorResponse(res, error.message || 'Failed to generate candidate analytics', error.statusCode || 500);
        }
    }

    // ============== CONSULTANT ANALYTICS ==============

    async getConsultantAnalytics(req, res) {
        try {
            const { consultant_id, start_date, end_date } = req.query;
            const dateRange = this.parseDateRange(start_date, end_date);

            // Role-based access control
            const user = req.user;
            let filters = { date_range: dateRange };

            if (consultant_id) {
                if (user.role === 'consultant') {
                    // Individual consultants can only see their own data
                    if (user.consultant_profile !== consultant_id) {
                        throw new AppError('Access denied to other consultant data', 403);
                    }
                }
                filters.consultant_id = consultant_id;
            } else if (user.role === 'consultant') {
                // Set to current user's consultant profile
                filters.consultant_id = user.consultant_profile;
            }

            const analyticsData = await analyticsService.getConsultantAnalytics(filters);

            return successResponse(res, 'Consultant analytics retrieved successfully', analyticsData);
        } catch (error) {
            this.logger.error('Error in getConsultantAnalytics:', error);
            return errorResponse(res, error.message || 'Failed to generate consultant analytics', error.statusCode || 500);
        }
    }

    // ============== COMPANY ANALYTICS ==============

    async getCompanyAnalytics(req, res) {
        try {
            const { company_id, start_date, end_date } = req.query;
            const dateRange = this.parseDateRange(start_date, end_date);

            // Role-based access control
            const user = req.user;
            let filters = { date_range: dateRange };

            if (company_id) {
                if (user.role === 'employer') {
                    // Employers can only see their own company data
                    const userCompany = await this.getUserCompany(user.id);
                    if (userCompany !== company_id) {
                        throw new AppError('Access denied to company data', 403);
                    }
                }
                filters.company_id = company_id;
            } else if (user.role === 'employer') {
                // If no company_id provided, get user's company
                const userCompany = await this.getUserCompany(user.id);
                if (userCompany) {
                    filters.company_id = userCompany;
                }
            }

            const analyticsData = await analyticsService.getCompanyAnalytics(filters);

            return successResponse(res, 'Company analytics retrieved successfully', analyticsData);
        } catch (error) {
            this.logger.error('Error in getCompanyAnalytics:', error);
            return errorResponse(res, error.message || 'Failed to generate company analytics', error.statusCode || 500);
        }
    }

    // ============== TREND ANALYSIS ==============

    async getTrendAnalysis(req, res) {
        try {
            const { metric, period = 'monthly', start_date, end_date } = req.query;

            if (!metric) {
                throw new AppError('Metric parameter is required', 400);
            }

            const dateRange = this.parseDateRange(start_date, end_date);

            // This would implement trend analysis logic
            // For now, return a placeholder response
            const trendData = {
                metric_name: metric,
                period: period,
                trend_direction: 'stable',
                growth_rate: 0.0,
                data_points: []
            };

            return successResponse(res, 'Trend analysis retrieved successfully', trendData);
        } catch (error) {
            this.logger.error('Error in getTrendAnalysis:', error);
            return errorResponse(res, error.message || 'Failed to generate trend analysis', error.statusCode || 500);
        }
    }

    // ============== KEY PERFORMANCE INDICATORS ==============

    async getKeyPerformanceIndicators(req, res) {
        try {
            const { start_date, end_date } = req.query;
            const dateRange = this.parseDateRange(start_date, end_date);

            // Get various analytics
            const dashboardData = await analyticsService.getDashboardOverview(dateRange);
            const applicationData = await analyticsService.getApplicationAnalytics({ date_range: dateRange });
            const jobData = await analyticsService.getJobAnalytics({ date_range: dateRange });

            // Calculate KPIs
            const kpis = {
                time_to_hire: applicationData.time_metrics?.average_time_to_hire_days || 0,
                application_conversion_rate: applicationData.conversion_rates?.application_to_interview || 0,
                job_fill_rate: jobData.performance_metrics?.fill_rate || 0,
                candidate_satisfaction: 85.0, // This would come from surveys
                employer_satisfaction: 87.5,  // This would come from surveys
                platform_growth_rate: dashboardData.active_metrics?.application_growth_percent || 0,
                revenue_per_hire: 2500.0,     // This would be calculated from billing data
                consultant_efficiency: 75.0   // Average across all consultants
            };

            const response = {
                kpis: kpis,
                period: {
                    start_date: dateRange?.start_date?.toISOString() || null,
                    end_date: dateRange?.end_date?.toISOString() || null
                },
                generated_at: new Date().toISOString()
            };

            return successResponse(res, 'KPIs retrieved successfully', response);
        } catch (error) {
            this.logger.error('Error in getKeyPerformanceIndicators:', error);
            return errorResponse(res, error.message || 'Failed to generate KPIs', error.statusCode || 500);
        }
    }

    // ============== CUSTOM REPORTS ==============

    async generateCustomReport(req, res) {
        try {
            const { report_type, filters, metrics, format = 'json' } = req.body;

            if (!report_type || !metrics) {
                throw new AppError('Report type and metrics are required', 400);
            }

            // This would implement custom report generation
            // For now, return a placeholder response
            const reportId = require('crypto').randomUUID();
            const estimatedCompletion = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

            const response = {
                report_id: reportId,
                status: 'generating',
                estimated_completion: estimatedCompletion.toISOString(),
                download_url: `/api/v1/analytics/reports/${reportId}`
            };

            return successResponse(res, 'Custom report generation started', response);
        } catch (error) {
            this.logger.error('Error in generateCustomReport:', error);
            return errorResponse(res, error.message || 'Failed to generate custom report', error.statusCode || 500);
        }
    }

    async getGeneratedReport(req, res) {
        try {
            const { report_id } = req.params;

            // This would fetch the generated report
            // For now, return a placeholder response
            const response = {
                report_id: report_id,
                status: 'completed',
                generated_at: new Date().toISOString(),
                data: {
                    summary: 'Report data would be here',
                    charts: [],
                    tables: []
                }
            };

            return successResponse(res, 'Generated report retrieved successfully', response);
        } catch (error) {
            this.logger.error('Error in getGeneratedReport:', error);
            return errorResponse(res, error.message || 'Failed to retrieve generated report', error.statusCode || 500);
        }
    }

    // ============== EXPORT FUNCTIONALITY ==============

    async exportAnalyticsData(req, res) {
        try {
            const { analytics_type, filters, format = 'csv', include_charts = false } = req.body;

            if (!analytics_type) {
                throw new AppError('Analytics type is required', 400);
            }

            // This would implement data export functionality
            // For now, return a placeholder response
            const exportId = require('crypto').randomUUID();
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

            const response = {
                export_id: exportId,
                download_url: `/api/v1/analytics/exports/${exportId}/download`,
                expires_at: expiresAt.toISOString(),
                file_size_mb: 1.5
            };

            return successResponse(res, 'Analytics export started', response);
        } catch (error) {
            this.logger.error('Error in exportAnalyticsData:', error);
            return errorResponse(res, error.message || 'Failed to export analytics data', error.statusCode || 500);
        }
    }

    async downloadExport(req, res) {
        try {
            const { export_id } = req.params;

            // This would serve the exported file
            // For now, return a placeholder response
            const response = {
                message: `Download would start for export ${export_id}`,
                export_id: export_id
            };

            return successResponse(res, 'Export download initiated', response);
        } catch (error) {
            this.logger.error('Error in downloadExport:', error);
            return errorResponse(res, error.message || 'Failed to download export', error.statusCode || 500);
        }
    }

    // ============== INDUSTRY BENCHMARKS ==============

    async getIndustryBenchmarks(req, res) {
        try {
            const { industry, company_size } = req.query;

            // This would implement benchmark comparison logic
            // For now, return placeholder data
            const response = {
                industry: industry || 'technology',
                company_size: company_size || 'medium',
                benchmarks: {
                    time_to_hire: {
                        your_value: 25.5,
                        industry_average: 23.2,
                        percentile_rank: 60
                    },
                    cost_per_hire: {
                        your_value: 3200.0,
                        industry_average: 2850.0,
                        percentile_rank: 40
                    },
                    application_conversion_rate: {
                        your_value: 12.5,
                        industry_average: 15.2,
                        percentile_rank: 35
                    }
                },
                generated_at: new Date().toISOString()
            };

            return successResponse(res, 'Industry benchmarks retrieved successfully', response);
        } catch (error) {
            this.logger.error('Error in getIndustryBenchmarks:', error);
            return errorResponse(res, error.message || 'Failed to generate industry benchmarks', error.statusCode || 500);
        }
    }

    // ============== HELPER METHODS ==============

    async getUserCompany(userId) {
        try {
            // This would query the user's employer profile to get their company
            // For now, return null
            return null;
        } catch (error) {
            this.logger.error('Error in getUserCompany:', error);
            return null;
        }
    }
}

module.exports = new AnalyticsController();
