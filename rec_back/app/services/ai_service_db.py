import re
import json
import os
import logging
from typing import Dict, List, Tuple, Any, Optional, Union
from sqlalchemy.orm import Session
from sqlalchemy import desc
from openai import OpenAI, APIError
from dotenv import load_dotenv
import datetime

# Import models and schemas
from app.models.candidate import CandidateProfile, CandidateSkill
from app.models.job import Job, JobSkillRequirement
from app.models.skill import Skill
from app.models.messaging import EmailTemplate
from app.models.company import Company
from app.models.user import User
from app.models.application import Application
from app.models.enums import UserRole, ProficiencyLevel

# --- Configuration & Constants ---

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEFAULT_MODEL = "gpt-4o-mini"  # Use a consistent model name

# --- Prompt Templates ---

SYSTEM_PROMPTS = {
    "cv_analysis": """You are an expert recruitment assistant specialized in analyzing CVs/resumes and extracting structured information.
Focus on accurately identifying skills, education history, work experience, calculating total experience, and creating a professional summary.
Always format your response as a well-structured JSON object.""",
    "job_matching": """You are an expert AI recruitment matching system.
Your task is to evaluate how well a candidate's profile matches job requirements based on skills, experience, and education.
Provide a match score (0-100), identify matching and missing skills, explain your reasoning concisely, and suggest an improvement area.
Format your response as a JSON array of match objects, sorted by score descending.""",
    "email_generation": """You are an expert recruitment consultant who writes clear, professional, and personalized emails.
Create emails that are warm yet professional, concise (under 250 words), informative, and tailored to the recipient (candidate or company).
Maintain appropriate formality, ensure accuracy, and include a clear call to action.""",
    "interview_questions": """You are an expert recruitment interview specialist.
Generate insightful, job-specific interview questions (7-10) to assess technical skills, cultural fit, and experience.
Create a mix of behavioral, situational, and technical questions.
If candidate details are provided, tailor some questions accordingly.
Each question should include its purpose and evaluation guidance.""",
    "job_description": """You are an expert recruitment content writer specializing in job descriptions.
Create compelling, detailed, and well-structured job descriptions (400-600 words) that attract qualified candidates.
Focus on clear responsibilities, specific requirements (required/preferred), necessary skills, benefits, and company information.
The tone should be professional but engaging, avoiding discriminatory language or unrealistic expectations."""
}

USER_PROMPT_TEMPLATES = {
    "cv_analysis": """
Please analyze the following CV/resume text and extract the information into a structured JSON format.

CV TEXT:
{cv_text}

REQUIRED JSON STRUCTURE:
{{
  "skills": ["skill1", "skill2", ...], // Comprehensive list of technical and soft skills
  "education": [
    {{
      "degree": "...",
      "institution": "...",
      "field": "...", // Field of study if available
      "start_year": "...", // Optional
      "end_year": "..." // Optional
    }},
    ...
  ],
  "experience": [
    {{
      "title": "...",
      "company": "...",
      "duration": "...", // e.g., "Jan 2020 - Present" or "3 years"
      "start_date": "...", // Optional (YYYY-MM)
      "end_date": "...", // Optional (YYYY-MM or "Present")
      "current": true/false, // Indicate if it's the current role
      "responsibilities": ["...", "...", ...] // Key responsibilities/achievements
    }},
    ...
  ],
  "total_experience_years": X, // Calculated total years of professional experience
  "summary": "..." // Professional summary (3-4 sentences) highlighting key qualifications
}}
""",
    "job_matching": """
Match the following candidate profile against the provided job positions.

CANDIDATE PROFILE:
{candidate_info_json}

JOB POSITIONS:
{job_descriptions_json}

For each job position, provide:
1. A match score (0-100) considering skills, experience, and education.
2. A list of the candidate's skills that match the job requirements.
3. A list of important job skills the candidate appears to be missing.
4. A brief explanation (2-3 sentences) of the match quality.
5. One specific suggestion for how the candidate could improve their fit for the role.

Return the results as a JSON array, sorted by match score (highest first):
[
  {{
    "job_id": number,
    "job_title": string,
    "company_name": string,
    "match_score": number (0-100),
    "matching_skills": [list of strings],
    "non_matching_skills": [list of strings],
    "match_explanation": string,
    "improvement_suggestion": string
  }}
]
""",
    "email_generation": """
Generate a personalized, professional email based on the provided template and context.

TEMPLATE TYPE: {template_id} ({template_purpose})
RECIPIENT TYPE: {recipient_type}

ORIGINAL SUBJECT: {base_subject}
ORIGINAL TEMPLATE CONTENT (Placeholders filled with basic context):
{base_template}

DETAILED CONTEXT:
{enhanced_context_json}

Enhance this email to be:
1. More personalized and specific to the recipient's situation.
2. Professional yet warm in tone.
3. Clear, concise (under 250 words), and well-structured.
4. Include a clear call to action or outline next steps.

Return a JSON object with:
- "subject": An improved, attention-grabbing subject line.
- "greeting": A personalized greeting (e.g., "Dear John Doe,").
- "body": The complete enhanced email body text (excluding greeting and signature).
- "call_to_action": The specific next step for the recipient (should also be integrated into the body).
""",
    "interview_questions": """
Generate 7-10 high-quality interview questions for the position detailed below{candidate_context_intro}.

JOB DETAILS:
{job_context_json}
{candidate_context_section}
Create questions that:
1. Assess required technical skills and competencies.
2. Evaluate cultural fit and soft skills (e.g., communication, teamwork).
3. Probe relevant experience and achievements using behavioral/situational formats (STAR method).
{candidate_tailoring_instruction}
5. Cover a mix of question types (behavioral, situational, technical).

For each question, include the question text, its purpose (what it assesses), and evaluation guidance (what to look for in the answer).

Format the response as a JSON array of question objects:
[
  {{
    "question": "Question text here",
    "purpose": "What this question aims to assess",
    "evaluation_guidance": "What to look for in the candidate's answer (e.g., specific examples, clarity, logic)"
  }}
]
""",
    "job_description": """
Generate a comprehensive and engaging job description based on the provided details.

POSITION: {position}
COMPANY: {company_name}
INDUSTRY: {industry_info}
REQUIRED SKILLS (Initial list): {skills_list}

Include these sections in the job description:
1.  **Job Title**: The official title.
2.  **Company Overview**: Brief, compelling intro to {company_name}{industry_context}.
3.  **Role Summary**: Concise overview of the position's purpose and impact.
4.  **Key Responsibilities**: 5-7 specific, action-oriented duties.
5.  **Required Qualifications**: 4-6 essential qualifications (education, experience).
6.  **Preferred Qualifications**: 2-4 desirable, nice-to-have qualifications.
7.  **Required Skills**: List of essential technical and soft skills (expand on the initial list if appropriate).
8.  **Benefits & Perks**: Highlight key offerings (e.g., health, PTO, development).
9.  **Location & Work Environment**: Office location, remote options, team culture aspects.
10. **Application Process**: Clear instructions on how to apply.

Guidelines:
- Total length: 400-600 words.
- Use clear, inclusive language, avoiding jargon.
- Focus on impact and growth opportunities.
- Ensure requirements are realistic.
- Mention salary range if standard practice for this role/company.

Format the response as a JSON object containing each section as a key-value pair (strings or lists of strings for bullet points), plus a "full_text" key containing the complete formatted job description:
{{
  "title": "...",
  "company_overview": "...",
  "role_summary": "...",
  "key_responsibilities": ["...", ...],
  "required_qualifications": ["...", ...],
  "preferred_qualifications": ["...", ...],
  "required_skills": ["...", ...],
  "benefits": ["...", ...],
  "location_environment": "...",
  "application_process": "...",
  "full_text": "Complete formatted job description text..."
}}
"""
}

# --- AIService Class ---

class AIServiceDB:
    """
    Service for AI-powered recruitment functionalities using OpenAI with real database data.
    """

    def __init__(self):
        """Initialize the AIService, set up OpenAI client."""
        self.client = self._initialize_openai_client()
        self.system_prompts = SYSTEM_PROMPTS
        self.user_prompt_templates = USER_PROMPT_TEMPLATES

    def _initialize_openai_client(self) -> Optional[OpenAI]:
        """Initializes and returns the OpenAI client if the API key is available."""
        if OPENAI_API_KEY:
            try:
                client = OpenAI(api_key=OPENAI_API_KEY)
                logger.info("OpenAI client initialized successfully.")
                return client
            except APIError as e:
                logger.error(f"OpenAI API error during initialization: {e}")
                return None
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
                return None
        else:
            logger.warning(
                "OPENAI_API_KEY not found in environment variables. "
                "AI features requiring OpenAI will use fallback methods."
            )
            return None

    # --- Database Query Methods ---

    def get_candidates(self, db: Session, limit: int = 100) -> List[Dict[str, Any]]:
        """Get candidate profiles from database."""
        candidates_db = db.query(CandidateProfile).limit(limit).all()
        candidates = []
        
        for candidate in candidates_db:
            # Get user data
            user = db.query(User).filter(User.id == candidate.user_id).first()
            
            # Get skills
            skills_db = db.query(CandidateSkill).filter(
                CandidateSkill.candidate_id == candidate.id
            ).all()
            
            skills = []
            for skill_rel in skills_db:
                skill = db.query(Skill).filter(Skill.id == skill_rel.skill_id).first()
                if skill:
                    skills.append({
                        "id": str(skill.id),
                        "name": skill.name,
                        "proficiency": skill_rel.proficiency_level.value if skill_rel.proficiency_level else None,
                        "years": skill_rel.years_experience
                    })
            
            # Format candidate data
            candidate_data = {
                "id": str(candidate.id),
                "user_id": str(candidate.user_id),
                "first_name": user.first_name if user else "",
                "last_name": user.last_name if user else "",
                "email": user.email if user else "",
                "current_position": candidate.current_position,
                "current_company": candidate.current_company,
                "summary": candidate.summary,
                "years_of_experience": candidate.years_of_experience,
                "location": candidate.location,
                "city": candidate.city,
                "country": candidate.country,
                "skills": skills,
                "profile_completed": candidate.profile_completed,
                "is_open_to_opportunities": candidate.is_open_to_opportunities,
            }
            
            candidates.append(candidate_data)
            
        return candidates

    def get_candidate_by_id(self, db: Session, candidate_id: str) -> Dict[str, Any]:
        """Get a specific candidate profile from database."""
        candidate = db.query(CandidateProfile).filter(
            CandidateProfile.id == candidate_id
        ).first()
        
        if not candidate:
            return {}
            
        # Get user data
        user = db.query(User).filter(User.id == candidate.user_id).first()
        
        # Get skills
        skills_db = db.query(CandidateSkill).filter(
            CandidateSkill.candidate_id == candidate.id
        ).all()
        
        skills = []
        for skill_rel in skills_db:
            skill = db.query(Skill).filter(Skill.id == skill_rel.skill_id).first()
            if skill:
                skills.append({
                    "id": str(skill.id),
                    "name": skill.name,
                    "proficiency": skill_rel.proficiency_level.value if skill_rel.proficiency_level else None,
                    "years": skill_rel.years_experience
                })
        
        # Format candidate data
        candidate_data = {
            "id": str(candidate.id),
            "user_id": str(candidate.user_id),
            "first_name": user.first_name if user else "",
            "last_name": user.last_name if user else "",
            "email": user.email if user else "",
            "current_position": candidate.current_position,
            "current_company": candidate.current_company,
            "summary": candidate.summary,
            "years_of_experience": candidate.years_of_experience,
            "location": candidate.location,
            "city": candidate.city,
            "country": candidate.country,
            "skills": skills,
            "profile_completed": candidate.profile_completed,
            "is_open_to_opportunities": candidate.is_open_to_opportunities,
        }
        
        return candidate_data

    def get_jobs(self, db: Session, limit: int = 100) -> List[Dict[str, Any]]:
        """Get job listings from database."""
        jobs_db = db.query(Job).order_by(desc(Job.created_at)).limit(limit).all()
        jobs = []
        
        for job in jobs_db:
            # Get company data
            company = db.query(Company).filter(Company.id == job.company_id).first()
            
            # Get skill requirements
            skill_reqs_db = db.query(JobSkillRequirement).filter(
                JobSkillRequirement.job_id == job.id
            ).all()
            
            skills = []
            for skill_req in skill_reqs_db:
                skill = db.query(Skill).filter(Skill.id == skill_req.skill_id).first()
                if skill:
                    skills.append({
                        "id": str(skill.id),
                        "name": skill.name,
                        "required": skill_req.is_required,
                        "proficiency": skill_req.proficiency_level.value if skill_req.proficiency_level else None,
                        "years": skill_req.years_experience
                    })
            
            # Format job data
            job_data = {
                "id": str(job.id),
                "title": job.title,
                "company_id": str(job.company_id),
                "company_name": company.name if company else "Unknown Company",
                "description": job.description,
                "responsibilities": job.responsibilities,
                "requirements": job.requirements,
                "location": job.location,
                "contract_type": job.contract_type.value if job.contract_type else None,
                "job_type": job.job_type.value if job.job_type else None,
                "experience_level": job.experience_level.value if job.experience_level else None,
                "is_remote": job.is_remote,
                "is_hybrid": job.is_hybrid,
                "salary_min": job.salary_min,
                "salary_max": job.salary_max,
                "salary_currency": job.salary_currency,
                "status": job.status.value if job.status else None,
                "posting_date": job.posting_date.isoformat() if job.posting_date else None,
                "deadline_date": job.deadline_date.isoformat() if job.deadline_date else None,
                "skills": skills,
            }
            
            jobs.append(job_data)
            
        return jobs

    def get_job_by_id(self, db: Session, job_id: str) -> Dict[str, Any]:
        """Get a specific job listing from database."""
        job = db.query(Job).filter(Job.id == job_id).first()
        
        if not job:
            return {}
            
        # Get company data
        company = db.query(Company).filter(Company.id == job.company_id).first()
        
        # Get skill requirements
        skill_reqs_db = db.query(JobSkillRequirement).filter(
            JobSkillRequirement.job_id == job.id
        ).all()
        
        skills = []
        for skill_req in skill_reqs_db:
            skill = db.query(Skill).filter(Skill.id == skill_req.skill_id).first()
            if skill:
                skills.append({
                    "id": str(skill.id),
                    "name": skill.name,
                    "required": skill_req.is_required,
                    "proficiency": skill_req.proficiency_level.value if skill_req.proficiency_level else None,
                    "years": skill_req.years_experience
                })
        
        # Format job data
        job_data = {
            "id": str(job.id),
            "title": job.title,
            "company_id": str(job.company_id),
            "company_name": company.name if company else "Unknown Company",
            "description": job.description,
            "responsibilities": job.responsibilities,
            "requirements": job.requirements,
            "location": job.location,
            "contract_type": job.contract_type.value if job.contract_type else None,
            "job_type": job.job_type.value if job.job_type else None,
            "experience_level": job.experience_level.value if job.experience_level else None,
            "is_remote": job.is_remote,
            "is_hybrid": job.is_hybrid,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "salary_currency": job.salary_currency,
            "status": job.status.value if job.status else None,
            "posting_date": job.posting_date.isoformat() if job.posting_date else None,
            "deadline_date": job.deadline_date.isoformat() if job.deadline_date else None,
            "skills": skills,
        }
        
        return job_data

    def get_skills(self, db: Session) -> List[Dict[str, Any]]:
        """Get skills from database."""
        skills_db = db.query(Skill).all()
        
        skills = []
        for skill in skills_db:
            # Determine if skill is technical based on category name if available
            is_technical = False
            if skill.category:
                # Assume skills are technical if category contains words like "technical", "programming", etc.
                technical_categories = ["technical", "programming", "development", "engineering", "software", "data"]
                category_name = skill.category.name.lower() if skill.category.name else ""
                is_technical = any(tech_word in category_name for tech_word in technical_categories)
            
            skills.append({
                "id": str(skill.id),
                "name": skill.name,
                "category": skill.category.name if skill.category else None,
                "is_technical": is_technical,  # Derived from category
            })
            
        return skills

    def get_email_templates(self, db: Session) -> List[Dict[str, Any]]:
        """Get email templates from database."""
        templates_db = db.query(EmailTemplate).all()
        
        templates = []
        for template in templates_db:
            templates.append({
                "id": str(template.id),
                "name": template.name,
                "subject": template.subject,
                "template": template.body,  # Using body field from model
                "purpose": template.description,
                "category": template.category,
                "is_active": template.is_active,
                "template_type": template.template_type,  # Important for lookup by type
                "metadata": template.conversation_metadata  # Using the correct column name
            })
            
        return templates

    def get_skill_lookup(self, db: Session) -> Dict[str, str]:
        """Get skill ID to name lookup dictionary."""
        skills = self.get_skills(db)
        return {skill["id"]: skill["name"] for skill in skills}

    def get_normalized_skill_lookup(self, db: Session) -> Dict[str, str]:
        """Get normalized skill name to ID lookup dictionary."""
        skills = self.get_skills(db)
        return {skill["name"].lower(): skill["id"] for skill in skills}

    # --- Prompt Formatting Helper ---

    def _format_user_prompt(self, template_key: str, context: Dict[str, Any]) -> str:
        """Formats a user prompt using a template key and context dictionary."""
        template = self.user_prompt_templates.get(template_key)
        if not template:
            raise ValueError(f"User prompt template key '{template_key}' not found.")
        try:
            # Use format_map for safer formatting (doesn't fail on missing keys)
            return template.format_map(context)
        except KeyError as e:
            logger.error(f"Missing key in context for prompt template '{template_key}': {e}")
            raise ValueError(f"Missing context key for prompt: {e}") from e
        except Exception as e:
            logger.error(f"Error formatting prompt template '{template_key}': {e}")
            raise

    # --- OpenAI API Call Helper ---

    def _call_openai_api(self,
                        task_key: str,
                        user_prompt: str,
                        model: str = DEFAULT_MODEL,
                        temperature: float = 0.2,
                        response_format: Optional[Dict[str, str]] = {"type": "json_object"}) -> Optional[Dict[str, Any]]:
        """
        Calls the OpenAI Chat Completion API and handles common errors.

        Args:
            task_key: Key to retrieve the system prompt (e.g., "cv_analysis").
            user_prompt: The formatted user prompt.
            model: The OpenAI model to use.
            temperature: The creativity level (0.0 to 1.0).
            response_format: The expected response format (e.g., {"type": "json_object"}).

        Returns:
            The parsed JSON response as a dictionary, or None if an error occurs.
        """
        if not self.client:
            logger.warning(f"OpenAI client not available. Cannot perform '{task_key}'.")
            return None

        system_prompt = self.system_prompts.get(task_key)
        if not system_prompt:
            logger.error(f"System prompt for task '{task_key}' not found.")
            return None

        try:
            logger.info(f"Calling OpenAI API for task: {task_key} with model: {model}")
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                response_format=response_format,
            )

            response_content = response.choices[0].message.content
            if not response_content:
                logger.warning(f"OpenAI API returned empty content for task '{task_key}'.")
                return None

            logger.debug(f"Raw OpenAI response for {task_key}: {response_content[:200]}...")  # Log snippet

            # Parse the JSON response
            result = json.loads(response_content)
            logger.info(f"Successfully received and parsed response for task: {task_key}")
            return result

        except APIError as e:
            logger.error(f"OpenAI API error during '{task_key}': Status={e.status_code}, Message={e.message}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response from OpenAI for '{task_key}': {e}")
            logger.debug(f"Invalid JSON content received: {response_content}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during OpenAI API call for '{task_key}': {str(e)}")
            return None

    # --- Core AI Methods ---

    def generate_interview_questions(self, job_details: Dict[str, Any], candidate_info: Optional[Dict[str, Any]] = None, db: Optional[Session] = None) -> List[Dict[str, str]]:
        """
        Generates interview questions based on job description and optional candidate info.
        Uses database if provided for additional context.
        
        Args:
            job_details: Dictionary with job description details.
            candidate_info: Optional dictionary with candidate information.
            db: Optional database session for enriched context.
            
        Returns:
            List of interview question objects with question, purpose, and evaluation guidance.
        """
        task_key = "interview_questions"
        
        # Prepare the prompt context
        candidate_context_intro = ""
        candidate_context_section = ""
        candidate_tailoring_instruction = ""
        
        if candidate_info:
            candidate_name = (f"{candidate_info.get('first_name', '')} "
                              f"{candidate_info.get('last_name', '')}").strip()
            candidate_context_intro = f" for {candidate_name}" if candidate_name else ""
            
            # Format candidate context section for the prompt
            candidate_context_section = "\nCANDIDATE PROFILE:\n"
            candidate_context_section += f"Name: {candidate_name}\n"
            
            if candidate_info.get("current_position"):
                candidate_context_section += f"Current Position: {candidate_info['current_position']}\n"
            
            if candidate_info.get("years_of_experience"):
                candidate_context_section += f"Experience: {candidate_info['years_of_experience']} years\n"
                
            if candidate_info.get("skills"):
                skills_str = ", ".join(candidate_info["skills"][:10])  # Limit to 10 skills
                candidate_context_section += f"Skills: {skills_str}\n"
                
            # Add tailoring instruction if we have candidate info
            candidate_tailoring_instruction = "4. Tailor some questions to the candidate's background and experience.\n"
        
        # Format job details for the prompt
        job_context = {
            "title": job_details.get("title", "Not specified"),
            "company": job_details.get("company_name", "Not specified"),
            "description": job_details.get("description", "Not specified"),
            "responsibilities": job_details.get("responsibilities", []),
            "requirements": job_details.get("requirements", []),
            "skills": job_details.get("skills", [])
        }
        
        # Format the prompt
        context = {
            "candidate_context_intro": candidate_context_intro,
            "job_context_json": json.dumps(job_context, indent=2),
            "candidate_context_section": candidate_context_section,
            "candidate_tailoring_instruction": candidate_tailoring_instruction
        }
        user_prompt = self._format_user_prompt(task_key, context)
        
        # Call the OpenAI API
        result = self._call_openai_api(task_key, user_prompt, temperature=0.6)
        
        if result and isinstance(result, list) and all(isinstance(q, dict) for q in result):
            # Ensure all questions have the required fields
            validated_questions = []
            for question in result:
                if "question" in question and "purpose" in question and "evaluation_guidance" in question:
                    validated_questions.append({
                        "question": question["question"],
                        "purpose": question["purpose"],
                        "evaluation_guidance": question["evaluation_guidance"]
                    })
            
            logger.info(f"Generated {len(validated_questions)} interview questions")
            return validated_questions
        else:
            logger.warning("OpenAI interview questions generation failed. Using fallback.")
            return self._generate_basic_interview_questions(job_details)
    
    def generate_candidate_feedback(self, 
                                    candidate_name: str, 
                                    position: str, 
                                    skills: List[str], 
                                    experience: List[Dict[str, Any]],
                                    db: Optional[Session] = None) -> str:
        """
        Generates professional feedback for a candidate based on their profile.
        
        Args:
            candidate_name: The candidate's name.
            position: The position the candidate is being considered for.
            skills: List of the candidate's skills.
            experience: List of the candidate's experience items.
            db: Optional database session for enriched context.
            
        Returns:
            Structured professional feedback as a string.
        """
        if not self.client:
            logger.warning("OpenAI client not available. Using fallback for candidate feedback.")
            return self._generate_basic_candidate_feedback(candidate_name, position, skills)
        
        try:
            # Create a system prompt for the candidate feedback
            system_prompt = """You are an expert recruitment consultant tasked with providing constructive, 
            personalized feedback to job candidates. Your feedback should be professional, balanced, 
            and actionable, highlighting strengths and areas for growth. Focus on how the candidate's 
            skills and experience align with the position they're being considered for."""
            
            # Prepare the user prompt
            user_prompt = f"""Please provide professional feedback for {candidate_name} who is being considered for the position of {position}.

Candidate Profile:
- Name: {candidate_name}
- Position being considered for: {position}
- Skills: {', '.join(skills[:15]) if skills else 'Not provided'}
"""  # Limit to 15 skills
            
            # Add experience if available
            if experience:
                user_prompt += "\nRelevant Experience:\n"
                for exp in experience[:3]:  # Limit to 3 most recent experiences
                    title = exp.get("title", "Role")
                    company = exp.get("company", "Company")
                    duration = exp.get("duration", "Period not specified")
                    user_prompt += f"- {title} at {company}, {duration}\n"
            
            user_prompt += """\nProvide comprehensive feedback covering the following aspects:
1. Strengths based on skills and experience
2. Potential fit for the position
3. Areas for development or improvement
4. Actionable recommendations for career growth

Your feedback should be constructive, specific, and personalized. Format it as a cohesive, professional assessment of 3-4 paragraphs."""
            
            # Call the OpenAI API with a slightly warmer temperature for more personalized feedback
            response = self.client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,  # Slightly warmer for more personalization
            )
            
            feedback = response.choices[0].message.content
            if not feedback:
                raise ValueError("Empty response from OpenAI API")
                
            logger.info(f"Successfully generated candidate feedback for {candidate_name}")
            return feedback
        
        except Exception as e:
            logger.error(f"Error generating candidate feedback: {str(e)}")
            return self._generate_basic_candidate_feedback(candidate_name, position, skills)

    def analyze_cv_with_openai(self, cv_text: str, db: Session) -> Dict[str, Any]:
        """
        Analyzes CV text using OpenAI API for structured information extraction.
        Maps extracted skills to database skills.

        Args:
            cv_text: The CV content as plain text.
            db: Database session.

        Returns:
            Dictionary containing structured CV information.
        """
        task_key = "cv_analysis"
        context = {"cv_text": cv_text}
        user_prompt = self._format_user_prompt(task_key, context)

        result = self._call_openai_api(task_key, user_prompt, temperature=0.1)

        if result:
            # Ensure all expected keys are present, provide defaults
            expected_keys = {
                "skills": [], "education": [], "experience": [],
                "total_experience_years": 0, "summary": ""
            }
            for key, default_value in expected_keys.items():
                if key not in result:
                    logger.warning(f"Key '{key}' missing in CV analysis response, using default: {default_value}")
                    result[key] = default_value

            # Add skill IDs by matching with the database skills
            result["skill_ids"] = self._map_skills_to_ids(result.get("skills", []), db)
            logger.info(f"OpenAI CV analysis successful. Extracted {len(result.get('skills', []))} skills.")
            return result
        else:
            logger.warning("OpenAI CV analysis failed or unavailable. Falling back to rule-based analysis.")
            return self.analyze_cv_fallback(cv_text, db)

    def match_jobs_with_openai(self, 
                              cv_analysis: Dict[str, Any], 
                              db: Session,
                              job_id: Optional[str] = None, 
                              max_jobs_to_match: int = 5) -> List[Dict[str, Any]]:
        """
        Matches a candidate's profile (from CV analysis) against job descriptions using OpenAI.
        Falls back to rule-based matching if API fails or is unavailable.

        Args:
            cv_analysis: Dictionary with CV analysis results.
            db: Database session.
            job_id: Optional specific job ID to match against. If None, matches against recent jobs.
            max_jobs_to_match: Max number of jobs to send to the API if job_id is None.

        Returns:
            List of job matches with scores and explanations, sorted by score.
        """
        task_key = "job_matching"

        # Prepare candidate info
        candidate_info = {
            "skills": cv_analysis.get("skills", []),
            "experience": cv_analysis.get("experience", []),
            "education": cv_analysis.get("education", []),
            "total_experience_years": cv_analysis.get("total_experience_years", 0),
            "summary": cv_analysis.get("summary", "")
        }

        # Select and prepare job descriptions from database
        jobs_to_match = self._select_jobs_for_matching(db, job_id, max_jobs_to_match)
        if not jobs_to_match:
            return []
        
        job_descriptions = [self._prepare_job_description_for_matching(job) for job in jobs_to_match]

        # Format prompt and call API
        context = {
            "candidate_info_json": json.dumps(candidate_info, indent=2),
            "job_descriptions_json": json.dumps(job_descriptions, indent=2)
        }
        user_prompt = self._format_user_prompt(task_key, context)
        result = self._call_openai_api(task_key, user_prompt, temperature=0.2)

        if result:
            # The prompt asks for a direct list in the response
            matches = result if isinstance(result, list) else result.get("matches", [])  # Handle potential wrapping
            if not isinstance(matches, list):
                logger.warning(f"Unexpected response format for job matching. Expected list, got {type(matches)}. Content: {str(matches)[:200]}...")
                matches = []

            # Validate and sort matches
            valid_matches = [m for m in matches if isinstance(m, dict) and "job_id" in m and "match_score" in m]
            valid_matches.sort(key=lambda x: x.get("match_score", 0), reverse=True)
            logger.info(f"OpenAI job matching successful. Found {len(valid_matches)} potential matches.")
            return valid_matches
        else:
            logger.warning("OpenAI job matching failed or unavailable. Falling back to rule-based matching.")
            # Pass necessary info to fallback
            return self.match_jobs_fallback(
                skills=candidate_info["skills"],
                experience_years=candidate_info["total_experience_years"],
                db=db
            )

    def generate_email_with_openai(self, template_id: str, context: Dict[str, Any], db: Session, lookup_by_id: bool = True) -> Dict[str, str]:
        """
        Generates a personalized email using OpenAI based on a template and context.
        Falls back to simple template filling if API fails or is unavailable.

        Args:
            template_id: The ID or template_type of the email template.
            context: Dictionary with context for personalization (e.g., candidate_name, job_title).
            db: Database session.
            lookup_by_id: Whether to look up template by ID (True) or template_type (False)

        Returns:
            Dictionary with "subject" and "body" of the generated email.
        """
        task_key = "email_generation"

        # Get base template from database
        templates = self.get_email_templates(db)
        
        # Find the template based on lookup method
        if lookup_by_id:
            template = next((t for t in templates if str(t["id"]) == template_id), None)
        else:
            # Look up by template_type instead
            template = next((t for t in templates if t.get("template_type") == template_id), None)
        
        if not template:
            logger.error(f"Email template with {'ID' if lookup_by_id else 'type'} '{template_id}' not found.")
            # Return a default error email or raise? For now, return basic
            return {"subject": "Error: Template Not Found", "body": f"Could not find email template '{template_id}'."}

        base_subject = template["subject"]
        base_template_body = template["template"]  # This field is mapped to the body column in the model

        # Basic placeholder filling for context
        filled_subject = base_subject
        filled_body = base_template_body
        for key, value in context.items():
            placeholder = "{{" + key + "}}"
            str_value = ", ".join(value) if isinstance(value, list) else str(value)
            filled_subject = filled_subject.replace(placeholder, str_value)
            filled_body = filled_body.replace(placeholder, str_value)

        # Prepare enhanced context for OpenAI
        recipient_type = "candidate" if "candidate_name" in context else "company"
        enhanced_context = self._prepare_email_context(template_id, recipient_type, context)

        # Format prompt and call API
        prompt_context = {
            "template_id": template_id,
            "template_purpose": template.get("purpose", template_id.replace("_", " ")),  # Add purpose if available
            "recipient_type": recipient_type,
            "base_subject": base_subject,  # Pass original subject too
            "base_template": filled_body,  # Pass the roughly filled template
            "enhanced_context_json": json.dumps(enhanced_context, indent=2)
        }
        user_prompt = self._format_user_prompt(task_key, prompt_context)
        result = self._call_openai_api(task_key, user_prompt, temperature=0.5)

        if result and isinstance(result, dict) and "subject" in result and "body" in result:
            # Format the final email
            greeting = result.get("greeting", f"Dear {enhanced_context.get('recipient_name', 'Sir/Madam')},")
            body = result.get("body", filled_body)  # Fallback to basic filled body
            call_to_action = result.get("call_to_action", "")

            # Ensure CTA is included if provided separately
            if call_to_action and call_to_action not in body:
                body = f"{body}\n\n{call_to_action}"

            # Add a standard signature (customize as needed)
            signature = "\n\nBest regards,\n[Your Name/Recruiter Name]\n[Your Title]\n[Your Company]"
            formatted_email_body = f"{greeting}\n\n{body}{signature}"

            logger.info(f"OpenAI email generation successful for template '{template_id}'.")
            return {
                "subject": result.get("subject", filled_subject),  # Fallback to basic filled subject
                "body": formatted_email_body
            }
        else:
            logger.warning(f"OpenAI email generation failed or unavailable for template '{template_id}'. Falling back to basic template filling.")
            # Use the initially filled subject and body for fallback
            signature = "\n\nBest regards,\n[Your Name/Recruiter Name]\n[Your Title]\n[Your Company]"
            return {
                "subject": filled_subject,
                "body": f"Dear {enhanced_context.get('recipient_name', 'Sir/Madam')},\n\n{filled_body}{signature}"
            }

    def generate_job_description(self,
                                position: str,
                                company_name: str,
                                industry: Optional[str] = None,
                                required_skills: Optional[List[str]] = None,
                                db: Optional[Session] = None) -> Dict[str, Union[str, List[str]]]:
        """
        Generates a job description using OpenAI.
        Falls back to a basic template if API fails or is unavailable.

        Args:
            position: Job title.
            company_name: Name of the company.
            industry: Optional industry context.
            required_skills: Optional list of initial required skills.

        Returns:
            Dictionary with structured job description sections and full text.
        """
        task_key = "job_description"

        # Prepare context
        context = {
            "position": position,
            "company_name": company_name,
            "industry_info": industry if industry else "N/A",
            "industry_context": f" in the {industry} industry" if industry else "",
            "skills_list": ", ".join(required_skills) if required_skills else "Key skills for the role"
        }

        # Format prompt and call API
        user_prompt = self._format_user_prompt(task_key, context)
        result = self._call_openai_api(task_key, user_prompt, temperature=0.6)

        if result and isinstance(result, dict) and "title" in result and "full_text" in result:
            # Ensure all expected sections are present
            expected_keys = {
                "title": "", "company_overview": "", "role_summary": "",
                "key_responsibilities": [], "required_qualifications": [],
                "preferred_qualifications": [], "required_skills": [],
                "benefits": [], "location_environment": "",
                "application_process": "", "full_text": ""
            }
            for key, default_value in expected_keys.items():
                if key not in result:
                    logger.warning(f"Key '{key}' missing in job description response, using default.")
                    result[key] = default_value

            logger.info(f"OpenAI generated job description for {position} at {company_name}.")
            return result
        else:
            logger.warning(f"OpenAI job description generation failed for {position}. Falling back to basic template.")
            return self._generate_basic_job_description(position, company_name, industry)

    # --- Save to Database Methods ---

    def save_cv_analysis_to_candidate(self, cv_analysis: Dict[str, Any], candidate_id: str, db: Session) -> bool:
        """
        Save CV analysis results to candidate profile in the database.
        
        Args:
            cv_analysis: Dictionary with CV analysis results
            candidate_id: UUID of the candidate profile
            db: Database session
            
        Returns:
            Boolean indicating success
        """
        try:
            candidate = db.query(CandidateProfile).filter(
                CandidateProfile.id == candidate_id
            ).first()
            
            if not candidate:
                logger.error(f"Candidate with ID {candidate_id} not found.")
                return False
                
            # Update candidate profile with basic information
            candidate.summary = cv_analysis.get("summary", candidate.summary)
            candidate.years_of_experience = cv_analysis.get("total_experience_years", candidate.years_of_experience)
            
            # Add skills from analysis
            skill_ids = cv_analysis.get("skill_ids", [])
            existing_skills = db.query(CandidateSkill).filter(
                CandidateSkill.candidate_id == candidate_id
            ).all()
            
            # Get existing skill IDs
            existing_skill_ids = [str(skill.skill_id) for skill in existing_skills]
            
            # Add new skills
            for skill_id in skill_ids:
                if skill_id not in existing_skill_ids:
                    # Create new skill association
                    candidate_skill = CandidateSkill(
                        candidate_id=candidate_id,
                        skill_id=skill_id,
                        proficiency_level=ProficiencyLevel.INTERMEDIATE  # Default to intermediate
                    )
                    db.add(candidate_skill)
            
            # Update education records if available
            if cv_analysis.get("education"):
                # This would require more complex logic to match and merge education records
                # For simplicity, we're not implementing the full education update here
                pass
                
            # Update experience records if available
            if cv_analysis.get("experience"):
                # This would require more complex logic to match and merge experience records
                # For simplicity, we're not implementing the full experience update here
                pass
                
            # Mark profile as more complete
            if not candidate.profile_completed:
                candidate.profile_completed = True
                
            db.commit()
            logger.info(f"Successfully saved CV analysis to candidate {candidate_id}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving CV analysis to database: {str(e)}")
            return False

    def save_cv_analysis_for_new_candidate(self, cv_analysis: Dict[str, Any], user_id: str, db: Session) -> Optional[str]:
        """
        Create a new candidate profile from CV analysis.
        
        Args:
            cv_analysis: Dictionary with CV analysis results
            user_id: UUID of the user
            db: Database session
            
        Returns:
            Candidate ID if successful, None otherwise
        """
        try:
            # Check if user exists
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.error(f"User with ID {user_id} not found.")
                return None
                
            # Check if candidate profile already exists
            existing_candidate = db.query(CandidateProfile).filter(
                CandidateProfile.user_id == user_id
            ).first()
            
            if existing_candidate:
                # Update existing profile
                success = self.save_cv_analysis_to_candidate(
                    cv_analysis, str(existing_candidate.id), db
                )
                return str(existing_candidate.id) if success else None
            
            # Extract current position and company from experience
            current_position = None
            current_company = None
            if cv_analysis.get("experience") and len(cv_analysis["experience"]) > 0:
                latest_exp = cv_analysis["experience"][0]
                if latest_exp.get("current", False) or "present" in latest_exp.get("duration", "").lower():
                    current_position = latest_exp.get("title")
                    current_company = latest_exp.get("company")
            
            # Create new candidate profile
            new_candidate = CandidateProfile(
                user_id=user_id,
                summary=cv_analysis.get("summary", ""),
                years_of_experience=cv_analysis.get("total_experience_years", 0),
                current_position=current_position,
                current_company=current_company,
                profile_completed=True
            )
            
            db.add(new_candidate)
            db.flush()  # Get the ID without committing
            
            # Add skills
            for skill_id in cv_analysis.get("skill_ids", []):
                candidate_skill = CandidateSkill(
                    candidate_id=new_candidate.id,
                    skill_id=skill_id,
                    proficiency_level=ProficiencyLevel.INTERMEDIATE  # Default
                )
                db.add(candidate_skill)
            
            # Would add education and experience here in a full implementation
            
            db.commit()
            logger.info(f"Created new candidate profile with ID {new_candidate.id}")
            return str(new_candidate.id)
            
        except Exception as e:
            db.rollback()
            logger.error(f"Error creating candidate profile from CV analysis: {str(e)}")
            return None

    # --- Helper & Fallback Methods ---

    def _map_skills_to_ids(self, skill_names: List[str], db: Session) -> List[str]:
        """Maps extracted skill names to known skill IDs using normalized matching."""
        normalized_skill_lookup = self.get_normalized_skill_lookup(db)
        skill_ids = set()  # Use set to avoid duplicates
        
        for skill in skill_names:
            skill_lower = skill.lower().strip()
            if not skill_lower:
                continue

            # Try direct match first
            if skill_lower in normalized_skill_lookup:
                skill_ids.add(normalized_skill_lookup[skill_lower])
                continue

            # Try partial match (be cautious with this, might be too broad)
            matched = False
            for db_skill_lower, skill_id in normalized_skill_lookup.items():
                # Check if extracted skill contains a known skill OR known skill contains extracted skill
                # Add word boundaries (\b) to avoid matching parts of words e.g. 'java' in 'javascript'
                if re.search(r'\b' + re.escape(db_skill_lower) + r'\b', skill_lower) or \
                   re.search(r'\b' + re.escape(skill_lower) + r'\b', db_skill_lower):
                    skill_ids.add(skill_id)
                    matched = True
                    # break  # Decide if one partial match is enough per skill

        return list(skill_ids)

    def _select_jobs_for_matching(self, db: Session, job_id: Optional[str], max_jobs: int) -> List[Dict[str, Any]]:
        """Selects jobs to be used in the matching process."""
        if job_id:
            job = self.get_job_by_id(db, job_id)
            return [job] if job else []
        else:
            # Match against multiple jobs
            jobs = self.get_jobs(db, limit=max_jobs)
            logger.info(f"Selected {len(jobs)} most recent jobs for matching.")
            return jobs

    def _prepare_job_description_for_matching(self, job: Dict[str, Any]) -> Dict[str, Any]:
        """Formats a job dictionary with necessary details for matching prompts."""
        skill_names = [skill["name"] for skill in job.get("skills", [])]
        
        return {
            "job_id": job.get("id"),
            "title": job.get("title"),
            "company": job.get("company_name", "Unknown Company"),
            "description": job.get("description", ""),
            "requirements": job.get("requirements", []),  # Assuming requirements is a list of strings
            "skills": skill_names,
            "location": job.get("location", "Not specified"),
            "contract_type": job.get("contract_type", "Not specified"),
            "remote_option": job.get("is_remote", False)
        }

    def _extract_placeholders(self, template_text: str) -> List[str]:
        """Extract placeholders from email template text (format: {{placeholder}})."""
        placeholders = re.findall(r'\{\{(\w+)\}\}', template_text)
        return list(set(placeholders))  # Return unique placeholders

    def _get_candidate_email_context_data(self, candidate_id: str, db: Session) -> Dict[str, Any]:
        """
        Get candidate data for email context.
        
        Args:
            candidate_id: The ID of the candidate.
            db: Database session.
            
        Returns:
            Dictionary with candidate data for email context.
        """
        candidate_data = self.get_candidate_by_id(db, candidate_id)
        if not candidate_data:
            logger.warning(f"Candidate with ID {candidate_id} not found")
            return {}
            
        # Build context data
        skills = [skill["name"] for skill in candidate_data.get("skills", [])]
        
        context = {
            "candidate_name": f"{candidate_data.get('first_name', '')} {candidate_data.get('last_name', '')}",
            "candidate_id": candidate_id,
            "email": candidate_data.get("email", ""),
            "skills": skills,
            "position": candidate_data.get("current_position", ""),
            "experience_years": candidate_data.get("years_of_experience", 0),
            "status": "active"  # Default value since there's no explicit status field
        }
        
        return context

    def _prepare_email_context(self, template_id: str, recipient_type: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a richer context dictionary for the email generation prompt."""
        enhanced_context = {"communication_purpose": template_id.replace("_", " ")}

        if recipient_type == "candidate":
            enhanced_context.update({
                "recipient_name": context.get("candidate_name", "Candidate"),
                "job_title": context.get("job_title", "the position"),
                "company_name": context.get("company_name", "our client"),
                "candidate_skills": context.get("skills", []),  # Candidate's general skills
                "matching_job_skills": context.get("matching_skills", []),  # Skills relevant to this job
                "candidate_status": context.get("candidate_status", "applicant"),  # e.g., applicant, interviewed, offered
                # Add more relevant candidate context if available
            })
        else:  # recipient_type == "company"
            enhanced_context.update({
                "recipient_name": context.get("contact_person", "Hiring Manager"),
                "company_name": context.get("company_name", "your company"),
                "job_title": context.get("job_title", "the open position"),
                "industry": context.get("industry", "your industry"),
                # Add more relevant company/job context if available
            })
        return enhanced_context

    # --- Fallback Methods (Rule-Based) ---

    def _generate_basic_interview_questions(self, job_details: Dict[str, Any]) -> List[Dict[str, str]]:
        """Fallback: Generate basic interview questions based on job details."""
        position = job_details.get("title", "the role")
        skills = job_details.get("skills", [])
        skill_questions = []
        
        # Add skill-based questions if skills are available
        if skills:
            for skill in skills[:3]:  # Use up to 3 skills
                skill_questions.append({
                    "question": f"Tell me about your experience with {skill}.",
                    "purpose": f"Assess proficiency and practical experience with {skill}",
                    "evaluation_guidance": "Look for specific examples, projects, and depth of knowledge."
                })
        
        # Add generic questions to ensure we have at least 7 questions
        generic_questions = [
            {
                "question": f"Why are you interested in this {position} position?",
                "purpose": "Assess motivation and understanding of the role",
                "evaluation_guidance": "Look for alignment between candidate's goals and position requirements."
            },
            {
                "question": "Can you describe a challenging project you've worked on and how you approached it?",
                "purpose": "Evaluate problem-solving abilities and resilience",
                "evaluation_guidance": "Assess methodology, resourcefulness, and outcomes achieved."
            },
            {
                "question": "How do you prioritize tasks when working under pressure?",
                "purpose": "Assess time management and organizational skills",
                "evaluation_guidance": "Look for structured approach and ability to handle competing priorities."
            },
            {
                "question": "Describe a situation where you had to collaborate with a difficult team member.",
                "purpose": "Evaluate teamwork and interpersonal skills",
                "evaluation_guidance": "Look for communication strategies, empathy, and positive resolution."
            },
            {
                "question": "Where do you see yourself professionally in 3-5 years?",
                "purpose": "Assess career goals and alignment with company growth",
                "evaluation_guidance": "Look for ambition, realistic expectations, and commitment."
            },
            {
                "question": f"What do you think are the biggest challenges facing professionals in the {position} role today?",
                "purpose": "Assess industry knowledge and awareness",
                "evaluation_guidance": "Look for insights into trends, challenges, and potential solutions."
            },
            {
                "question": "Tell me about a mistake you made professionally and what you learned from it.",
                "purpose": "Assess self-awareness and ability to learn from failures",
                "evaluation_guidance": "Look for accountability, reflection, and growth mindset."
            }
        ]
        
        # Combine skill-specific and generic questions
        all_questions = skill_questions + generic_questions
        return all_questions[:10]  # Return at most 10 questions
    
    def _generate_basic_candidate_feedback(self, candidate_name: str, position: str, skills: List[str]) -> str:
        """Fallback: Generate basic candidate feedback based on limited information."""
        skill_text = ", ".join(skills) if skills else "the skills needed for this role"
        
        return f"""Feedback for {candidate_name} - {position} Position:

Thank you for your interest in the {position} position. Based on your profile, you have experience with {skill_text}, which is valuable for this role. Your background shows potential alignment with the requirements we're looking for.

To strengthen your candidacy, we recommend focusing on developing deeper expertise in key technical areas relevant to this position. Additionally, highlighting specific achievements and measurable results in your previous roles would help demonstrate your practical impact.

We encourage you to continue expanding your knowledge in current industry trends and best practices related to {position}. This, combined with your existing strengths, would position you well for similar opportunities in the future.

Thank you for your application, and we wish you success in your career development."""

    def analyze_cv_fallback(self, cv_text: str, db: Session) -> Dict[str, Any]:
        """
        Fallback: Analyze CV content using basic rule-based extraction.
        """
        logger.debug("Executing rule-based CV analysis fallback.")
        skills = self._extract_skills_fallback(cv_text)
        education = self._extract_education_fallback(cv_text)
        experience, total_years = self._extract_experience_fallback(cv_text)
        summary = self._generate_summary_fallback(skills, education, experience, total_years)
        skill_ids = self._map_skills_to_ids(skills, db)  # Still try to map skills

        return {
            "skills": skills,
            "skill_ids": skill_ids,
            "education": education,
            "experience": experience,
            "total_experience_years": total_years,
            "summary": summary,
            "analysis_method": "rule-based-fallback"  # Indicate method used
        }

    def match_jobs_fallback(self, skills: List[str], experience_years: int = 0, db: Session = None) -> List[Dict[str, Any]]:
        """Fallback: Match skills against jobs using simple keyword intersection."""
        logger.debug("Executing rule-based job matching fallback.")
        matches = []
        candidate_skills_lower = {s.lower() for s in skills}

        jobs = self.get_jobs(db, limit=20)  # Get top 20 jobs for matching

        for job in jobs:
            job_skill_names = [skill["name"].lower() for skill in job.get("skills", [])]
            job_skills_lower = set(job_skill_names)

            if not job_skills_lower: continue  # Skip jobs with no listed skills

            matching_skills_set = candidate_skills_lower.intersection(job_skills_lower)
            match_score = (len(matching_skills_set) / len(job_skills_lower)) * 100

            # Basic experience check
            required_exp = 0
            for skill in job.get("skills", []):
                if skill.get("years") and skill.get("required", True):
                    required_exp = max(required_exp, skill.get("years", 0))
                    
            if experience_years < required_exp:
                match_score *= 0.8  # Penalize if experience is lower

            if match_score > 30:  # Keep threshold simple
                matches.append({
                    "job_id": job["id"],
                    "job_title": job["title"],
                    "company_name": job["company_name"],
                    "match_score": round(match_score, 2),
                    "matching_skills": list(matching_skills_set),  # Show matched skills
                    "non_matching_skills": list(job_skills_lower - candidate_skills_lower),
                    "match_explanation": f"Matched {len(matching_skills_set)} out of {len(job_skills_lower)} required skills.",
                    "improvement_suggestion": "Consider developing additional skills for this role.",
                    "match_method": "rule-based-fallback"
                })

        matches.sort(key=lambda x: x["match_score"], reverse=True)
        return matches

    def _extract_skills_fallback(self, cv_text: str) -> List[str]:
        """Fallback: Extract skills using regex for a 'Skills' section or common keywords."""
        skills = set()
        # Try finding a dedicated skills section
        skills_section_match = re.search(r'(?i)^\s*(skills|technical skills|proficiencies)[:\n](.*?)(?=\n\s*(\w+\s+){1,3}:|\n\s*(experience|education|projects)|\Z)', cv_text, re.MULTILINE | re.DOTALL)
        if skills_section_match:
            skills_text = skills_section_match.group(2)
            # Split by common delimiters (comma, newline, semicolon, bullet points)
            potential_skills = re.split(r'[,\n;•*]|\s-\s', skills_text)
            for skill in potential_skills:
                cleaned_skill = skill.strip()
                if cleaned_skill and len(cleaned_skill) > 1:  # Avoid single characters
                    skills.add(cleaned_skill)

        # If section not found or empty, look for known skills anywhere
        if not skills:
            known_skills_pattern = r'\b(Python|Java|C\+\+|C#|JavaScript|React|Angular|Vue|Node\.js|SQL|NoSQL|MongoDB|PostgreSQL|AWS|Azure|GCP|Docker|Kubernetes|Terraform|Git|Jenkins|Agile|Scrum|JIRA|Communication|Leadership|Problem Solving|Teamwork|Data Analysis|Machine Learning|AI|Project Management)\b'
            found_skills = re.findall(known_skills_pattern, cv_text, re.IGNORECASE)
            skills.update(found_skills)

        return sorted(list(skills))

    def _extract_education_fallback(self, cv_text: str) -> List[Dict[str, str]]:
        """Fallback: Extract education using regex for an 'Education' section."""
        education_list = []
        # Find education section
        edu_section_match = re.search(r'(?i)^\s*(education|academic background)[:\n](.*?)(?=\n\s*(\w+\s+){1,3}:|\n\s*(experience|skills|projects)|\Z)', cv_text, re.MULTILINE | re.DOTALL)

        if edu_section_match:
            edu_text = edu_section_match.group(2).strip()
            # Split into potential entries (assuming one per line or separated by double newline)
            entries = re.split(r'\n\s*\n|\n(?!\s)', edu_text)

            for entry in entries:
                entry = entry.strip()
                if not entry: continue

                degree_match = re.search(r'(?i)(B\.?S\.?|M\.?S\.?|Ph\.?D\.?|Bachelor|Master|Doctorate)\s*(?:of|in)?\s*([\w\s]+)', entry)
                institution_match = re.search(r'(?i)(University|Institute|College|School)\s*of\s*([\w\s]+)|([\w\s]+)\s*(University|Institute|College|School)', entry)
                year_match = re.search(r'(\b\d{4}\b)(?:\s*-\s*(\b\d{4}\b|Present))?', entry)

                edu_dict = {
                    "degree": degree_match.group(0).strip() if degree_match else "N/A",
                    "institution": institution_match.group(0).strip() if institution_match else "N/A",
                    "field": degree_match.group(2).strip() if degree_match and len(degree_match.groups()) > 1 and degree_match.group(2) else "N/A",
                    "years": year_match.group(0).strip() if year_match else "N/A"
                }
                if edu_dict["degree"] != "N/A" or edu_dict["institution"] != "N/A":
                    education_list.append(edu_dict)

        return education_list

    def _extract_experience_fallback(self, cv_text: str) -> Tuple[List[Dict[str, str]], int]:
        """Fallback: Extract experience using regex for 'Experience' section and calculate years."""
        experience_list = []
        total_years = 0
        current_year = datetime.datetime.now().year

        # Find experience section
        exp_section_match = re.search(r'(?i)^\s*(experience|work experience|professional experience)[:\n](.*?)(?=\n\s*(\w+\s+){1,3}:|\n\s*(education|skills|projects)|\Z)', cv_text, re.MULTILINE | re.DOTALL)

        if exp_section_match:
            exp_text = exp_section_match.group(2).strip()
            # Split into entries (often separated by company name or double newline)
            entries = re.split(r'\n(?=\s*[A-Z][\w\s]+,\s*[A-Z][\w\s]+|\n)', exp_text)

            for entry in entries:
                entry = entry.strip()
                if not entry or len(entry.split('\n')) < 2: continue  # Skip short/empty entries

                lines = entry.split('\n')
                title_company_line = lines[0]
                description_lines = lines[1:]

                # Extract Title, Company (heuristic)
                title = "N/A"
                company = "N/A"
                parts = re.split(r'\s+at\s+|\s*,\s*|\s*\|\s*', title_company_line)
                if len(parts) >= 1: title = parts[0].strip()
                if len(parts) >= 2: company = parts[1].strip()

                # Extract Duration and calculate years
                duration_str = "N/A"
                years_in_role = 0
                date_match = re.search(r'(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{4}|\b\d{4}\b)\s*-\s*(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{4}|\b\d{4}\b|Present|Current)', title_company_line + " " + "".join(description_lines), re.IGNORECASE)

                if date_match:
                    duration_str = date_match.group(0).strip()
                    start_year_match = re.search(r'\b(\d{4})\b', date_match.group(1))
                    start_year = int(start_year_match.group(1)) if start_year_match else 0

                    end_year_str = date_match.group(2)
                    if re.search(r'(?i)Present|Current', end_year_str):
                        end_year = current_year
                    else:
                        end_year_match = re.search(r'\b(\d{4})\b', end_year_str)
                        end_year = int(end_year_match.group(1)) if end_year_match else start_year

                    if start_year > 0:
                        years_in_role = max(0, end_year - start_year + 1)  # Add 1 for inclusive years
                        total_years += years_in_role

                exp_dict = {
                    "title": title,
                    "company": company,
                    "duration": duration_str,
                    "responsibilities": [line.strip('-* ').strip() for line in description_lines if line.strip()]
                }
                experience_list.append(exp_dict)

        return experience_list, total_years

    def _generate_summary_fallback(self, skills: List[str], education: List[Dict[str, str]],
                                experience: List[Dict[str, str]], total_years: int) -> str:
        """Fallback: Generate a very basic summary string."""
        summary_parts = []
        if total_years > 0:
            summary_parts.append(f"Experienced professional with approximately {total_years} years in the field.")
        elif experience:
            summary_parts.append("Professional with work experience.")
        else:
            summary_parts.append("Entry-level candidate.")

        if skills:
            skill_preview = ", ".join(skills[:3])
            summary_parts.append(f"Key skills include {skill_preview}{'...' if len(skills) > 3 else '.'}")

        if education:
            highest_degree = "degree"  # Placeholder
            # Simple logic to find highest degree (can be improved)
            if any("Ph.D" in edu.get("degree", "") for edu in education): highest_degree = "Ph.D."
            elif any("Master" in edu.get("degree", "") or "M.S" in edu.get("degree", "") for edu in education): highest_degree = "Master's degree"
            elif any("Bachelor" in edu.get("degree", "") or "B.S" in edu.get("degree", "") for edu in education): highest_degree = "Bachelor's degree"
            summary_parts.append(f"Holds a {highest_degree}.")

        if experience:
            latest_role = experience[0].get("title", "a recent role")
            latest_company = experience[0].get("company", "a previous company")
            summary_parts.append(f"Most recently worked as {latest_role} at {latest_company}.")

        return " ".join(summary_parts) if summary_parts else "Candidate profile summary could not be generated."

    def _generate_basic_job_description(self, position: str, company_name: str, industry: Optional[str] = None) -> Dict[str, Union[str, List[str]]]:
        """Fallback: Generate a very basic job description structure."""
        logger.debug(f"Generating basic fallback job description for {position}.")
        industry_text = f" in the {industry} industry" if industry else ""
        overview = f"{company_name} is a company{industry_text} seeking passionate individuals."
        responsibilities = [f"Perform duties related to the {position} role.", "Collaborate with team members.", "Contribute to company goals."]
        qualifications = ["Relevant experience or education.", "Strong work ethic.", "Good communication skills."]
        skills = ["Basic industry knowledge", "Communication"]
        benefits = ["Competitive compensation", "Standard benefits package"]

        full_text = f"""
**Job Title:** {position}

**Company Overview:**
{overview}

**Role Summary:**
We are looking for a dedicated {position} to join our team.

**Key Responsibilities:**
- {responsibilities[0]}
- {responsibilities[1]}
- {responsibilities[2]}

**Required Qualifications:**
- {qualifications[0]}
- {qualifications[1]}
- {qualifications[2]}

**Required Skills:**
- {skills[0]}
- {skills[1]}

**Benefits:**
- {benefits[0]}
- {benefits[1]}

**Application Process:**
Please apply via our careers page or contact HR.
        """

        return {
            "title": position,
            "company_overview": overview,
            "role_summary": f"Seeking a {position}.",
            "key_responsibilities": responsibilities,
            "required_qualifications": qualifications,
            "preferred_qualifications": ["N/A"],
            "required_skills": skills,
            "benefits": benefits,
            "location_environment": "To be discussed.",
            "application_process": "Please apply via our careers page.",
            "full_text": full_text.strip(),
            "generation_method": "rule-based-fallback"
        }

# Initialize an instance of the AIServiceDB for use in endpoints
ai_service_db = AIServiceDB()