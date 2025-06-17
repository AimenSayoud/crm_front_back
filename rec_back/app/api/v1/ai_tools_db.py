from fastapi import APIRouter, HTTPException, Body, File, UploadFile, Depends
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
import logging
from uuid import UUID

# Import Pydantic models
from app.models.ai_tools_models import (
    CVAnalysisRequest, CVAnalysisResponse, 
    CandidateFeedbackRequest, CandidateFeedbackResponse,
    JobMatchRequest, JobMatchResponseItem,
    EmailGenerationRequest, EmailGenerationResponse,
    InterviewQuestionsRequest, InterviewQuestionItem,
    JobDescriptionRequest, JobDescriptionResponse,
    EmailTemplateInfoResponseItem,
    ChatCompletionRequest, ChatCompletionResponse
)

# Import document parser
from app.services.document_parser import DocumentParser

# Import database dependency
from app.api.v1.deps import get_database, get_current_active_user

# Import the database-driven AI service
from app.services.ai_service_db import ai_service_db

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/analyze-cv", response_model=CVAnalysisResponse)
async def analyze_cv_db_endpoint(
    request_data: CVAnalysisRequest,
    db: Session = Depends(get_database)
):
    """Analyze CV text using the database-driven AI service"""
    try:
        analysis = ai_service_db.analyze_cv_with_openai(request_data.cv_text, db)
        logger.info(f"Successfully analyzed CV with DB service. Skills extracted: {len(analysis.get('skills', []))}")
        
        # Save to candidate profile if candidate_id is provided
        if hasattr(request_data, 'candidate_id') and request_data.candidate_id:
            save_result = ai_service_db.save_cv_analysis_to_candidate(
                analysis, 
                str(request_data.candidate_id), 
                db
            )
            if save_result:
                logger.info(f"Successfully saved CV analysis to candidate {request_data.candidate_id}")
            else:
                logger.warning(f"Failed to save CV analysis to candidate {request_data.candidate_id}")
        
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing CV with DB service: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error analyzing CV: {str(e)}")

@router.post("/analyze-cv-with-job-match")
async def analyze_cv_with_job_match_db_endpoint(
    request_data: CVAnalysisRequest,
    db: Session = Depends(get_database)
):
    """Analyze CV text and match with suitable jobs using the database-driven AI service"""
    try:
        # Step 1: Analyze CV
        cv_analysis = ai_service_db.analyze_cv_with_openai(request_data.cv_text, db)
        logger.info(f"Successfully analyzed CV with DB service. Skills extracted: {len(cv_analysis.get('skills', []))}")
        
        # Step 2: Match with jobs
        job_matches = ai_service_db.match_jobs_with_openai(
            cv_analysis=cv_analysis,
            db=db,
            max_jobs_to_match=5
        )
        logger.info(f"Successfully matched CV with {len(job_matches)} jobs using DB service")
        
        # Step 3: Save to candidate profile if candidate_id is provided
        if hasattr(request_data, 'candidate_id') and request_data.candidate_id:
            save_result = ai_service_db.save_cv_analysis_to_candidate(
                cv_analysis,
                str(request_data.candidate_id),
                db
            )
            if save_result:
                logger.info(f"Successfully saved CV analysis to candidate {request_data.candidate_id}")
            else:
                logger.warning(f"Failed to save CV analysis to candidate {request_data.candidate_id}")
        
        # Return combined result
        return {
            "cv_analysis": cv_analysis,
            "job_matches": job_matches
        }
    except Exception as e:
        logger.error(f"Error analyzing CV and matching jobs with DB service: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error analyzing CV and matching jobs: {str(e)}")

@router.post("/match-jobs", response_model=List[JobMatchResponseItem])
async def match_jobs_db_endpoint(
    request_data: JobMatchRequest,
    db: Session = Depends(get_database)
):
    """Match CV against jobs with database-driven AI service"""
    try:
        matches = ai_service_db.match_jobs_with_openai(
            cv_analysis=request_data.cv_analysis.model_dump(),  # Pass as dict
            db=db,
            job_id=str(request_data.job_id) if request_data.job_id else None,
            max_jobs_to_match=request_data.max_jobs_to_match or 5
        )
        logger.info(f"Successfully matched CV against {len(matches)} jobs using DB service")
        return matches
    except Exception as e:
        logger.error(f"Error matching jobs with DB service: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error matching jobs: {str(e)}")

@router.post("/generate-email", response_model=EmailGenerationResponse)
async def generate_email_db_endpoint(
    request_data: EmailGenerationRequest,
    db: Session = Depends(get_database)
):
    """Generate a personalized email based on template and context using database-driven AI service"""
    try:
        template_identifier = request_data.template_id
        if not template_identifier:
            raise HTTPException(status_code=400, detail="Template ID is required")
        
        # Allow using either a UUID or a template_type string
        try:
            # First try to parse as UUID
            from uuid import UUID
            template_id = str(UUID(template_identifier))
            result = ai_service_db.generate_email_with_openai(
                template_id=template_id,
                context=request_data.context,
                db=db,
                lookup_by_id=True
            )
        except ValueError:
            # If not a UUID, try as template_type
            result = ai_service_db.generate_email_with_openai(
                template_id=template_identifier,
                context=request_data.context,
                db=db,
                lookup_by_id=False
            )
        logger.info(f"Successfully generated email using template {template_identifier} with DB service")
        return result
    except Exception as e:
        logger.error(f"Error generating email with DB service: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating email: {str(e)}")

@router.get("/email-templates", response_model=List[EmailTemplateInfoResponseItem])
async def get_email_templates_db_endpoint(
    db: Session = Depends(get_database)
):
    """Get available email templates from the database"""
    try:
        templates_data = ai_service_db.get_email_templates(db)
        
        formatted_templates = [
            EmailTemplateInfoResponseItem(
                id=template["id"],
                name=template["name"],
                subject=template["subject"],
                description=template.get("purpose", f"Template for {template['name']}"),
                placeholders=ai_service_db._extract_placeholders(template["template"])
            )
            for template in templates_data
        ]
        return formatted_templates
    except Exception as e:
        logger.error(f"Error retrieving email templates from DB: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving email templates: {str(e)}")

@router.get("/candidates/{candidate_id}/email-context", response_model=Dict[str, Any])
async def get_candidate_email_context_db_endpoint(
    candidate_id: str,
    db: Session = Depends(get_database)
):
    """Get candidate data for email context from the database"""
    try:
        context = ai_service_db._get_candidate_email_context_data(candidate_id, db)
        if not context:
            raise HTTPException(status_code=404, detail="Candidate context not found")
        return context
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving candidate email context from DB: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving candidate context: {str(e)}")

@router.post("/analyze-cv-file")
async def analyze_cv_file_db_endpoint(
    file: UploadFile = File(...),
    candidate_id: Optional[UUID] = None,
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_database)
):
    """Analyze CV from uploaded file using the database-driven AI service"""
    try:
        # Validate file size (10MB limit)
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        file_content = await file.read()
        
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413, 
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE/1024/1024:.1f}MB"
            )
        
        # Get file info
        file_info = DocumentParser.get_file_info(
            file_content, 
            file.content_type or "", 
            file.filename or ""
        )
        
        # Validate file type
        if not file_info["is_supported"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type: {file.content_type}. Supported types: PDF, DOCX, TXT"
            )
        
        logger.info(f"Processing file: {file_info}")
        
        # Extract text from file
        cv_text = DocumentParser.extract_text_from_file(
            file_content, 
            file.content_type or "", 
            file.filename or ""
        )
        
        # Validate extracted text
        if not cv_text or len(cv_text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail="Insufficient text extracted from file. Please ensure the file contains readable CV content."
            )
        
        logger.info(f"Successfully extracted {len(cv_text)} characters from file")
        
        # Use database-driven CV analysis logic
        cv_analysis = ai_service_db.analyze_cv_with_openai(cv_text, db)
        logger.info(f"Successfully analyzed CV with DB service. Skills extracted: {len(cv_analysis.get('skills', []))}")
        
        # Match with jobs
        job_matches = ai_service_db.match_jobs_with_openai(
            cv_analysis=cv_analysis,
            db=db,
            max_jobs_to_match=5
        )
        logger.info(f"Successfully matched CV with {len(job_matches)} jobs using DB service")
        
        # Save to database if candidate_id or user_id is provided
        saved_candidate_id = None
        if candidate_id:
            # Update existing candidate profile
            save_result = ai_service_db.save_cv_analysis_to_candidate(
                cv_analysis,
                str(candidate_id),
                db
            )
            if save_result:
                logger.info(f"Successfully saved CV analysis to candidate {candidate_id}")
                saved_candidate_id = str(candidate_id)
            else:
                logger.warning(f"Failed to save CV analysis to candidate {candidate_id}")
        elif user_id:
            # Create or update candidate profile for this user
            saved_candidate_id = ai_service_db.save_cv_analysis_for_new_candidate(
                cv_analysis,
                str(user_id),
                db
            )
            if saved_candidate_id:
                logger.info(f"Successfully saved CV analysis to new/existing candidate profile for user {user_id}")
            else:
                logger.warning(f"Failed to save CV analysis to candidate profile for user {user_id}")
        
        return {
            "cv_analysis": cv_analysis,
            "job_matches": job_matches,
            "extracted_text_length": len(cv_text),
            "file_info": file_info,
            "processing_method": "db_file_upload",
            "saved_to_candidate_id": saved_candidate_id
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except ValueError as e:
        logger.error(f"File processing error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error analyzing CV file with DB service: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error analyzing CV file: {str(e)}")

# NEW ENDPOINTS BELOW

@router.post("/generate-interview-questions", response_model=List[InterviewQuestionItem])
async def generate_interview_questions_db_endpoint(
    request_data: InterviewQuestionsRequest,
    db: Session = Depends(get_database)
):
    """Generate interview questions based on job description and optional candidate info using database-driven AI service"""
    try:
        # Format job details
        job_details = request_data.job_description.model_dump()
        
        # Format candidate info if provided
        candidate_info = request_data.candidate_info.model_dump() if request_data.candidate_info else None
        
        # Check if job_id is provided to get additional details from database
        if job_details.get("job_id"):
            job_id = str(job_details["job_id"])
            job_data = ai_service_db.get_job_by_id(db, job_id)
            if job_data:
                # Enrich job details with database data
                job_details.update({
                    "title": job_data.get("title", job_details.get("title")),
                    "company_name": job_data.get("company_name", job_details.get("company_name")),
                    "description": job_data.get("description", job_details.get("description")),
                    "requirements": job_data.get("requirements", job_details.get("requirements")),
                    "skills": [s["name"] for s in job_data.get("skills", [])]
                })
        
        # Similarly, enrich candidate info if candidate_id is provided
        if candidate_info and candidate_info.get("candidate_id"):
            candidate_id = str(candidate_info["candidate_id"])
            candidate_data = ai_service_db.get_candidate_by_id(db, candidate_id)
            if candidate_data:
                # Enrich candidate info with database data
                candidate_info.update({
                    "first_name": candidate_data.get("first_name", candidate_info.get("first_name")),
                    "last_name": candidate_data.get("last_name", candidate_info.get("last_name")),
                    "skills": [s["name"] for s in candidate_data.get("skills", [])],
                    "current_position": candidate_data.get("current_position", candidate_info.get("current_position")),
                    "years_of_experience": candidate_data.get("years_of_experience", candidate_info.get("years_of_experience"))
                })
        
        # Generate interview questions using the service
        # Note: The service needs to be adapted to handle DB session
        questions = ai_service_db.generate_interview_questions(
            job_details=job_details,
            candidate_info=candidate_info,
            db=db
        )
        
        logger.info(f"Successfully generated {len(questions)} interview questions with DB service")
        return questions
    except Exception as e:
        logger.error(f"Error generating interview questions with DB service: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating interview questions: {str(e)}")

@router.post("/generate-job-description", response_model=JobDescriptionResponse)
async def generate_job_description_db_endpoint(
    request_data: JobDescriptionRequest,
    db: Session = Depends(get_database)
):
    """Generate a comprehensive job description using database-driven AI service"""
    try:
        # Use database-driven AI service to generate job description
        job_description = ai_service_db.generate_job_description(
            position=request_data.position,
            company_name=request_data.company_name,
            industry=request_data.industry,
            required_skills=request_data.required_skills
        )
        
        logger.info(f"Successfully generated job description for {request_data.position} at {request_data.company_name} with DB service")
        return job_description
    except Exception as e:
        logger.error(f"Error generating job description with DB service: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating job description: {str(e)}")

@router.post("/chat-completion", response_model=ChatCompletionResponse)
async def chat_completion_db_endpoint(
    request_data: ChatCompletionRequest,
    db: Session = Depends(get_database)
):
    """
    Generic chat completion endpoint using database-driven AI service.
    This allows for general conversational AI capabilities with access to database context.
    """
    try:
        # Check if OpenAI client is available
        if not ai_service_db.client:
            raise HTTPException(status_code=503, detail="AI service is not available.")
        
        # Get additional context from database based on message content
        # This is optional enhancement to provide more context from DB
        enhanced_messages = request_data.messages.copy()
        
        # Extract message to add context (using last user message)
        user_messages = [m for m in enhanced_messages if m.role == "user"]
        if user_messages:
            last_user_message = user_messages[-1].content
            
            # Check if message mentions candidates, jobs, skills, etc.
            # and add relevant database context
            # This is a placeholder for potential database integration
            
        # Call OpenAI API
        response = ai_service_db.client.chat.completions.create(
            model=ai_service_db.DEFAULT_MODEL,
            messages=[msg.model_dump() for msg in enhanced_messages],
            temperature=0.7,  # Slightly higher for chat
        )
        
        content = response.choices[0].message.content
        if not content:
            raise HTTPException(status_code=500, detail="AI returned empty content.")
            
        logger.info(f"Successfully processed chat completion with DB service")
        return ChatCompletionResponse(content=content)
    except Exception as e:
        logger.error(f"Error in chat completion with DB service: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error in chat completion: {str(e)}")

@router.post("/generate-candidate-feedback", response_model=CandidateFeedbackResponse)
async def generate_candidate_feedback_db_endpoint(
    request_data: CandidateFeedbackRequest,
    db: Session = Depends(get_database)
):
    """Generate professional feedback for a candidate using database-driven AI service"""
    try:
        candidate_info = request_data.candidate
        
        # If candidate ID is provided, get more details from database
        if candidate_info.get("id"):
            candidate_id = str(candidate_info["id"])
            db_candidate = ai_service_db.get_candidate_by_id(db, candidate_id)
            if db_candidate:
                # Enrich with database data
                candidate_info.update({
                    "firstName": db_candidate.get("first_name", candidate_info.get("firstName", "")),
                    "lastName": db_candidate.get("last_name", candidate_info.get("lastName", "")),
                    "position": db_candidate.get("current_position", candidate_info.get("position", "")),
                    "skills": [s["name"] for s in db_candidate.get("skills", [])],
                    "experience": []  # We would need to transform from DB format
                })
        
        # Format candidate name
        candidate_name = f"{candidate_info.get('firstName', '')} {candidate_info.get('lastName', '')}"
        position = candidate_info.get('position', 'the role')
        
        # Use the AI service to generate feedback
        # Note: The service needs to be adapted to handle DB session
        feedback = ai_service_db.generate_candidate_feedback(
            candidate_name=candidate_name,
            position=position,
            skills=candidate_info.get('skills', []),
            experience=candidate_info.get('experience', []),
            db=db
        )
        
        logger.info(f"Successfully generated feedback for candidate: {candidate_name} with DB service")
        return {"feedback": feedback}
    except Exception as e:
        logger.error(f"Error generating candidate feedback with DB service: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating candidate feedback: {str(e)}")