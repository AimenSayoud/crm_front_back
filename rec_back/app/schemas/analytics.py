from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID


# Request schemas for filtering analytics
class DateRangeFilter(BaseModel):
    start_date: datetime
    end_date: datetime


class AnalyticsFilters(BaseModel):
    date_range: Optional[DateRangeFilter] = None
    company_id: Optional[UUID] = None
    job_id: Optional[UUID] = None
    consultant_id: Optional[UUID] = None


# Response schemas for analytics data
class OverviewMetrics(BaseModel):
    total_users: int
    total_candidates: int
    total_companies: int
    total_jobs: int
    total_applications: int


class ActiveMetrics(BaseModel):
    active_jobs: int
    new_applications: int
    hired_count: int
    application_growth_percent: float


class ConversionRates(BaseModel):
    application_to_review: float
    review_to_interview: float
    interview_to_offer: float
    offer_to_hire: float


class DashboardOverviewResponse(BaseModel):
    overview: OverviewMetrics
    active_metrics: ActiveMetrics
    conversion_rates: ConversionRates
    period: Dict[str, str]  # start_date, end_date as ISO strings


class ApplicationConversionRates(BaseModel):
    application_to_interview: float
    interview_to_offer: float
    offer_to_hire: float


class TimeMetrics(BaseModel):
    average_time_to_hire_days: float
    applications_this_month: int


class ApplicationAnalyticsResponse(BaseModel):
    total_applications: int
    status_distribution: Dict[str, int]
    conversion_rates: ApplicationConversionRates
    time_metrics: TimeMetrics
    monthly_trends: Dict[str, int]
    source_analysis: Dict[str, int]


class JobPerformanceItem(BaseModel):
    job_id: str
    job_title: str
    application_count: int
    created_at: str
    status: str


class JobPerformanceMetrics(BaseModel):
    average_applications_per_job: float
    average_time_to_fill_days: float
    fill_rate: float


class SkillDemandItem(BaseModel):
    skill: str
    demand_count: int


class JobAnalyticsResponse(BaseModel):
    total_jobs: int
    status_distribution: Dict[str, int]
    performance_metrics: JobPerformanceMetrics
    top_performing_jobs: List[JobPerformanceItem]
    skills_in_demand: List[SkillDemandItem]
    monthly_job_postings: Dict[str, int]


class CandidateSuccessMetrics(BaseModel):
    average_applications_per_candidate: float
    average_success_rate: float


class CandidateSkillItem(BaseModel):
    skill: str
    candidate_count: int


class CandidateAnalyticsResponse(BaseModel):
    total_candidates: int
    profile_completion_rate: float
    experience_distribution: Dict[str, int]
    location_distribution: Dict[str, int]
    top_skills: List[CandidateSkillItem]
    success_metrics: CandidateSuccessMetrics
    monthly_registrations: Dict[str, int]


class ConsultantPerformanceItem(BaseModel):
    consultant_id: str
    consultant_name: str
    total_applications: int
    hired_count: int
    hire_rate: float
    interview_rate: float


class ConsultantOverallMetrics(BaseModel):
    total_applications: int
    total_hired: int
    average_hire_rate: float


class ConsultantAnalyticsResponse(BaseModel):
    total_consultants: int
    consultant_performance: List[ConsultantPerformanceItem]
    overall_metrics: ConsultantOverallMetrics


class CompanyPerformanceItem(BaseModel):
    company_id: str
    company_name: str
    total_jobs: int
    total_applications: int
    hired_count: int
    hire_rate: float
    avg_applications_per_job: float


class CompanyAnalyticsResponse(BaseModel):
    total_companies: int
    company_performance: List[CompanyPerformanceItem]
    top_hiring_companies: List[CompanyPerformanceItem]


# Custom report request schemas
class CustomReportRequest(BaseModel):
    report_type: str = Field(..., description="Type of report to generate")
    filters: AnalyticsFilters
    metrics: List[str] = Field(..., description="List of metrics to include")
    format: Optional[str] = Field("json", description="Output format (json, csv, excel)")


class ReportScheduleRequest(BaseModel):
    report_type: str
    filters: AnalyticsFilters
    schedule_frequency: str = Field(..., description="daily, weekly, monthly")
    recipients: List[str] = Field(..., description="Email addresses to send report")
    next_run_date: datetime


# Trend analysis schemas
class TrendDataPoint(BaseModel):
    date: str
    value: float
    metric_name: str


class TrendAnalysisResponse(BaseModel):
    metric_name: str
    period: str
    data_points: List[TrendDataPoint]
    trend_direction: str  # "increasing", "decreasing", "stable"
    growth_rate: float


# Benchmark comparison schemas
class BenchmarkMetrics(BaseModel):
    metric_name: str
    current_value: float
    industry_average: float
    percentile_rank: Optional[int] = None
    comparison: str  # "above_average", "below_average", "average"


class BenchmarkResponse(BaseModel):
    company_id: Optional[UUID]
    metrics: List[BenchmarkMetrics]
    overall_performance_score: float


# Export schemas
class ExportRequest(BaseModel):
    analytics_type: str = Field(..., description="Type of analytics to export")
    filters: AnalyticsFilters
    format: str = Field("csv", description="Export format")
    include_charts: Optional[bool] = Field(False, description="Include charts in export")


class ExportResponse(BaseModel):
    export_id: str
    download_url: str
    expires_at: datetime
    file_size_mb: float