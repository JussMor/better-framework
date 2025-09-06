#!/bin/bash

# Dry-run script to preview marketing → framework replacements
# Shows what would be changed without making actual changes

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

# File extensions to check
FILE_EXTENSIONS=(
    "*.ts" "*.tsx" "*.js" "*.jsx" "*.json" "*.md" "*.yml" "*.yaml" 
    "*.txt" "*.sql" "*.html" "*.css" "*.scss" "*.toml" "*.config.*"
)

# Files to exclude
EXCLUDE_PATTERNS=(
    "node_modules" ".git" ".next" ".turbo" "dist" "build" 
    "*.lock" "*.log" "*.db" "*.png" "*.jpg" "*.jpeg" "*.gif" 
    "*.svg" "*.ico" "*.woff" "*.woff2" "*.ttf" "*.eot" "*.backup.*"
)

echo -e "${GREEN}🔍 Marketing → Framework Replacement Preview (DRY RUN)${NC}"
echo "========================================================="
echo -e "${BLUE}This will show you what would be changed without making actual changes${NC}"
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

# Function to preview changes for a file
preview_file_changes() {
    local file="$1"
    
    # Skip if file should be excluded
    if should_exclude_file "$file"; then
        return 0
    fi
    
    # Skip if file doesn't exist or is not readable
    if [[ ! -f "$file" ]] || [[ ! -r "$file" ]]; then
        return 0
    fi
    
    # Check if file contains marketing terms
    if grep -qi "marketing" "$file" 2>/dev/null; then
        echo -e "${YELLOW}📄 File: $file${NC}"
        
        # Show current marketing terms with line numbers
        echo -e "${BLUE}  Current marketing terms:${NC}"
        grep -n -i "marketing" "$file" | while read -r line; do
            echo -e "    ${line}"
        done
        
        # Show what the replacements would look like
        echo -e "${GREEN}  Would become:${NC}"
        perl -pe '
            s/\bmarketing\b/framework/g;
            s/\bMarketing\b/Framework/g;
            s/\bMARKETING\b/FRAMEWORK/g;
            s/\bmarketing([A-Z])/framework$1/g;
            s/\bMarketing([A-Z])/Framework$1/g;
            s/\bMARKETING([A-Z])/FRAMEWORK$1/g;
            s/([a-z])marketing\b/$1framework/g;
            s/([a-z])Marketing\b/$1Framework/g;
            s/([A-Z])MARKETING\b/$1FRAMEWORK/g;
            s/([a-z])marketing([A-Z])/$1framework$2/g;
            s/([a-z])Marketing([A-Z])/$1Framework$2/g;
            s/([A-Z])MARKETING([A-Z])/$1FRAMEWORK$2/g;
            s/marketing[-_]/framework-/g;
            s/Marketing[-_]/Framework-/g;
            s/MARKETING[-_]/FRAMEWORK-/g;
            s/[-_]marketing\b/-framework/g;
            s/[-_]Marketing\b/-Framework/g;
            s/[-_]MARKETING\b/-FRAMEWORK/g;
            s/\.marketing\b/.framework/g;
            s/\.Marketing\b/.Framework/g;
            s/\/marketing\b/\/framework/g;
            s/\/Marketing\b/\/Framework/g;
        ' "$file" | grep -n -i "framework" | while read -r line; do
            echo -e "    ${line}"
        done
        
        echo ""
    fi
}

# Main processing
total_files=0
files_with_marketing=0

for target in "${TARGETS[@]}"; do
    target_path="$BASE_DIR/$target"
    
    if [[ ! -d "$target_path" ]]; then
        echo -e "${RED}❌ Directory not found: $target_path${NC}"
        continue
    fi
    
    echo -e "${GREEN}🎯 Checking directory: $target${NC}"
    echo "----------------------------------------"
    
    # Find all files with specified extensions
    for ext in "${FILE_EXTENSIONS[@]}"; do
        while IFS= read -r -d '' file; do
            ((total_files++))
            if grep -qi "marketing" "$file" 2>/dev/null; then
                preview_file_changes "$file"
                ((files_with_marketing++))
            fi
        done < <(find "$target_path" -name "$ext" -type f -print0 2>/dev/null)
    done
    
    echo ""
done

echo "========================================================="
echo -e "${GREEN}📊 Preview Summary${NC}"
echo "Total files scanned: $total_files"
echo "Files containing 'marketing': $files_with_marketing"
echo ""
echo -e "${YELLOW}To apply these changes, run:${NC}"
echo "  ./replace-marketing-enhanced.sh"
echo ""
echo -e "${YELLOW}Common marketing patterns that will be replaced:${NC}"
echo "  marketing → framework"
echo "  Marketing → Framework" 
echo "  MARKETING → FRAMEWORK"
echo "  marketingTool → frameworkTool"
echo "  autoMarketing → autoFramework"
echo "  better-marketing → better-framework"
echo "  marketing.config → framework.config"
echo "  /marketing/ → /framework/"
