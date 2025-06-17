from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import and_, or_, desc, asc, func
from uuid import UUID
from datetime import datetime

from app.crud.base import CRUDBase
from app.models.consultant import (
    ConsultantProfile, ConsultantStatus, ConsultantTarget, 
    ConsultantPerformanceReview, ConsultantCandidate, ConsultantClient
)
from app.models.candidate import CandidateProfile
from app.models.company import Company
from app.models.user import User
from app.schemas.consultant import (
    ConsultantProfileCreate, ConsultantProfileUpdate,
    ConsultantTargetCreate, ConsultantTargetUpdate,
    ConsultantPerformanceReviewCreate, ConsultantPerformanceReviewUpdate,
    ConsultantSearchFilters,
    ConsultantCandidateCreate, ConsultantCandidateUpdate,
    ConsultantClientCreate, ConsultantClientUpdate
)


class CRUDConsultantProfile(CRUDBase[ConsultantProfile, ConsultantProfileCreate, ConsultantProfileUpdate]):
    def get_by_user_id(self, db: Session, *, user_id: UUID) -> Optional[ConsultantProfile]:
        """Get consultant profile by user ID"""
        return db.query(ConsultantProfile)\
            .options(joinedload(ConsultantProfile.user))\
            .filter(ConsultantProfile.user_id == user_id)\
            .first()
    
    def get_with_details(self, db: Session, *, id: UUID) -> Optional[ConsultantProfile]:
        """Get consultant profile with all related data"""
        return db.query(ConsultantProfile)\
            .options(
                joinedload(ConsultantProfile.user),
                selectinload(ConsultantProfile.targets),
                selectinload(ConsultantProfile.performance_reviews),
                selectinload(ConsultantProfile.candidate_assignments).joinedload(ConsultantCandidate.candidate),
                selectinload(ConsultantProfile.client_assignments).joinedload(ConsultantClient.company)
            )\
            .filter(ConsultantProfile.id == id)\
            .first()
    
    def get_multi_with_search(
        self, 
        db: Session, 
        *, 
        filters: ConsultantSearchFilters
    ) -> tuple[List[ConsultantProfile], int]:
        """Get consultants with search filters and pagination"""
        query = db.query(ConsultantProfile)\
            .join(User, ConsultantProfile.user_id == User.id)\
            .options(joinedload(ConsultantProfile.user))
        
        # Apply filters
        if filters.status:
            query = query.filter(ConsultantProfile.status == filters.status)
        
        if filters.specialization:
            query = query.filter(
                ConsultantProfile.specializations.contains([filters.specialization])
            )
        
        if filters.min_experience_years is not None:
            query = query.filter(ConsultantProfile.years_of_experience >= filters.min_experience_years)
        
        if filters.max_experience_years is not None:
            query = query.filter(ConsultantProfile.years_of_experience <= filters.max_experience_years)
        
        if filters.skills:
            # Filter by skills in specializations
            for skill in filters.skills:
                query = query.filter(
                    ConsultantProfile.specializations.contains([skill])
                )
        
        if filters.min_commission_rate is not None:
            query = query.filter(ConsultantProfile.commission_rate >= filters.min_commission_rate)
        
        if filters.max_commission_rate is not None:
            query = query.filter(ConsultantProfile.commission_rate <= filters.max_commission_rate)
        
        if filters.languages:
            # Assuming languages are stored in specializations
            for language in filters.languages:
                query = query.filter(
                    ConsultantProfile.certifications.contains([language])
                )
        
        # Count total before pagination
        total = query.count()
        
        # Apply sorting
        if filters.sort_by == "experience_years":
            order_column = ConsultantProfile.years_of_experience
        elif filters.sort_by == "total_placements":
            order_column = ConsultantProfile.total_placements
        elif filters.sort_by == "updated_at":
            order_column = ConsultantProfile.updated_at
        else:  # default to created_at
            order_column = ConsultantProfile.created_at
        
        if filters.sort_order == "asc":
            query = query.order_by(asc(order_column))
        else:
            query = query.order_by(desc(order_column))
        
        # Apply pagination
        offset = (filters.page - 1) * filters.page_size
        consultants = query.offset(offset).limit(filters.page_size).all()
        
        return consultants, total
    
    def get_active_consultants(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[ConsultantProfile]:
        """Get active consultants"""
        return db.query(ConsultantProfile)\
            .options(joinedload(ConsultantProfile.user))\
            .filter(ConsultantProfile.status == ConsultantStatus.ACTIVE)\
            .order_by(desc(ConsultantProfile.total_placements))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def update_performance_metrics(self, db: Session, *, consultant_id: UUID) -> Optional[ConsultantProfile]:
        """Update consultant performance metrics"""
        consultant = self.get(db, id=consultant_id)
        if not consultant:
            return None
        
        # Count active assignments
        active_candidates = db.query(func.count(ConsultantCandidate.id))\
            .filter(
                and_(
                    ConsultantCandidate.consultant_id == consultant_id,
                    ConsultantCandidate.is_active == True
                )
            ).scalar()
        
        active_clients = db.query(func.count(ConsultantClient.id))\
            .filter(
                and_(
                    ConsultantClient.consultant_id == consultant_id,
                    ConsultantClient.is_active == True
                )
            ).scalar()
        
        # Update metrics
        consultant.current_active_jobs = (active_candidates or 0) + (active_clients or 0)
        
        db.commit()
        db.refresh(consultant)
        return consultant


class CRUDConsultantTarget(CRUDBase[ConsultantTarget, ConsultantTargetCreate, ConsultantTargetUpdate]):
    def get_by_consultant(self, db: Session, *, consultant_id: UUID) -> List[ConsultantTarget]:
        """Get all targets for a consultant"""
        return db.query(ConsultantTarget)\
            .filter(ConsultantTarget.consultant_id == consultant_id)\
            .order_by(desc(ConsultantTarget.target_year), desc(ConsultantTarget.target_quarter))\
            .all()
    
    def get_current_targets(self, db: Session, *, consultant_id: UUID, target_period: str) -> Optional[ConsultantTarget]:
        """Get current period targets for consultant"""
        from datetime import date
        current_date = date.today()
        
        query = db.query(ConsultantTarget)\
            .filter(
                and_(
                    ConsultantTarget.consultant_id == consultant_id,
                    ConsultantTarget.target_period == target_period,
                    ConsultantTarget.target_year == current_date.year
                )
            )
        
        if target_period == "monthly":
            query = query.filter(ConsultantTarget.target_month == current_date.month)
        elif target_period == "quarterly":
            current_quarter = (current_date.month - 1) // 3 + 1
            query = query.filter(ConsultantTarget.target_quarter == current_quarter)
        
        return query.first()
    
    def update_achievement(self, db: Session, *, target_id: UUID, actual_value: float, value_type: str) -> Optional[ConsultantTarget]:
        """Update target achievement"""
        target = self.get(db, id=target_id)
        if not target:
            return None
        
        if value_type == "placement":
            target.actual_placements = actual_value
        elif value_type == "revenue":
            target.actual_revenue = actual_value
        elif value_type == "satisfaction":
            target.actual_client_satisfaction = actual_value
        
        # Check if target is achieved
        target.is_achieved = (
            (target.placement_target is None or target.actual_placements >= target.placement_target) and
            (target.revenue_target is None or target.actual_revenue >= target.revenue_target) and
            (target.client_satisfaction_target is None or target.actual_client_satisfaction >= target.client_satisfaction_target)
        )
        
        db.commit()
        db.refresh(target)
        return target


class CRUDConsultantPerformanceReview(CRUDBase[ConsultantPerformanceReview, ConsultantPerformanceReviewCreate, ConsultantPerformanceReviewUpdate]):
    def get_by_consultant(self, db: Session, *, consultant_id: UUID) -> List[ConsultantPerformanceReview]:
        """Get all performance reviews for a consultant"""
        return db.query(ConsultantPerformanceReview)\
            .options(joinedload(ConsultantPerformanceReview.reviewer))\
            .filter(ConsultantPerformanceReview.consultant_id == consultant_id)\
            .order_by(desc(ConsultantPerformanceReview.review_period_end))\
            .all()
    
    def get_latest_review(self, db: Session, *, consultant_id: UUID) -> Optional[ConsultantPerformanceReview]:
        """Get latest performance review for consultant"""
        return db.query(ConsultantPerformanceReview)\
            .filter(
                and_(
                    ConsultantPerformanceReview.consultant_id == consultant_id,
                    ConsultantPerformanceReview.status == "approved"
                )
            )\
            .order_by(desc(ConsultantPerformanceReview.review_period_end))\
            .first()
    
    def approve_review(self, db: Session, *, review_id: UUID) -> Optional[ConsultantPerformanceReview]:
        """Approve a performance review"""
        review = self.get(db, id=review_id)
        if review:
            review.status = "approved"
            
            # Update consultant's average rating
            consultant = db.query(ConsultantProfile).filter(ConsultantProfile.id == review.consultant_id).first()
            if consultant and review.overall_rating:
                # Calculate new average rating
                approved_reviews = db.query(ConsultantPerformanceReview)\
                    .filter(
                        and_(
                            ConsultantPerformanceReview.consultant_id == review.consultant_id,
                            ConsultantPerformanceReview.status == "approved",
                            ConsultantPerformanceReview.overall_rating.isnot(None)
                        )
                    ).all()
                
                if approved_reviews:
                    avg_rating = sum(r.overall_rating for r in approved_reviews) / len(approved_reviews)
                    consultant.average_rating = avg_rating
            
            db.commit()
            db.refresh(review)
        return review


class CRUDConsultantCandidate(CRUDBase[ConsultantCandidate, ConsultantCandidateCreate, ConsultantCandidateUpdate]):
    def get_consultant_candidates(self, db: Session, *, consultant_id: UUID, skip: int = 0, limit: int = 100) -> List[ConsultantCandidate]:
        """Get all candidates assigned to a consultant"""
        return db.query(ConsultantCandidate)\
            .options(
                joinedload(ConsultantCandidate.candidate).joinedload(CandidateProfile.user)
            )\
            .filter(ConsultantCandidate.consultant_id == consultant_id)\
            .order_by(desc(ConsultantCandidate.assigned_date))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_candidate_consultants(self, db: Session, *, candidate_id: UUID) -> List[ConsultantCandidate]:
        """Get all consultants assigned to a candidate"""
        return db.query(ConsultantCandidate)\
            .options(
                joinedload(ConsultantCandidate.consultant).joinedload(ConsultantProfile.user)
            )\
            .filter(ConsultantCandidate.candidate_id == candidate_id)\
            .order_by(desc(ConsultantCandidate.assigned_date))\
            .all()
    
    def assign_candidate(
        self, 
        db: Session, 
        *, 
        consultant_id: UUID, 
        candidate_id: UUID, 
        notes: Optional[str] = None
    ) -> ConsultantCandidate:
        """Assign a candidate to a consultant"""
        # Check if already assigned
        existing = db.query(ConsultantCandidate)\
            .filter(
                and_(
                    ConsultantCandidate.consultant_id == consultant_id,
                    ConsultantCandidate.candidate_id == candidate_id,
                    ConsultantCandidate.is_active == True
                )
            )\
            .first()
        
        if existing:
            return existing
        
        assignment = ConsultantCandidate(
            consultant_id=consultant_id,
            candidate_id=candidate_id,
            assigned_date=datetime.utcnow(),
            is_active=True,
            notes=notes
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return assignment
    
    def unassign_candidate(
        self, 
        db: Session, 
        *, 
        consultant_id: UUID, 
        candidate_id: UUID
    ) -> bool:
        """Unassign a candidate from a consultant"""
        assignment = db.query(ConsultantCandidate)\
            .filter(
                and_(
                    ConsultantCandidate.consultant_id == consultant_id,
                    ConsultantCandidate.candidate_id == candidate_id,
                    ConsultantCandidate.is_active == True
                )
            )\
            .first()
        
        if assignment:
            assignment.is_active = False
            assignment.unassigned_date = datetime.utcnow()
            db.commit()
            return True
        return False
    
    def update_metrics(
        self, 
        db: Session, 
        *, 
        consultant_id: UUID, 
        candidate_id: UUID,
        metric_type: str
    ) -> Optional[ConsultantCandidate]:
        """Update assignment metrics"""
        assignment = db.query(ConsultantCandidate)\
            .filter(
                and_(
                    ConsultantCandidate.consultant_id == consultant_id,
                    ConsultantCandidate.candidate_id == candidate_id
                )
            )\
            .first()
        
        if assignment:
            if metric_type == "placement":
                assignment.placement_count += 1
            elif metric_type == "interview":
                assignment.interview_count += 1
            elif metric_type == "application":
                assignment.application_count += 1
            
            db.commit()
            db.refresh(assignment)
        
        return assignment


class CRUDConsultantClient(CRUDBase[ConsultantClient, ConsultantClientCreate, ConsultantClientUpdate]):
    def get_consultant_clients(self, db: Session, *, consultant_id: UUID, skip: int = 0, limit: int = 100) -> List[ConsultantClient]:
        """Get all clients assigned to a consultant"""
        return db.query(ConsultantClient)\
            .options(joinedload(ConsultantClient.company))\
            .filter(ConsultantClient.consultant_id == consultant_id)\
            .order_by(desc(ConsultantClient.assigned_date))\
            .offset(skip)\
            .limit(limit)\
            .all()
    
    def get_company_consultants(self, db: Session, *, company_id: UUID) -> List[ConsultantClient]:
        """Get all consultants assigned to a company"""
        return db.query(ConsultantClient)\
            .options(
                joinedload(ConsultantClient.consultant).joinedload(ConsultantProfile.user)
            )\
            .filter(ConsultantClient.company_id == company_id)\
            .order_by(desc(ConsultantClient.assigned_date))\
            .all()
    
    def assign_client(
        self, 
        db: Session, 
        *, 
        consultant_id: UUID, 
        company_id: UUID, 
        is_primary: bool = False,
        notes: Optional[str] = None
    ) -> ConsultantClient:
        """Assign a company client to a consultant"""
        # If setting as primary, unset other primary consultants
        if is_primary:
            db.query(ConsultantClient)\
                .filter(
                    and_(
                        ConsultantClient.company_id == company_id,
                        ConsultantClient.is_active == True
                    )
                )\
                .update({"is_primary": False})
        
        # Check if already assigned
        existing = db.query(ConsultantClient)\
            .filter(
                and_(
                    ConsultantClient.consultant_id == consultant_id,
                    ConsultantClient.company_id == company_id,
                    ConsultantClient.is_active == True
                )
            )\
            .first()
        
        if existing:
            existing.is_primary = is_primary
            db.commit()
            db.refresh(existing)
            return existing
        
        assignment = ConsultantClient(
            consultant_id=consultant_id,
            company_id=company_id,
            assigned_date=datetime.utcnow(),
            is_primary=is_primary,
            is_active=True,
            notes=notes
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        return assignment
    
    def update_performance(
        self, 
        db: Session, 
        *, 
        consultant_id: UUID, 
        company_id: UUID,
        metric_type: str,
        value: float = 1
    ) -> Optional[ConsultantClient]:
        """Update client assignment performance metrics"""
        assignment = db.query(ConsultantClient)\
            .filter(
                and_(
                    ConsultantClient.consultant_id == consultant_id,
                    ConsultantClient.company_id == company_id
                )
            )\
            .first()
        
        if assignment:
            if metric_type == "placement":
                assignment.total_placements += int(value)
                assignment.jobs_filled += int(value)
            elif metric_type == "revenue":
                assignment.revenue_generated = (assignment.revenue_generated or 0) + value
            elif metric_type == "active_job":
                assignment.active_jobs = int(value)
            
            db.commit()
            db.refresh(assignment)
        
        return assignment


# Create CRUD instances
consultant_profile = CRUDConsultantProfile(ConsultantProfile)
consultant_target = CRUDConsultantTarget(ConsultantTarget)
consultant_performance_review = CRUDConsultantPerformanceReview(ConsultantPerformanceReview)
consultant_candidate = CRUDConsultantCandidate(ConsultantCandidate)
consultant_client = CRUDConsultantClient(ConsultantClient)