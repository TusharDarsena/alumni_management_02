import mongoose from "mongoose";

const alumniProfileSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    first_name: { type: String },
    last_name: { type: String },
    city: { type: String },
    country_code: { type: String },
    position: { type: String },
    about: { type: String },
    current_company: {
      name: { type: String },
      company_id: { type: String },
      title: { type: String },
      location: { type: String },
    },
    experience: [
      {
        title: { type: String },
        location: { type: String },
        description_html: { type: String },
        start_date: { type: String },
        end_date: { type: String },
        company: { type: String },
        company_id: { type: String },
        url: { type: String },
        company_logo_url: { type: String }, // NEW: Company logo URL
        positions: [
          {
            subtitle: { type: String },
            meta: { type: String },
            start_date: { type: String },
            end_date: { type: String },
            title: { type: String },
            description_html: { type: String },
            location: { type: String },
          },
        ],
        duration: { type: String },
      },
    ],
    url: { type: String },
    people_also_viewed: {
      type: [
        {
          profile_link: { type: String },
          name: { type: String },
          about: { type: String },
          location: { type: String },
        },
      ],
      select: false,
    },
    educations_details: { type: String },
    education: [
      {
        title: { type: String },
        degree: { type: String },
        field: { type: String },
        url: { type: String },
        start_year: { type: String },
        end_year: { type: String },
        description: { type: String },
        description_html: { type: String },
        institute_logo_url: { type: String },
      },
    ],
    avatar: { type: String },
    followers: { type: Number },
    connections: { type: Number },
    current_company_company_id: { type: String },
    current_company_name: { type: String },
    location: { type: String },
    input_url: { type: String },
    linkedin_id: { type: String, unique: true },
    batch: { type: String }, // For filtering (start year at IIIT-NR)
    branch: { type: String }, // For filtering (CSE, ECE, DSAI, etc.)
    graduationYear: { type: String }, // For filtering (end year at IIIT-NR)
    
    // NEW: Skills object (AI-inferred from experience + projects)
    skills: {
      technical: [{ type: String }], // Programming, frameworks, domains
      tools: [{ type: String }], // Specific tools/platforms
    },
    
    activity: {
      type: [
        {
          interaction: { type: String },
          link: { type: String },
          title: { type: String },
          img: { type: String },
          id: { type: String },
        },
      ],
      select: false,
    },
    linkedin_num_id: { type: String },
    banner_image: { type: String },
    honors_and_awards: { type: mongoose.Schema.Types.Mixed },
    similar_profiles: [mongoose.Schema.Types.Mixed],
    bio_links: [mongoose.Schema.Types.Mixed],
    timestamp: { type: Date },
    input: {
      url: { type: String },
    },
    default_avatar: { type: Boolean },
    memorialized_account: { type: Boolean },
    
    // Data quality metrics
    data_quality_score: { type: Number, min: 0, max: 1 },
    extraction_confidence: { type: Number, min: 0, max: 1 },
  },
  { timestamps: true },
);

// Indexes to support filtering and sorting (from your alumni.js)
alumniProfileSchema.index({ name: 1 });
alumniProfileSchema.index({ batch: 1 });
alumniProfileSchema.index({ branch: 1 });
alumniProfileSchema.index({ graduationYear: 1 });
alumniProfileSchema.index({ "current_company.name": 1 });
alumniProfileSchema.index({ position: 1 });

const AlumniProfile =
  mongoose.models.AlumniProfile ||
  mongoose.model("AlumniProfile", alumniProfileSchema);

export default AlumniProfile;
