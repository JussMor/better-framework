#!/bin/bash

# Script to replace marketing-related terms with "framework" in specific directories
# Targets: apps/marketing-demo, packages/cli, packages/better-marketing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
)

# Replacement patterns using sed regex (handles marketing anywhere in words)
# Note: We'll process these in order to handle overlapping cases properly
MARKETING_PATTERNS=(
    # Case-sensitive patterns for "marketing" in any position
    "s/marketing/framework/g"
    "s/Marketing/Framework/g" 
    "s/MARKETING/FRAMEWORK/g"
    # Handle mixed case variations
    "s/MarKeting/Framework/g"
    "s/MARKTING/FRAMEWORK/g"
    # Common compound patterns (more specific first)
    "s/betterMarketing/betterFramework/g"
    "s/BetterMarketing/BetterFramework/g"
    "s/superMarketing/superFramework/g"
    "s/SuperMarketing/SuperFramework/g"
    "s/autoMarketing/autoFramework/g"
    "s/AutoMarketing/AutoFramework/g"
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
)

echo -e "${GREEN}🔍 Marketing to Framework Replacement Script${NC}"
echo "=================================================="
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
    local contains_marketing=false
    if grep -qi "marketing" "$file" 2>/dev/null; then
        contains_marketing=true
    fi
    
    if [[ "$contains_marketing" == true ]]; then
        echo -e "${YELLOW}📝 Processing: $file${NC}"
        
        # Create backup
        backup_file "$file"
        
        # Apply all replacement patterns in order
        for pattern in "${MARKETING_PATTERNS[@]}"; do
            # Check if this pattern would make changes
            if sed -n "$pattern" "$file" | diff -q "$file" - > /dev/null 2>&1; then
                # No changes from this pattern
                continue
            else
                # Apply the pattern
                sed -i.tmp "$pattern" "$file"
                rm -f "${file}.tmp"
                changes_made=true
                
                # Extract the search and replace parts for display
                search_part=$(echo "$pattern" | sed 's/s\/\(.*\)\/.*\/g/\1/')
                replace_part=$(echo "$pattern" | sed 's/s\/.*\/\(.*\)\/g/\1/')
                echo -e "  ✅ Applied pattern: '$search_part' → '$replace_part'"
            fi
        done
        
        if [[ "$changes_made" == true ]]; then
            echo -e "${GREEN}  ✨ Changes applied to: $(basename "$file")${NC}"
        else
            echo -e "  ℹ️  No changes needed"
        fi
        echo ""
    fi
}

# Main processing
total_files=0
processed_files=0

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
            process_file "$file"
            ((processed_files++))
        done < <(find "$target_path" -name "$ext" -type f -print0 2>/dev/null)
    done
    
    echo ""
done

echo "=================================================="
echo -e "${GREEN}✅ Replacement complete!${NC}"
echo "Total files scanned: $total_files"
echo "Files processed: $processed_files"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "- Backup files were created with timestamp suffix"
echo "- Review changes before committing"
echo "- You can restore from backups if needed"
echo "- Run 'git diff' to see all changes"
echo ""

# Show summary of changes
echo -e "${GREEN}📊 Summary of replacement patterns:${NC}"
for pattern in "${MARKETING_PATTERNS[@]}"; do
    search_part=$(echo "$pattern" | sed 's/s\/\(.*\)\/.*\/g/\1/')
    replace_part=$(echo "$pattern" | sed 's/s\/.*\/\(.*\)\/g/\1/')
    echo "  '$search_part' → '$replace_part'"
done

echo ""
echo -e "${YELLOW}🔍 To review changes, run:${NC}"
echo "  git diff"
echo ""
echo -e "${YELLOW}🗑️  To clean up backup files, run:${NC}"
echo "  find . -name '*.backup.*' -delete"
