import json
from typing import Dict, Any, Optional, List
from groq import Groq
from alumni_models import AlumniProfile, Skills

class AlumniAIProcessor:
    """
    Uses Groq + Llama 3.1 (FREE) to intelligently extract and normalize alumni data
    """
    
    def __init__(self, api_key: str):
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.1-70b-versatile"  # FREE tier
    
    def extract_profile(self, raw_linkedin_data: Dict[str, Any]) -> Optional[AlumniProfile]:
        """
        Main extraction method using AI
        """
        try:
            # Step 1: AI extracts structured data + skills
            extracted_data = self._ai_extract(raw_linkedin_data)
            
            # Step 2: Pydantic validates and normalizes
            profile = AlumniProfile(**extracted_data)
            
            # Step 3: Calculate quality metrics
            profile.data_quality_score = profile.calculate_data_quality()
            
            return profile
            
        except Exception as e:
            print(f"Error processing {raw_linkedin_data.get('name', 'Unknown')}: {e}")
            return None
    
    def _ai_extract(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use Groq AI to extract and normalize data + infer skills
        """
        
        # Extract projects for skill inference (but don't store them)
        projects_summary = self._summarize_projects(raw_data.get('projects', []))
        
        prompt = f"""You are an expert data extraction system for IIIT Naya Raipur alumni database.

CRITICAL CONTEXT:
- IIIT Naya Raipur (IIIT-NR) was established in 2015
- Valid branches: CSE, ECE, DSAI
- We need: batch (start year), graduation year, branch, current company

RAW LINKEDIN DATA:
{json.dumps({
    'name': raw_data.get('name'),
    'position': raw_data.get('position'),
    'current_company': raw_data.get('current_company'),
    'education': raw_data.get('education', []),
    'experience': raw_data.get('experience', [])[:5],  # Limit to avoid token overflow
    'location': raw_data.get('location'),
    'avatar': raw_data.get('avatar'),
    'url': raw_data.get('url'),
    'linkedin_id': raw_data.get('linkedin_id'),
    'followers': raw_data.get('followers'),
    'connections': raw_data.get('connections')
}, indent=2)}

PROJECTS SUMMARY (for skill inference only - DO NOT include in output):
{projects_summary}

EXTRACTION RULES:
1. **Batch & Graduation Year**: Look for IIIT-NR/IIIT Naya Raipur/IIIT-Naya Raipur in education
   - Batch = start_year as STRING (when they joined IIIT-NR)
   - Graduation year = end_year as STRING
   - Must be >= 2015
   - Handle variations: "IIIT-NR", "IIIT Naya Raipur", "IIIT-Naya Raipur", "IIITNR"

2. **Branch Inference**: From field of study at IIIT-NR education:
   - "Computer Science", "CS", "CSE" → "CSE"
   - "Electronics", "Communication", "ECE", "E&C" → "ECE"  
   - "Data Science", "AI", "DSAI" → "DSAI"
   - Use ONLY degree field from IIIT-NR education

3. **Current Company**: From current_company object OR first experience with end_date="Present"

4. **Experience Flattening**: 
   - If experience has nested "positions" array, extract ALL positions as separate entries
   - Preserve company_logo_url from parent experience object
   - Each position becomes a separate experience entry

5. **Skills Inference** (IMPORTANT):
   - Extract from job titles in experience (70% weight priority)
   - Extract from project descriptions (30% weight priority)
   - Categorize into:
     * technical: Programming languages, frameworks, domains (React, Python, Machine Learning, IoT)
     * tools: Specific tools/platforms (Git, Docker, Arduino, TensorFlow, Excel, SQL)
   - Job title examples:
     * "Business Analyst" → technical: ["Data Analytics", "Business Intelligence"], tools: ["SQL", "Excel"]
     * "Software Engineer" → technical: ["Software Development", "Programming"], tools: ["Git"]
     * "Senior Data Scientist" → technical: ["Machine Learning", "Data Science", "Python"], tools: ["TensorFlow", "scikit-learn"]

6. **Company Logo URLs**: Preserve company_logo_url from experience entries

OUTPUT REQUIRED (JSON only, no markdown):
{{
  "id": "string",
  "linkedin_id": "string",
  "name": "string",
  "first_name": "string",
  "last_name": "string",
  "batch": "string" or null,
  "branch": "CSE" | "ECE" | "DSAI" | "Mechanical" | "Civil" | "Other",
  "graduationYear": "string" or null,
  "city": "string" or null,
  "country_code": "string" or null,
  "position": "string" or null,
  "current_company": {{
    "name": "string",
    "company_id": "string" or null,
    "title": "string",
    "location": "string" or null
  }} or null,
  "location": "string" or null,
  "avatar": "string" or null,
  "about": "string" or null,
  "education": [
    {{
      "title": "string",
      "degree": "string",
      "field": "string" or null,
      "start_year": "string" or null,
      "end_year": "string" or null,
      "url": "string" or null,
      "institute_logo_url": "string" or null
    }}
  ],
  "experience": [
    {{
      "title": "string",
      "company": "string",
      "company_id": "string" or null,
      "company_logo_url": "string" or null,
      "location": "string" or null,
      "start_date": "string" or null,
      "end_date": "string" or null,
      "duration": "string" or null,
      "url": "string" or null,
      "positions": []
    }}
  ],
  "skills": {{
    "technical": ["string"],
    "tools": ["string"]
  }} or null,
  "url": "string",
  "input_url": "string" or null,
  "followers": int or null,
  "connections": int or null,
  "current_company_company_id": "string" or null,
  "current_company_name": "string" or null,
  "educations_details": "string" or null,
  "linkedin_num_id": "string" or null,
  "banner_image": "string" or null,
  "timestamp": "ISO datetime string" or null,
  "extraction_confidence": float (0.0-1.0)
}}

IMPORTANT:
- Return ONLY valid JSON, no markdown code blocks
- Flatten ALL nested positions in experience
- Preserve company_logo_url in each experience entry
- Infer skills from job titles (priority) and projects
- If field cannot be determined, use null
- batch and graduationYear must be STRINGS
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{
                    "role": "user",
                    "content": prompt
                }],
                temperature=0.0,  # Deterministic extraction
                max_tokens=4096
            )
            
            # Extract JSON from response
            content = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            
            extracted = json.loads(content)
            return extracted
            
        except Exception as e:
            print(f"AI extraction error: {e}")
            # Fallback to basic extraction
            return self._fallback_extraction(raw_data)
    
    def _summarize_projects(self, projects: List[Dict]) -> str:
        """Summarize projects for skill inference"""
        if not projects or len(projects) == 0:
            return "No projects available"
        
        summary = []
        for i, proj in enumerate(projects[:5]):  # Limit to 5 projects
            title = proj.get('title', 'Untitled')
            desc = proj.get('description', '')[:200]  # Truncate long descriptions
            summary.append(f"{i+1}. {title}: {desc}")
        
        return "\n".join(summary)
    
    def _fallback_extraction(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fallback when AI fails - uses your existing logic from seedUser.js
        """
        # Find IIIT-NR education (respecting your logic)
        iiit_edu = self._find_iiit_education(raw_data.get('education', []))
        
        batch = iiit_edu.get('start_year') if iiit_edu else None
        graduationYear = iiit_edu.get('end_year') if iiit_edu else None
        branch = self._extract_branch(iiit_edu) if iiit_edu else "CSE"
        
        # Extract current company
        current_company = self._extract_current_company(raw_data)
        
        # Flatten experience
        flattened_exp = self._flatten_experience(raw_data.get('experience', []))
        
        # Basic skill inference
        skills = self._infer_skills_basic(
            flattened_exp,
            raw_data.get('projects', [])
        )
        
        return {
            "id": raw_data.get('id', ''),
            "linkedin_id": raw_data.get('linkedin_id', ''),
            "name": raw_data.get('name', 'Unknown'),
            "first_name": raw_data.get('first_name') or raw_data.get('name', '').split()[0] if raw_data.get('name') else None,
            "last_name": raw_data.get('last_name') or ' '.join(raw_data.get('name', '').split()[1:]) if raw_data.get('name') else None,
            "batch": str(batch) if batch else None,
            "branch": branch,
            "graduationYear": str(graduationYear) if graduationYear else None,
            "city": raw_data.get('city'),
            "country_code": raw_data.get('country_code'),
            "position": raw_data.get('position'),
            "current_company": current_company,
            "location": raw_data.get('location'),
            "avatar": raw_data.get('avatar'),
            "about": raw_data.get('about'),
            "education": raw_data.get('education', []),
            "experience": flattened_exp,
            "skills": skills,
            "url": raw_data.get('url', ''),
            "input_url": raw_data.get('input_url') or raw_data.get('url'),
            "followers": raw_data.get('followers'),
            "connections": raw_data.get('connections'),
            "current_company_company_id": raw_data.get('current_company_company_id'),
            "current_company_name": raw_data.get('current_company_name'),
            "educations_details": raw_data.get('educations_details'),
            "linkedin_num_id": raw_data.get('linkedin_num_id'),
            "banner_image": raw_data.get('banner_image'),
            "timestamp": raw_data.get('timestamp'),
            "extraction_confidence": 0.5
        }
    
    def _find_iiit_education(self, education_list: List[Dict]) -> Optional[Dict]:
        """Find IIIT-NR education entry (matching your seedUser.js logic)"""
        for edu in education_list:
            title = (edu.get('title') or '').lower()
            degree = (edu.get('degree') or '').lower()
            
            # Check if it's IIIT-NR
            if any(x in title for x in ['iiit-naya raipur', 'iiit naya raipur', 'iiitnr', 'iiit-nr']):
                # Check if relevant degree
                if any(x in degree for x in ['btech', 'b.tech', 'bachelor', 'mtech', 'm.tech', 'master', 'phd', 'ph.d', 'doctor']):
                    return edu
        return None
    
    def _extract_branch(self, iiit_edu: Dict) -> str:
        """Extract branch (matching your seedUser.js logic)"""
        field = (iiit_edu.get('field') or '').lower()
        
        if 'computer science' in field or 'cs' in field or 'cse' in field:
            return "CSE"
        if 'electronics' in field and 'communication' in field:
            return "ECE"
        if 'ece' in field or 'e&c' in field:
            return "ECE"
        if 'data science' in field or 'ai' in field or 'dsai' in field:
            return "DSAI"
        
        return "CSE"  # Default
    
    def _extract_current_company(self, data: Dict) -> Optional[Dict]:
        """Extract current company"""
        current = data.get('current_company', {})
        if current and current.get('name'):
            return {
                "name": current.get('name'),
                "company_id": current.get('company_id'),
                "title": current.get('title'),
                "location": current.get('location')
            }
        return None
    
    def _flatten_experience(self, experience_list: List[Dict]) -> List[Dict]:
        """Flatten nested positions (like your original code but better)"""
        result = []
        
        for exp in experience_list:
            company_logo_url = exp.get('company_logo_url')
            company = exp.get('company', '')
            company_id = exp.get('company_id')
            url = exp.get('url')
            
            # Handle nested positions
            if exp.get('positions'):
                for pos in exp['positions']:
                    result.append({
                        "title": pos.get('title'),
                        "company": company,
                        "company_id": company_id,
                        "company_logo_url": company_logo_url,  # Preserve logo
                        "location": pos.get('location'),
                        "start_date": pos.get('start_date'),
                        "end_date": pos.get('end_date'),
                        "duration": pos.get('meta'),
                        "url": url,
                        "positions": []  # Clear nested to avoid recursion
                    })
            else:
                result.append({
                    "title": exp.get('title'),
                    "company": company,
                    "company_id": company_id,
                    "company_logo_url": company_logo_url,  # Preserve logo
                    "location": exp.get('location'),
                    "start_date": exp.get('start_date'),
                    "end_date": exp.get('end_date'),
                    "duration": exp.get('duration'),
                    "url": url,
                    "positions": []
                })
        
        return result
    
    def _infer_skills_basic(self, experience: List[Dict], projects: List[Dict]) -> Optional[Dict]:
        """Basic skill inference (fallback)"""
        technical = set()
        tools = set()
        
        # From experience titles (70% weight - prioritize)
        for exp in experience:
            title = (exp.get('title') or '').lower()
            
            if 'analyst' in title or 'business' in title:
                technical.update(['Data Analytics', 'Business Analysis'])
                tools.update(['SQL', 'Excel'])
            if 'engineer' in title or 'developer' in title:
                technical.update(['Software Development', 'Programming'])
                tools.update(['Git'])
            if 'data scientist' in title or 'ml' in title or 'ai' in title:
                technical.update(['Machine Learning', 'Data Science', 'Python'])
                tools.update(['TensorFlow', 'scikit-learn'])
        
        # From projects (30% weight - secondary)
        for proj in projects[:3]:  # Limit to 3 projects
            desc = (proj.get('description') or '').lower()
            title = (proj.get('title') or '').lower()
            combined = desc + ' ' + title
            
            if 'deep learning' in combined or 'neural network' in combined:
                technical.add('Deep Learning')
            if 'iot' in combined:
                technical.add('IoT')
            if 'arduino' in combined:
                tools.add('Arduino')
            if 'python' in combined:
                technical.add('Python')
        
        if not technical and not tools:
            return None
        
        return {
            "technical": sorted(list(technical)),
            "tools": sorted(list(tools))
        }

# Batch processing utility
def process_alumni_directory(
    input_dir: str,
    output_dir: str,
    api_key: str
) -> None:
    """
    Process all alumni JSON files in directory
    """
    import os
    from pathlib import Path
    from alumni_models import ValidationReport
    
    processor = AlumniAIProcessor(api_key)
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # Track metrics
    total = 0
    successful = 0
    failed = 0
    quality_scores = []
    missing_batch = 0
    missing_company = 0
    with_skills = 0
    
    json_files = list(input_path.glob("*.json"))
    
    for json_file in json_files:
        print(f"Processing: {json_file.name}")
        total += 1
        
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                raw_data = json.load(f)
            
            # Handle array or single object
            entries = raw_data if isinstance(raw_data, list) else [raw_data]
            
            for entry in entries:
                profile = processor.extract_profile(entry)
                
                if profile:
                    # Save validated profile
                    output_file = output_path / f"validated_{profile.linkedin_id}.json"
                    with open(output_file, 'w', encoding='utf-8') as f:
                        f.write(profile.model_dump_json(indent=2))
                    
                    successful += 1
                    quality_scores.append(profile.data_quality_score)
                    
                    if not profile.batch:
                        missing_batch += 1
                    if not profile.current_company:
                        missing_company += 1
                    if profile.skills and (profile.skills.technical or profile.skills.tools):
                        with_skills += 1
                    
                    print(f"  ✓ {profile.name} (Quality: {profile.data_quality_score}, Skills: {len(profile.skills.technical) if profile.skills else 0})")
                else:
                    failed += 1
                    print(f"  ✗ Failed to process entry")
                    
        except Exception as e:
            failed += 1
            print(f"  ✗ Error: {e}")
    
    # Generate report
    report = ValidationReport(
        total_profiles=total,
        successfully_processed=successful,
        failed=failed,
        average_quality_score=sum(quality_scores) / len(quality_scores) if quality_scores else 0,
        profiles_with_missing_batch=missing_batch,
        profiles_with_missing_company=missing_company,
        profiles_with_skills=with_skills
    )
    
    report_file = output_path / "processing_report.json"
    with open(report_file, 'w') as f:
        f.write(report.model_dump_json(indent=2))
    
    print(f"\n{'='*50}")
    print(f"Processing Complete!")
    print(f"{'='*50}")
    print(f"Total: {total}")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    print(f"Average Quality Score: {report.average_quality_score:.2f}")
    print(f"Profiles with Skills: {with_skills}")
    print(f"Missing Batch: {missing_batch}")
    print(f"Missing Company: {missing_company}")
    print(f"\nReport saved to: {report_file}")
