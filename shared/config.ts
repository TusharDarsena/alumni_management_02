/**
 * Shared configuration used by both client and server
 */

/**
 * Institute name variations for matching
 */
export const INSTITUTE_NAME_VARIATIONS = [
  "IIIT-Naya Raipur",
  "IIIT Naya Raipur",
  "IIIT-NR",
  "IIIT NR",
  "iiitnr",
  "Dr. S.P.M. International Institute of Information Technology, Naya Raipur"
];

/**
 * Branch variations for matching education fields
 * Each key is the normalized branch name to return
 */
export const BRANCH_VARIATIONS: Record<string, string[]> = {
  "CSE": [
    "computer science",
    "cse",
    "cs",
    "computer science and engineering",
    "computer science & engineering",
    "computer engineering",
    "computing",
    "computational"
  ],
  "ECE": [
    "electronics",
    "ece",
    "electrical",
    "electronics and communication",
    "electronics & communication",
    "electronics and communication engineering",
    "electronics & communication engineering",
    "electrical and electronics",
    "electrical, electronics and communications",
    "communication engineering",
    "communications engineering",
    "vlsi",
    "embedded systems",
    "signal processing"
  ],
  "DSAI": [
    "data science",
    "dsai",
    "ds",
    "ai",
    "artificial intelligence",
    "data science and artificial intelligence",
    "data science & artificial intelligence",
    "machine learning",
    "ml"
  ]
};
