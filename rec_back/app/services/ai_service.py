import re
import json
import os
import logging
from typing import Dict, List, Tuple, Any, Optional, Union
from pathlib import Path
from openai import OpenAI, APIError # Import APIError for specific handling
from dotenv import load_dotenv
import datetime # Needed for fallback experience calculation

# --- Configuration & Constants ---

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# File Paths
DATA_DIR = Path("fake_data")
JOBS_FILE = DATA_DIR / "jobs.json"
EMAIL_TEMPLATES_FILE = DATA_DIR / "email_templates.json"
CANDIDATES_FILE = DATA_DIR / "candidate_profiles.json"
USERS_FILE = DATA_DIR / "users.json"
EMPLOYERS_FILE = DATA_DIR / "employer_profiles.json"
SKILLS_FILE = DATA_DIR / "skills.json"

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEFAULT_MODEL = "gpt-4o-mini" # Use a consistent model name

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

class AIService:
    """
    Service for AI-powered recruitment functionalities using OpenAI,
    with fallback to rule-based methods.
    """

    def __init__(self):
        """Initialize the AIService, load data, and set up OpenAI client."""
        self.client = self._initialize_openai_client()
        self._load_all_data()
        self.system_prompts = SYSTEM_PROMPTS
        self.user_prompt_templates = USER_PROMPT_TEMPLATES

    def _initialize_openai_client(self) -> Optional[OpenAI]:
        """Initializes and returns the OpenAI client if the API key is available."""
        if OPENAI_API_KEY:
            try:
                client = OpenAI(api_key=OPENAI_API_KEY)
                # Optional: Test connection with a simple call if needed
                # client.models.list()
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

    def _load_all_data(self):
        """Loads all necessary data files."""
        self.jobs = self._load_json_data(JOBS_FILE, "jobs")
        email_templates_list = self._load_json_data(EMAIL_TEMPLATES_FILE, "email templates")
        self.email_templates = {template["id"]: template for template in email_templates_list} if email_templates_list else {}
        self.candidates = self._load_json_data(CANDIDATES_FILE, "candidate profiles")
        self.users = self._load_json_data(USERS_FILE, "users")
        self.employers = self._load_json_data(EMPLOYERS_FILE, "employer profiles")
        self.skills = self._load_json_data(SKILLS_FILE, "skills")
        self.skill_lookup = {skill["id"]: skill["name"] for skill in self.skills} if self.skills else {}
        self.normalized_skill_lookup = {name.lower(): id for id, name in self.skill_lookup.items()}

        logger.info(f"Loaded {len(self.jobs)} jobs.")
        logger.info(f"Loaded {len(self.email_templates)} email templates.")
        logger.info(f"Loaded {len(self.candidates)} candidates.")
        logger.info(f"Loaded {len(self.users)} users.")
        logger.info(f"Loaded {len(self.employers)} employers.")
        logger.info(f"Loaded {len(self.skills)} skills.")


    def _load_json_data(self, file_path: Path, data_name: str) -> List[Dict[str, Any]]:
        """Loads JSON data from a file with error handling."""
        if not file_path.exists():
            logger.warning(f"{data_name.capitalize()} file not found at {file_path}. Returning empty list.")
            return []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if not isinstance(data, list):
                     logger.warning(f"Data in {file_path} is not a list. Returning empty list.")
                     return []
                logger.debug(f"Successfully loaded {len(data)} items from {file_path}")
                return data
        except json.JSONDecodeError as e:
            logger.error(f"Error decoding JSON from {file_path}: {e}")
            return []
        except Exception as e:
            logger.error(f"Error loading {data_name} from {file_path}: {e}")
            return []

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

            logger.debug(f"Raw OpenAI response for {task_key}: {response_content[:200]}...") # Log snippet

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

    def analyze_cv_with_openai(self, cv_text: str) -> Dict[str, Any]:
        """
        Analyzes CV text using OpenAI API for structured information extraction.
        Falls back to rule-based analysis if API fails or is unavailable.

        Args:
            cv_text: The CV content as plain text.

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

            # Add skill IDs by matching with the internal skills database
            result["skill_ids"] = self._map_skills_to_ids(result.get("skills", []))
            logger.info(f"OpenAI CV analysis successful. Extracted {len(result.get('skills', []))} skills.")
            return result
        else:
            logger.warning("OpenAI CV analysis failed or unavailable. Falling back to rule-based analysis.")
            return self.analyze_cv_fallback(cv_text) # Use explicit fallback method

    def match_jobs_with_openai(self, cv_analysis: Dict[str, Any], job_id: Optional[int] = None, max_jobs_to_match: int = 5) -> List[Dict[str, Any]]:
        """
        Matches a candidate's profile (from CV analysis) against job descriptions using OpenAI.
        Falls back to rule-based matching if API fails or is unavailable.

        Args:
            cv_analysis: Dictionary with CV analysis results.
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

        # Select and prepare job descriptions
        jobs_to_match = self._select_jobs_for_matching(job_id, max_jobs_to_match)
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
            matches = result if isinstance(result, list) else result.get("matches", []) # Handle potential wrapping
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
                experience_years=candidate_info["total_experience_years"]
            )

    def generate_email_with_openai(self, template_id: str, context: Dict[str, Any]) -> Dict[str, str]:
        """
        Generates a personalized email using OpenAI based on a template and context.
        Falls back to simple template filling if API fails or is unavailable.

        Args:
            template_id: The ID of the email template.
            context: Dictionary with context for personalization (e.g., candidate_name, job_title).

        Returns:
            Dictionary with "subject" and "body" of the generated email.
        """
        task_key = "email_generation"

        # Get base template
        template = self.email_templates.get(template_id)
        if not template:
            logger.error(f"Email template with ID '{template_id}' not found.")
            # Return a default error email or raise? For now, return basic
            return {"subject": "Error: Template Not Found", "body": f"Could not find email template '{template_id}'."}

        base_subject = template["subject"]
        base_template_body = template["template"]

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
            "template_purpose": template.get("purpose", template_id.replace("_", " ")), # Add purpose if available
            "recipient_type": recipient_type,
            "base_subject": base_subject, # Pass original subject too
            "base_template": filled_body, # Pass the roughly filled template
            "enhanced_context_json": json.dumps(enhanced_context, indent=2)
        }
        user_prompt = self._format_user_prompt(task_key, prompt_context)
        result = self._call_openai_api(task_key, user_prompt, temperature=0.5)

        if result and isinstance(result, dict) and "subject" in result and "body" in result:
            # Format the final email
            greeting = result.get("greeting", f"Dear {enhanced_context.get('recipient_name', 'Sir/Madam')},")
            body = result.get("body", filled_body) # Fallback to basic filled body
            call_to_action = result.get("call_to_action", "")

            # Ensure CTA is included if provided separately
            if call_to_action and call_to_action not in body:
                 body = f"{body}\n\n{call_to_action}"

            # Add a standard signature (customize as needed)
            signature = "\n\nBest regards,\n[Your Name/Recruiter Name]\n[Your Title]\n[Your Company]"
            formatted_email_body = f"{greeting}\n\n{body}{signature}"

            logger.info(f"OpenAI email generation successful for template '{template_id}'.")
            return {
                "subject": result.get("subject", filled_subject), # Fallback to basic filled subject
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

    def generate_interview_questions(self, job_details: Dict[str, Any], candidate_info: Optional[Dict[str, Any]] = None) -> List[Dict[str, str]]:
        """
        Generates interview questions using OpenAI based on job and optional candidate info.
        Falls back to basic generic questions if API fails or is unavailable.

        Args:
            job_details: Dictionary with job information (title, company, description, skills, etc.).
            candidate_info: Optional dictionary with candidate details (name, skills, experience).

        Returns:
            List of question objects, each with "question", "purpose", and "evaluation_guidance".
        """
        task_key = "interview_questions"

        # Prepare context
        job_context = {
            "title": job_details.get("title", "N/A"),
            "company": job_details.get("company_name", "the company"),
            "description": job_details.get("description", ""),
            "requirements": job_details.get("requirements", []),
            "skills": job_details.get("skills", []) # Assumes skills are names here
        }

        candidate_context_section = ""
        candidate_context_intro = ""
        candidate_tailoring_instruction = "4. Ensure questions are suitable for candidates with varying backgrounds."
        if candidate_info:
            candidate_context = {
                "name": candidate_info.get("name", "the candidate"),
                "skills": candidate_info.get("skills", []),
                "experience_summary": candidate_info.get("summary", ""), # Use summary
                "experience_years": candidate_info.get("total_experience_years", 0)
            }
            candidate_context_section = f"\nCANDIDATE DETAILS:\n{json.dumps(candidate_context, indent=2)}"
            candidate_context_intro = " and the specific candidate details provided"
            candidate_tailoring_instruction = "4. Tailor some questions to probe the specific candidate's background and experience."


        # Format prompt and call API
        prompt_context = {
            "job_context_json": json.dumps(job_context, indent=2),
            "candidate_context_section": candidate_context_section,
            "candidate_context_intro": candidate_context_intro,
            "candidate_tailoring_instruction": candidate_tailoring_instruction
        }
        user_prompt = self._format_user_prompt(task_key, prompt_context)
        result = self._call_openai_api(task_key, user_prompt, temperature=0.5)

        if result:
            # Prompt asks for a direct list
            questions = result if isinstance(result, list) else result.get("questions", [])
            if not isinstance(questions, list):
                 logger.warning(f"Unexpected response format for interview questions. Expected list, got {type(questions)}. Content: {str(questions)[:200]}...")
                 questions = []

            valid_questions = [q for q in questions if isinstance(q, dict) and "question" in q and "purpose" in q]
            logger.info(f"OpenAI generated {len(valid_questions)} interview questions for {job_context['title']}.")
            return valid_questions
        else:
            logger.warning(f"OpenAI interview question generation failed or unavailable for {job_context['title']}. Falling back to basic questions.")
            return self._generate_basic_interview_questions(job_context['title'])

    def generate_job_description(self,
                                 position: str,
                                 company_name: str,
                                 industry: Optional[str] = None,
                                 required_skills: Optional[List[str]] = None) -> Dict[str, Union[str, List[str]]]:
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


    # --- Helper & Fallback Methods ---

    def _map_skills_to_ids(self, skill_names: List[str]) -> List[int]:
        """Maps extracted skill names to known skill IDs using normalized matching."""
        skill_ids = set() # Use set to avoid duplicates
        for skill in skill_names:
            skill_lower = skill.lower().strip()
            if not skill_lower:
                continue

            # Try direct match first
            if skill_lower in self.normalized_skill_lookup:
                skill_ids.add(self.normalized_skill_lookup[skill_lower])
                continue

            # Try partial match (be cautious with this, might be too broad)
            # Example: 'React' should match 'React Native' but maybe not 'Reactive Programming'
            matched = False
            for db_skill_lower, skill_id in self.normalized_skill_lookup.items():
                 # Check if extracted skill contains a known skill OR known skill contains extracted skill
                 # Add word boundaries (\b) to avoid matching parts of words e.g. 'java' in 'javascript'
                 if re.search(r'\b' + re.escape(db_skill_lower) + r'\b', skill_lower) or \
                    re.search(r'\b' + re.escape(skill_lower) + r'\b', db_skill_lower):
                     skill_ids.add(skill_id)
                     matched = True
                     # break # Decide if one partial match is enough per skill

            # if not matched:
            #     logger.debug(f"Skill '{skill}' not found in known skills database.")

        return list(skill_ids)

    def _select_jobs_for_matching(self, job_id: Optional[int], max_jobs: int) -> List[Dict[str, Any]]:
        """Selects jobs to be used in the matching process."""
        if job_id:
            selected_jobs = [job for job in self.jobs if job.get("id") == job_id]
            if not selected_jobs:
                logger.warning(f"Specific job ID {job_id} not found for matching.")
            return selected_jobs
        else:
            # Match against multiple jobs, prioritize recent ones
            try:
                # Sort by posting date (assuming 'YYYY-MM-DD' format or similar)
                sorted_jobs = sorted(
                    self.jobs,
                    key=lambda j: j.get("posting_date", "0000-00-00"),
                    reverse=True
                )
            except Exception as e:
                 logger.warning(f"Could not sort jobs by date ({e}), using original order.")
                 sorted_jobs = self.jobs

            selected_jobs = sorted_jobs[:max_jobs]
            logger.info(f"Selected top {len(selected_jobs)} most recent jobs for matching.")
            return selected_jobs

    def _prepare_job_description_for_matching(self, job: Dict[str, Any]) -> Dict[str, Any]:
         """Formats a job dictionary with necessary details for matching prompts."""
         employer = next((e for e in self.employers if e.get("id") == job.get("employer_id")), {})
         company_name = employer.get("company_name", f"Company ID {job.get('employer_id')}")
         skill_names = [self.skill_lookup.get(sid, f"Unknown Skill ID {sid}") for sid in job.get("skills", [])]

         return {
             "job_id": job.get("id"),
             "title": job.get("title"),
             "company": company_name,
             "description": job.get("description", ""),
             "requirements": job.get("requirements", []), # Assuming requirements is a list of strings
             "skills": skill_names,
             "location": job.get("location", "Not specified"),
             "contract_type": job.get("contract_type", "Not specified"),
             "remote_option": job.get("remote_option", False)
         }

    def _extract_placeholders(self, template_text: str) -> List[str]:
        """Extract placeholders from email template text (format: {{placeholder}})."""
        import re
        placeholders = re.findall(r'\{\{(\w+)\}\}', template_text)
        return list(set(placeholders))  # Return unique placeholders

    def _get_candidate_email_context_data(self, candidate_id: str) -> Dict[str, Any]:
        """
        Get candidate data for email context.
        
        Args:
            candidate_id: The ID of the candidate.
            
        Returns:
            Dictionary with candidate data for email context.
        """
        # Find the candidate by ID
        candidate = next((c for c in self.candidates if str(c.get("id")) == candidate_id), None)
        if not candidate:
            logger.warning(f"Candidate with ID {candidate_id} not found")
            return {}
            
        # Map skills IDs to skill names if available
        skills = []
        for skill_id in candidate.get("skills", []):
            skill_name = self.skill_lookup.get(skill_id)
            if skill_name:
                skills.append(skill_name)
                
        # Get user data if available (for contact information)
        user = next((u for u in self.users if u.get("id") == candidate.get("user_id")), {})
        
        # Build context data
        context = {
            "candidate_name": f"{candidate.get('first_name', '')} {candidate.get('last_name', '')}",
            "candidate_id": candidate_id,
            "email": user.get("email", ""),
            "phone": candidate.get("phone", ""),
            "skills": skills,
            "position": candidate.get("current_position", ""),
            "experience_years": candidate.get("years_of_experience", 0),
            "education": candidate.get("education", []),
            "status": candidate.get("status", "active")
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
                 "candidate_skills": context.get("skills", []), # Candidate's general skills
                 "matching_job_skills": context.get("matching_skills", []), # Skills relevant to this job
                 "candidate_status": context.get("candidate_status", "applicant"), # e.g., applicant, interviewed, offered
                 # Add more relevant candidate context if available
             })
         else: # recipient_type == "company"
             enhanced_context.update({
                 "recipient_name": context.get("contact_person", "Hiring Manager"),
                 "company_name": context.get("company_name", "your company"),
                 "job_title": context.get("job_title", "the open position"),
                 "industry": context.get("industry", "your industry"),
                 # Add more relevant company/job context if available
             })
         return enhanced_context


    # --- Fallback Methods (Rule-Based) ---

    def analyze_cv_fallback(self, cv_text: str) -> Dict[str, Any]:
        """
        Fallback: Analyze CV content using basic rule-based extraction.
        """
        logger.debug("Executing rule-based CV analysis fallback.")
        skills = self._extract_skills_fallback(cv_text)
        education = self._extract_education_fallback(cv_text)
        experience, total_years = self._extract_experience_fallback(cv_text)
        summary = self._generate_summary_fallback(skills, education, experience, total_years)
        skill_ids = self._map_skills_to_ids(skills) # Still try to map skills

        return {
            "skills": skills,
            "skill_ids": skill_ids,
            "education": education,
            "experience": experience,
            "total_experience_years": total_years,
            "summary": summary,
            "analysis_method": "rule-based-fallback" # Indicate method used
        }

    def match_jobs_fallback(self, skills: List[str], experience_years: int = 0) -> List[Dict[str, Any]]:
        """Fallback: Match skills against jobs using simple keyword intersection."""
        logger.debug("Executing rule-based job matching fallback.")
        matches = []
        candidate_skills_lower = {s.lower() for s in skills}

        for job in self.jobs:
            job_skill_names = [self.skill_lookup.get(sid, f"skill_{sid}").lower() for sid in job.get("skills", [])]
            job_skills_lower = set(job_skill_names)

            if not job_skills_lower: continue # Skip jobs with no listed skills

            matching_skills_set = candidate_skills_lower.intersection(job_skills_lower)
            match_score = (len(matching_skills_set) / len(job_skills_lower)) * 100

            # Basic experience check (example)
            required_exp = job.get("required_experience_years", 0)
            if experience_years < required_exp:
                 match_score *= 0.8 # Penalize if experience is lower

            if match_score > 30:  # Keep threshold simple
                employer = next((e for e in self.employers if e.get("id") == job.get("employer_id")), {})
                matches.append({
                    "job_id": job["id"],
                    "job_title": job["title"],
                    "company_name": employer.get("company_name", f"Company {job.get('employer_id')}"),
                    "match_score": round(match_score, 2),
                    "matching_skills": list(matching_skills_set), # Show matched skills
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
                if cleaned_skill and len(cleaned_skill) > 1: # Avoid single characters
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
            entries = re.split(r'\n\s*\n|\n(?!\s)', edu_text) # Split by double newline or single newline if not followed by whitespace (indentation)

            for entry in entries:
                entry = entry.strip()
                if not entry: continue

                degree_match = re.search(r'(?i)(B\.?S\.?|M\.?S\.?|Ph\.?D\.?|Bachelor|Master|Doctorate)\s*(?:of|in)?\s*([\w\s]+)', entry)
                institution_match = re.search(r'(?i)(University|Institute|College|School)\s*of\s*([\w\s]+)|([\w\s]+)\s*(University|Institute|College|School)', entry)
                year_match = re.search(r'(\b\d{4}\b)(?:\s*-\s*(\b\d{4}\b|Present))?', entry) # Find years like 2020-2024 or 2022

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
            # This regex looks for a potential job title line followed by lines that don't look like a new job title/company
            entries = re.split(r'\n(?=\s*[A-Z][\w\s]+,\s*[A-Z][\w\s]+|\n)', exp_text) # Heuristic split

            for entry in entries:
                entry = entry.strip()
                if not entry or len(entry.split('\n')) < 2: continue # Skip short/empty entries

                lines = entry.split('\n')
                title_company_line = lines[0]
                description_lines = lines[1:]

                # Extract Title, Company (heuristic)
                title = "N/A"
                company = "N/A"
                parts = re.split(r'\s+at\s+|\s*,\s*|\s*\|\s*', title_company_line) # Split by 'at', comma, or pipe
                if len(parts) >= 1: title = parts[0].strip()
                if len(parts) >= 2: company = parts[1].strip()

                # Extract Duration and calculate years
                duration_str = "N/A"
                years_in_role = 0
                date_match = re.search(r'(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{4}|\b\d{4}\b)\s*-\s*(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{4}|\b\d{4}\b|Present|Current)', title_company_line + " " + "".join(description_lines), re.IGNORECASE) # Search dates anywhere in entry

                if date_match:
                    duration_str = date_match.group(0).strip()
                    start_year_match = re.search(r'\b(\d{4})\b', date_match.group(1))
                    start_year = int(start_year_match.group(1)) if start_year_match else 0

                    end_year_str = date_match.group(2)
                    if re.search(r'(?i)Present|Current', end_year_str):
                        end_year = current_year
                    else:
                         end_year_match = re.search(r'\b(\d{4})\b', end_year_str)
                         end_year = int(end_year_match.group(1)) if end_year_match else start_year # Assume 0 duration if end year invalid

                    if start_year > 0:
                        years_in_role = max(0, end_year - start_year + 1) # Add 1 for inclusive years
                        # Simple addition, doesn't handle overlaps perfectly
                        total_years += years_in_role


                exp_dict = {
                    "title": title,
                    "company": company,
                    "duration": duration_str,
                    "responsibilities": [line.strip('-* ').strip() for line in description_lines if line.strip()]
                }
                experience_list.append(exp_dict)

        # Refine total_years (simple approach, doesn't handle gaps/overlaps well)
        # A more robust calculation would parse dates properly and track timelines.
        # For fallback, this rough sum might be acceptable.
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
            highest_degree = "degree" # Placeholder
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

    def _generate_basic_interview_questions(self, position: str) -> List[Dict[str, str]]:
        """Fallback: Generate generic interview questions."""
        logger.debug(f"Generating basic fallback interview questions for {position}.")
        return [
            {"question": f"Tell me about your background and why you're interested in this {position} role.", "purpose": "Motivation and general fit", "evaluation_guidance": "Look for enthusiasm, relevant background summary, clear reasons for applying."},
            {"question": "Can you describe a challenging project or task you handled? What was the situation, what did you do, and what was the result?", "purpose": "Problem-solving, STAR method", "evaluation_guidance": "Assess clarity, specific actions taken, ownership, and quantifiable results."},
            {"question": f"What specific skills or experiences make you a strong candidate for this {position} position?", "purpose": "Self-assessment, relevant skills", "evaluation_guidance": "Check alignment with job requirements, specific examples."},
            {"question": "How do you prefer to work in a team environment? Describe a time you collaborated effectively.", "purpose": "Teamwork and collaboration style", "evaluation_guidance": "Look for positive attitude towards teamwork, clear examples of contribution."},
            {"question": "Where do you see yourself professionally in the next 3-5 years, and how does this role fit into your goals?", "purpose": "Career goals and ambition", "evaluation_guidance": "Assess realistic goals, alignment with potential growth in the role/company."},
            {"question": "Do you have any questions for me about the role, the team, or the company?", "purpose": "Candidate engagement and curiosity", "evaluation_guidance": "Note the quality and relevance of questions asked."}
        ]

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


    def generate_candidate_feedback(self, 
                                candidate_name: str,
                                position: str,
                                skills: list = None,
                                experience: list = None) -> str:
        """
        Generates constructive feedback for a candidate based on their profile.
        
        Args:
            candidate_name: The candidate's full name
            position: The candidate's current or target position
            skills: Optional list of the candidate's skills
            experience: Optional list of the candidate's experience
            
        Returns:
            String containing formatted candidate feedback
        """
        task_key = "candidate_feedback"  # Add this to your system_prompts dict
        
        # Add this to your system_prompts if not already there
        if "candidate_feedback" not in self.system_prompts:
            self.system_prompts["candidate_feedback"] = """You are an expert recruitment consultant providing thoughtful, 
            constructive feedback to candidates. Your feedback is balanced, highlighting genuine strengths while offering 
            constructive areas for improvement. You avoid generic feedback and provide specific, actionable advice."""
        
        # Prepare context
        skills_str = ", ".join(skills) if skills and len(skills) > 0 else "Unknown"
        experience_str = ""
        if experience and len(experience) > 0:
            experience_items = []
            for exp in experience:
                if isinstance(exp, dict):
                    title = exp.get('title', 'Unknown role')
                    company = exp.get('company', 'Unknown company')
                    duration = exp.get('duration', 'Unknown duration')
                    experience_items.append(f"{title} at {company} ({duration})")
            
            experience_str = "\n- " + "\n- ".join(experience_items) if experience_items else "Unknown"
        
        # Format user prompt
        user_prompt = f"""
        Please provide constructive feedback for {candidate_name}, who is a {position}.
        
        CANDIDATE PROFILE:
        - Skills: {skills_str}
        - Experience: {experience_str}
        
        Structure your feedback in these sections:
        1. Strengths: Positive aspects of their profile
        2. Areas for Growth: Constructive areas for improvement
        3. Recommendations: Specific, actionable next steps
        4. Overall Assessment: Brief summary of their overall profile
        
        Keep your feedback constructive, specific, and actionable. Avoid generic statements.
        """
        
        # Call OpenAI API
        if self.client:
            try:
                response = self._call_openai_api(
                    task_key=task_key,
                    user_prompt=user_prompt,
                    temperature=0.7,
                    response_format=None  # We want a text response, not JSON
                )
                
                # If it's successful and returned as a dict with content key
                if isinstance(response, dict) and "content" in response:
                    return response["content"]
                    
                # If it's returned as plain text
                if isinstance(response, str):
                    return response
                    
                # If it's in some other format
                feedback_text = str(response)
                if not feedback_text:
                    logger.warning("OpenAI returned empty or invalid feedback content")
                    return self._generate_basic_feedback(candidate_name, position, skills)
                    
                return feedback_text
                
            except Exception as e:
                logger.error(f"Error generating candidate feedback with OpenAI: {e}")
                # Fall back to basic feedback
                return self._generate_basic_feedback(candidate_name, position, skills)
        else:
            logger.warning("OpenAI client not available. Using fallback for candidate feedback.")
            return self._generate_basic_feedback(candidate_name, position, skills)
            
    def _generate_basic_feedback(self, candidate_name: str, position: str, skills: list = None) -> str:
        """Generate basic feedback when OpenAI is unavailable"""
        skills_str = ", ".join(skills) if skills and len(skills) > 0 else "various skills"
        
        return f"""
        # Feedback for {candidate_name}
        
        ## Strengths
        - Shows expertise in {skills_str}
        - Has experience in the {position} role
        - Demonstrates professional qualifications
        
        ## Areas for Growth
        - Could benefit from expanding experience in emerging technologies
        - May want to consider developing additional leadership skills
        - Continued professional development would strengthen the profile
        
        ## Recommendations
        - Consider additional certifications relevant to {position}
        - Build a portfolio showcasing successful projects
        - Network with industry professionals to expand opportunities
        
        ## Overall Assessment
        {candidate_name} appears to be a qualified professional with experience as a {position}. 
        With continued focus on skill development and professional growth, they have good potential for career advancement.
        """