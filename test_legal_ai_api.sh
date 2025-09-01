#!/bin/bash

# test_legal_ai_api.sh
# Script to test Legal AI Platform - Create session, store legal documents, and test RAG analysis

set -e  # Exit on error

# Configuration
BASE_URL="http://localhost:8000/api/v1"  # Adjust if your API runs on different port/host
CONTENT_TYPE="Content-Type: application/json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Global variables
SESSION_TOKEN=""
DOCUMENT_ID=""

# Detect available Python command (Windows compatibility fix)
if command -v python3 >/dev/null 2>&1; then
    PYTHON="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON="python"
else
    echo -e "${RED}[ERROR]${NC} Neither python3 nor python found. Please install Python 3.x and ensure it's in your PATH."
    echo "Download from: https://www.python.org/downloads/"
    exit 1
fi

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if API is running
check_api_health() {
    print_status "Checking API health..."
    response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$BASE_URL/../health" || echo "000")
    
    if [ "$response" = "200" ]; then
        print_success "API is running and healthy"
    else
        print_error "API is not running or unhealthy (HTTP $response)"
        echo "Please start your FastAPI server first with: uvicorn main:app --reload"
        exit 1
    fi
}

# Step 1: Create a new session
create_session() {
    print_status "Creating new session..."
    
    session_response=$(curl -s -X POST \
        -H "$CONTENT_TYPE" \
        "$BASE_URL/documents/create_session")
    
    echo "Session Response: $session_response" # Debug output
    
    # Extract session token using jq if available, otherwise python
    if command -v jq >/dev/null 2>&1; then
        SESSION_TOKEN=$(echo "$session_response" | jq -r '.session_token // empty')
    else
        SESSION_TOKEN=$(echo "$session_response" | $PYTHON -c "
import sys, json
try:
    data = json.load(sys.stdin)
    token = data.get('session_token', '')
    if token and token != '':
        print(token)
    else:
        print('')
except Exception as e:
    print('')
")
    fi
    
    if [ -z "$SESSION_TOKEN" ] || [ "$SESSION_TOKEN" = "null" ]; then
        print_error "Failed to create session or extract token"
        echo "Response: $session_response"
        exit 1
    fi
    
    print_success "Session created successfully"
    echo "Session Token: ${SESSION_TOKEN:0:50}..."  # Show first 50 chars
    echo "Full token length: ${#SESSION_TOKEN} characters"
}

# Step 2: Store legal document chunks
store_legal_document() {
    print_status "Storing legal document chunks..."
    
    # Ensure we have a session token
    if [ -z "$SESSION_TOKEN" ]; then
        print_error "No session token available. Cannot store document."
        exit 1
    fi
    
    # Sample legal contract text
    read -r -d '' LEGAL_DOCUMENT << 'EOF' || true
**EMPLOYMENT CONTRACT**

This Employment Agreement ("Agreement") is entered into on January 1, 2024, between TechCorp Inc., a Delaware corporation ("Company"), and John Smith ("Employee").

**SECTION 1: EMPLOYMENT TERMS**
The Company hereby employs the Employee as Senior Software Developer. Employment shall commence on January 15, 2024, and shall continue until terminated by either party in accordance with the terms herein.

**SECTION 2: COMPENSATION AND BENEFITS**  
Employee shall receive an annual salary of $120,000, payable in bi-weekly installments. The Company shall provide health insurance, dental coverage, and a 401(k) retirement plan with 4% company matching.

**SECTION 3: CONFIDENTIALITY AND NON-DISCLOSURE**
Employee acknowledges that they may have access to confidential and proprietary information. Employee agrees to maintain strict confidentiality of all such information during and after employment. This obligation survives termination of employment for a period of 5 years.

**SECTION 4: NON-COMPETE CLAUSE**
Employee agrees not to engage in any business activity that competes with the Company's business for a period of 12 months following termination of employment within a 50-mile radius of Company's headquarters.

**SECTION 5: TERMINATION**
Either party may terminate this agreement with 30 days written notice. Company may terminate Employee immediately for cause, including but not limited to: misconduct, breach of confidentiality, or failure to perform duties. Upon termination, Employee must return all Company property.

**SECTION 6: INTELLECTUAL PROPERTY**
All work products, inventions, and intellectual property created by Employee during employment shall be the exclusive property of the Company. Employee assigns all rights, title, and interest in such work to the Company.

**SECTION 7: DISPUTE RESOLUTION**
Any disputes arising under this Agreement shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall take place in Delaware.

**SECTION 8: SEVERABILITY**
If any provision of this Agreement is found to be unenforceable, the remaining provisions shall remain in full force and effect.

**SECTION 9: GOVERNING LAW**
This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware.

This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements relating to the subject matter herein.
EOF

    # Create JSON payload
    json_payload=$($PYTHON -c "
import json
import sys

document_text = '''$LEGAL_DOCUMENT'''

payload = {
    'full_text': document_text,
    'chunk_size': 800,
    'overlap': 100
}

print(json.dumps(payload))
")

    # Store the document
    store_response=$(curl -s -X POST \
        -H "$CONTENT_TYPE" \
        -H "Authorization: Bearer $SESSION_TOKEN" \
        -d "$json_payload" \
        "$BASE_URL/documents/store_chunks")
    
    echo "Store Response: $store_response" # Debug output
    
    # Extract document ID
    if command -v jq >/dev/null 2>&1; then
        DOCUMENT_ID=$(echo "$store_response" | jq -r '.document_id // empty')
        store_status=$(echo "$store_response" | jq -r '.status // empty')
    else
        DOCUMENT_ID=$(echo "$store_response" | $PYTHON -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('document_id', ''))
except:
    print('')
")
        store_status=$(echo "$store_response" | $PYTHON -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('status', ''))
except:
    print('')
")
    fi
    
    if [ -z "$DOCUMENT_ID" ] || [ "$store_status" != "success" ]; then
        print_error "Failed to store document"
        echo "Response: $store_response"
        exit 1
    fi
    
    print_success "Legal document stored successfully"
    echo "Document ID: $DOCUMENT_ID"
    
    # Show chunks stored
    if command -v jq >/dev/null 2>&1; then
        chunks_count=$(echo "$store_response" | jq -r '.chunks_stored // 0')
    else
        chunks_count=$(echo "$store_response" | $PYTHON -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('chunks_stored', 0))
except:
    print('0')
")
    fi
    echo "Chunks stored: $chunks_count"
}

# Step 3: Test RAG Analysis - Risk Analysis
test_risk_analysis() {
    print_status "Testing RAG Risk Analysis..."
    
    # Ensure we have both session token and document ID
    if [ -z "$SESSION_TOKEN" ]; then
        print_error "No session token available. Cannot perform analysis."
        exit 1
    fi
    
    if [ -z "$DOCUMENT_ID" ]; then
        print_error "No document ID available. Cannot perform analysis."
        exit 1
    fi
    
    echo "Using Session Token: ${SESSION_TOKEN:0:30}..."
    echo "Using Document ID: $DOCUMENT_ID"
    
    risk_response=$(curl -s -X POST \
        -H "$CONTENT_TYPE" \
        -H "Authorization: Bearer $SESSION_TOKEN" \
        -d "{
            \"document_id\": \"$DOCUMENT_ID\",
            \"analysis_type\": \"risk_analysis\",
            \"jurisdiction\": \"US\"
        }" \
        "$BASE_URL/analysis/rag_analysis")
    
    echo "Risk Analysis Response: $risk_response" # Debug output
    
    # Check analysis status
    if command -v jq >/dev/null 2>&1; then
        analysis_status=$(echo "$risk_response" | jq -r '.status // "unknown"')
    else
        analysis_status=$(echo "$risk_response" | $PYTHON -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('status', 'unknown'))
except Exception as e:
    print('error')
")
    fi
    
    if [ "$analysis_status" = "success" ]; then
        print_success "Risk analysis completed successfully"
        
        # Show relevant chunks count
        if command -v jq >/dev/null 2>&1; then
            chunks_count=$(echo "$risk_response" | jq '.relevant_chunks | length')
        else
            chunks_count=$(echo "$risk_response" | $PYTHON -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(len(data.get('relevant_chunks', [])))
except:
    print('0')
")
        fi
        echo "Relevant chunks analyzed: $chunks_count"
        
        # Save full response to file for inspection
        echo "$risk_response" | $PYTHON -m json.tool > risk_analysis_result.json
        print_success "Full analysis saved to: risk_analysis_result.json"
        
    else
        print_error "Risk analysis failed with status: $analysis_status"
        echo "Response: $risk_response"
    fi
}

# Test authentication error handling
test_auth_errors() {
    print_status "Testing authentication error handling..."
    
    # Test without authorization header
    no_auth_response=$(curl -s -w "%{http_code}" -X POST \
        -H "$CONTENT_TYPE" \
        -d "{\"document_id\": \"$DOCUMENT_ID\", \"analysis_type\": \"risk_analysis\"}" \
        "$BASE_URL/analysis/rag_analysis" \
        -o /tmp/no_auth_response.json)
    
    if [ "$no_auth_response" = "401" ]; then
        print_success "Authentication error handling works correctly (401 returned)"
    else
        print_warning "Authentication error handling returned: $no_auth_response"
    fi
}

# Main execution
main() {
    echo "=================================================="
    echo "    Legal AI Platform - API Testing Script"
    echo "=================================================="
    echo "Using Python command: $PYTHON"
    
    # Check if required tools are available
    command -v curl >/dev/null 2>&1 || { print_error "curl is required but not installed. Aborting."; exit 1; }
    
    # Check if jq is available (optional but recommended)
    if ! command -v jq >/dev/null 2>&1; then
        print_warning "jq not found. Using Python for JSON parsing (slower but works)."
    fi
    
    # Run tests in correct order
    # check_api_health
    echo ""
    
    create_session  # Creates SESSION_TOKEN
    echo ""
    
    store_legal_document  # Uses SESSION_TOKEN, creates DOCUMENT_ID
    echo ""
    
    test_risk_analysis  # Uses both SESSION_TOKEN and DOCUMENT_ID
    echo ""
    
    test_auth_errors
    echo ""
    
    print_success "All tests completed!"
    echo ""
    echo "Generated files:"
    echo "  - risk_analysis_result.json"
    echo ""
    echo "Session Token (save for manual testing): $SESSION_TOKEN"
    echo "Document ID (save for manual testing): $DOCUMENT_ID"
}

# Run main function
main "$@"
