#!/bin/bash

# Enhanced Script to replace marketing-related terms with "framework" in specific directories
# This version handles "marketing" appearing anywhere within words
# Targets: apps/marketing-demo, packages/cli, packages/better-marketing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="/Users/jussmor/Developer/everfaz/better-marketing"

# Target directories
TARGETS=(
    "apps/marketing-demo"
    "packages/cli"
    "packages/better-marketing"
)

# File extensions to process
FILE_EXTENSIONS=(
    "*.ts"
    "*.tsx"
    "*.js"
    "*.jsx"
    "*.json"
    "*.md"
    "*.yml"
    "*.yaml"
    "*.txt"
    "*.sql"
    "*.html"
    "*.css"
    "*.scss"
    "*.toml"
    "*.config.*"
)

# Files to exclude (binary files, node_modules, etc.)
EXCLUDE_PATTERNS=(
    "node_modules"
    ".git"
    ".next"
    ".turbo"
    "dist"
    "build"
    "*.lock"
    "*.log"
    "*.db"
    "*.png"
    "*.jpg"
    "*.jpeg"
    "*.gif"
    "*.svg"
    "*.ico"
    "*.woff"
    "*.woff2"
    "*.ttf"
    "*.eot"
    "*.backup.*"
)

echo -e "${GREEN}🔍 Enhanced Marketing → Framework Replacement Script${NC}"
echo "======================================================"
echo -e "${BLUE}This script will replace 'marketing' with 'framework' wherever it appears in words${NC}"
echo ""

# Function to check if file should be excluded
should_exclude_file() {
    local file="$1"
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        if [[ "$file" == *"$pattern"* ]]; then
            return 0
        fi
    done
    return 1
}

# Function to backup a file
backup_file() {
    local file="$1"
    local backup_file="${file}.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$file" "$backup_file"
    echo -e "${YELLOW}  📋 Backed up: $(basename "$file")${NC}"
}

# Function to apply marketing replacements
apply_marketing_replacements() {
    local file="$1"
    local temp_file="${file}.temp_$$"
    local changes_made=false
    
    # Use perl for more sophisticated regex replacement
    # This will handle marketing in any position within words while preserving case patterns
    
    perl -pe '
        # Handle various case patterns of "marketing" anywhere in words
        s/\bmarketing\b/framework/g;           # standalone "marketing"
        s/\bMarketing\b/Framework/g;           # standalone "Marketing" 
        s/\bMARKETING\b/FRAMEWORK/g;           # standalone "MARKETING"
        
        # Handle marketing in compound words (beginning)
        s/\bmarketing([A-Z])/framework$1/g;    # marketingTool -> frameworkTool
        s/\bMarketing([A-Z])/Framework$1/g;    # MarketingTool -> FrameworkTool
        s/\bMARKETING([A-Z])/FRAMEWORK$1/g;    # MARKETINGTool -> FRAMEWORKTool
        
        # Handle marketing in compound words (middle/end)
        s/([a-z])marketing\b/$1framework/g;    # automarketing -> autoframework
        s/([a-z])Marketing\b/$1Framework/g;    # autoMarketing -> autoFramework  
        s/([A-Z])MARKETING\b/$1FRAMEWORK/g;    # AUTOMARKETING -> AUTOFRAMEWORK
        
        # Handle marketing in compound words (middle)
        s/([a-z])marketing([A-Z])/$1framework$2/g;  # autoMarketingTool -> autoFrameworkTool
        s/([a-z])Marketing([A-Z])/$1Framework$2/g;  # autoMarketingTool -> autoFrameworkTool
        s/([A-Z])MARKETING([A-Z])/$1FRAMEWORK$2/g;  # AUTOMARKETINGTool -> AUTOFRAMEWORKTool
        
        # Handle with separators
        s/marketing[-_]/framework-/g;          # marketing- or marketing_
        s/Marketing[-_]/Framework-/g;          # Marketing- or Marketing_
        s/MARKETING[-_]/FRAMEWORK-/g;          # MARKETING- or MARKETING_
        s/[-_]marketing\b/-framework/g;        # -marketing or _marketing
        s/[-_]Marketing\b/-Framework/g;        # -Marketing or _Marketing  
        s/[-_]MARKETING\b/-FRAMEWORK/g;        # -MARKETING or _MARKETING
        
        # Handle common programming patterns
        s/\.marketing\b/.framework/g;          # .marketing
        s/\.Marketing\b/.Framework/g;          # .Marketing
        s/\/marketing\b/\/framework/g;         # /marketing
        s/\/Marketing\b/\/Framework/g;         # /Marketing
        
    ' "$file" > "$temp_file"
    
    # Check if changes were made
    if ! diff -q "$file" "$temp_file" > /dev/null 2>&1; then
        mv "$temp_file" "$file"
        changes_made=true
        
        # Show what was changed
        echo -e "  ✅ Applied comprehensive marketing → framework replacements"
    else
        rm -f "$temp_file"
    fi
    
    echo "$changes_made"
}

# Function to process a single file
process_file() {
    local file="$1"
    local changes_made=false
    
    # Skip if file should be excluded
    if should_exclude_file "$file"; then
        return 0
    fi
    
    # Skip if file doesn't exist or is not readable
    if [[ ! -f "$file" ]] || [[ ! -r "$file" ]]; then
        return 0
    fi
    
    # Check if file contains any marketing terms (case-insensitive)
    if grep -qi "marketing" "$file" 2>/dev/null; then
        echo -e "${YELLOW}📝 Processing: $file${NC}"
        
        # Show preview of marketing terms found
        echo -e "${BLUE}  🔍 Found marketing terms:${NC}"
        grep -n -i "marketing" "$file" | head -5 | while read -r line; do
            echo -e "    ${line}"
        done
        
        # Create backup
        backup_file "$file"
        
        # Apply replacements
        if [[ "$(apply_marketing_replacements "$file")" == "true" ]]; then
            changes_made=true
            echo -e "${GREEN}  ✨ Changes applied to: $(basename "$file")${NC}"
            
            # Show preview of changes
            echo -e "${BLUE}  📋 After replacement:${NC}"
            grep -n -i "framework" "$file" | head -5 | while read -r line; do
                echo -e "    ${line}"
            done
        else
            echo -e "  ℹ️  No changes needed"
        fi
        echo ""
    fi
}

# Confirmation prompt
echo -e "${YELLOW}⚠️  This script will:${NC}"
echo "1. Search for 'marketing' in any position within words"
echo "2. Replace with 'framework' while preserving case patterns"
echo "3. Create backup files with timestamps"
echo "4. Process files in: apps/marketing-demo, packages/cli, packages/better-marketing"
echo ""
read -p "Do you want to continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 0
fi

# Main processing
total_files=0
processed_files=0
changed_files=0

for target in "${TARGETS[@]}"; do
    target_path="$BASE_DIR/$target"
    
    if [[ ! -d "$target_path" ]]; then
        echo -e "${RED}❌ Directory not found: $target_path${NC}"
        continue
    fi
    
    echo -e "${GREEN}🎯 Processing directory: $target${NC}"
    echo "----------------------------------------"
    
    # Find all files with specified extensions
    for ext in "${FILE_EXTENSIONS[@]}"; do
        while IFS= read -r -d '' file; do
            ((total_files++))
            if grep -qi "marketing" "$file" 2>/dev/null; then
                process_file "$file"
                ((changed_files++))
            fi
            ((processed_files++))
        done < <(find "$target_path" -name "$ext" -type f -print0 2>/dev/null)
    done
    
    echo ""
done

echo "======================================================"
echo -e "${GREEN}✅ Replacement complete!${NC}"
echo "Total files scanned: $total_files"
echo "Files processed: $processed_files" 
echo "Files with marketing terms: $changed_files"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "- Review changes: git diff"
echo "- Test your application to ensure everything works"
echo "- Commit changes: git add . && git commit -m 'Replace marketing with framework'"
echo ""
echo -e "${YELLOW}🗑️  To clean up backup files:${NC}"
echo "  find . -name '*.backup.*' -delete"
echo ""
echo -e "${YELLOW}🔄 To restore from backups if needed:${NC}"
echo "  find . -name '*.backup.*' -exec sh -c 'mv \"$1\" \"\${1%.backup.*}\"' _ {} \\;"
