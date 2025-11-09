from pydantic import BaseModel, Field, field_validator, HttpUrl
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum

# Enums matching your seedUser.js logic
class Branch(str, Enum):
    CSE = "CSE"
    ECE = "ECE"
    DSAI = "DSAI"
    OTHER = "Other"

# Sub-models
class CurrentCompany(BaseModel):
    name: Optional[str] = None
    company_id: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
    
    @field_validator('name')
    @classmethod
    def normalize_company_name(cls, v: Optional[str]) -> Optional[str]:
        if v:
            return v.strip()
        return v

class Position(BaseModel):
    """Nested position within experience (from LinkedIn data)"""
    subtitle: Optional[str] = None
    meta: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    title: Optional[str] = None
    description_html: Optional[str] = None
    location: Optional[str] = None

class Experience(BaseModel):
    """Experience entry - flattened from positions"""
    title: Optional[str] = None
    company: Optional[str] = None
    company_id: Optional[str] = None
    company_logo_url: Optional[str] = None  # NEW: Preserve logo
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    duration: Optional[str] = None
    description_html: Optional[str] = None
    url: Optional[str] = None
    positions: List[Position] = Field(default_factory=list)
    
    @field_validator('company')
    @classmethod
    def normalize_company(cls, v: Optional[str]) -> Optional[str]:
        if v:
            return v.strip()
        return v

class Education(BaseModel):
    title: Optional[str] = None
    degree: Optional[str] = None
    field: Optional[str] = None
    url: Optional[str] = None
    start_year: Optional[str] = None
    end_year: Optional[str] = None
    description: Optional[str] = None
    description_html: Optional[str] = None
    institute_logo_url: Optional[str] = None

class Skills(BaseModel):
    """Skills inferred from experience + projects"""
    technical: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    
    @field_validator('technical', 'tools')
    @classmethod
    def deduplicate_skills(cls, v: List[str]) -> List[str]:
        # Remove duplicates while preserving order
        seen = set()
        result = []
        for item in v:
            item_lower = item.lower()
            if item_lower not in seen:
                seen.add(item_lower)
                result.append(item)
        return result

# Main Alumni Profile Model
class AlumniProfile(BaseModel):
    # Identity fields (from your schema)
    id: str
    linkedin_id: str
    name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
    # IIIT-NR Specific (CRITICAL for filtering)
    batch: Optional[str] = None  # String to match your schema
    branch: Optional[str] = "CSE"  # String to match your schema
    graduationYear: Optional[str] = None  # String to match your schema
    
    # Current Status
    city: Optional[str] = None
    country_code: Optional[str] = None
    position: Optional[str] = None
    current_company: Optional[CurrentCompany] = None
    location: Optional[str] = None
    
    # Profile Details
    avatar: Optional[str] = None
    about: Optional[str] = None
    
    # Professional History
    education: List[Education] = Field(default_factory=list)
    experience: List[Experience] = Field(default_factory=list)
    
    # Skills (NEW - inferred from experience + projects)
    skills: Optional[Skills] = None
    
    # LinkedIn Metadata
    url: Optional[str] = None
    input_url: Optional[str] = None
    followers: Optional[int] = None
    connections: Optional[int] = None
    
    # Additional fields from your schema
    current_company_company_id: Optional[str] = None
    current_company_name: Optional[str] = None
    educations_details: Optional[str] = None
    linkedin_num_id: Optional[str] = None
    banner_image: Optional[str] = None
    honors_and_awards: Optional[dict] = None
    similar_profiles: List[dict] = Field(default_factory=list)
    bio_links: List[dict] = Field(default_factory=list)
    timestamp: Optional[datetime] = None
    input: Optional[dict] = None
    default_avatar: Optional[bool] = None
    memorialized_account: Optional[bool] = None
    
    # Data Quality
    data_quality_score: float = Field(default=0.0, ge=0.0, le=1.0)
    extraction_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    
    @field_validator('batch', 'graduationYear')
    @classmethod
    def validate_iiit_years(cls, v: Optional[str]) -> Optional[str]:
        """IIIT-NR was established in 2015"""
        if v is None:
            return v
        try:
            year = int(v)
            if year < 2015:
                raise ValueError(f"IIIT-NR didn't exist before 2015. Got year: {year}")
            if year > datetime.now().year + 5:
                raise ValueError(f"Invalid future year: {year}")
        except ValueError as e:
            if "invalid literal" not in str(e):
                raise
        return v
    
    def calculate_data_quality(self) -> float:
        """Calculate completeness score"""
        total_fields = 12
        filled_fields = 0
        
        if self.batch: filled_fields += 1
        if self.graduationYear: filled_fields += 1
        if self.current_company: filled_fields += 2
        if self.about: filled_fields += 1
        if len(self.education) > 0: filled_fields += 2
        if len(self.experience) > 0: filled_fields += 2
        if self.skills and (self.skills.technical or self.skills.tools): filled_fields += 2
        if self.location: filled_fields += 1
        
        return round(filled_fields / total_fields, 2)

class ValidationReport(BaseModel):
    """Report generated after processing"""
    total_profiles: int
    successfully_processed: int
    failed: int
    warnings: List[str] = Field(default_factory=list)
    average_quality_score: float
    profiles_with_missing_batch: int
    profiles_with_missing_company: int
    profiles_with_skills: int
