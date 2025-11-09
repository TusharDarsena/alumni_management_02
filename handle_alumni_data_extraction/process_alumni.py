#!/usr/bin/env python3
"""
IIIT-NR Alumni Data Processor
Converts raw LinkedIn scrapes to validated, structured alumni profiles
Uses Groq + Llama 3.1 (FREE)
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from ai_processor import process_alumni_directory

def main():
    """Main execution"""
    load_dotenv()
    
    # Configuration
    API_KEY = os.getenv("GROQ_API_KEY")
    if not API_KEY:
        print("❌ Error: GROQ_API_KEY not found in environment")
        print("\nSetup Instructions:")
        print("1. Sign up at: https://console.groq.com")
        print("2. Create API key")
        print("3. Add to .env file: GROQ_API_KEY=your_key_here")
        print("\n💡 Groq is FREE with Llama 3.1!")
        sys.exit(1)
    
    # Paths (relative to your project structure)
    INPUT_DIR = "client/data/alumnidata"  # Your raw LinkedIn JSONs
    OUTPUT_DIR = "client/data/validated_data"  # New validated output
    
    # Verify paths
    if not Path(INPUT_DIR).exists():
        print(f"❌ Error: Input directory not found: {INPUT_DIR}")
        sys.exit(1)
    
    print("🚀 IIIT-NR Alumni Data Processor (FREE - Groq + Llama 3.1)")
    print("=" * 60)
    print(f"Input:  {INPUT_DIR}")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 60)
    print()
    
    # Process
    try:
        process_alumni_directory(
            input_dir=INPUT_DIR,
            output_dir=OUTPUT_DIR,
            api_key=API_KEY
        )
        
        print("\n✅ Processing complete!")
        print(f"\nNext steps:")
        print(f"1. Review validated data in: {OUTPUT_DIR}")
        print(f"2. Check processing_report.json for quality metrics")
        print(f"3. Run: node scripts/seedUser.js to seed MongoDB")
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Processing interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
