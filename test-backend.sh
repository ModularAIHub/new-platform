#!/bin/bash

# Backend API Test Script
# Tests all authentication and OTP functionalities using curl

BASE_URL="http://localhost:3000/api/auth"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="TestPassword123!"
TEST_NAME="Test User"
COOKIE_JAR="/tmp/cookies.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
TOTAL=0

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

run_test() {
    ((TOTAL++))
    echo ""
    log_info "🧪 Testing: $1"
}

# Test 1: Send OTP for Account Verification
test_send_otp_account_verification() {
    run_test "Send OTP for Account Verification"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"purpose\":\"account-verification\"}" \
        "$BASE_URL/send-otp")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ $http_code -eq 200 ]; then
        log_success "OTP sent for account verification"
        log_info "Response: $body"
    else
        log_error "Expected 200, got $http_code"
        log_error "Response: $body"
    fi
}

# Test 2: Register with OTP
test_register_with_otp() {
    run_test "Register with OTP"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\",\"otp\":\"123456\"}" \
        "$BASE_URL/register")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ $http_code -eq 201 ]; then
        log_success "User registered successfully"
        log_info "Response: $body"
    else
        log_error "Expected 201, got $http_code"
        log_error "Response: $body"
    fi
}

# Test 3: Login
test_login() {
    run_test "Login"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -c "$COOKIE_JAR" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        "$BASE_URL/login")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ $http_code -eq 200 ]; then
        log_success "Login successful"
        log_info "Response: $body"
    else
        log_error "Expected 200, got $http_code"
        log_error "Response: $body"
    fi
}

# Test 4: Verify Token
test_verify_token() {
    run_test "Verify Token"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -b "$COOKIE_JAR" \
        -X GET \
        "$BASE_URL/verify-token")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ $http_code -eq 200 ]; then
        log_success "Token verification successful"
        log_info "Response: $body"
    else
        log_error "Expected 200, got $http_code"
        log_error "Response: $body"
    fi
}

# Test 5: Send OTP for Verification
test_send_otp_verification() {
    run_test "Send OTP for Verification"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"purpose\":\"verification\"}" \
        "$BASE_URL/send-otp")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ $http_code -eq 200 ]; then
        log_success "OTP sent for verification"
        log_info "Response: $body"
    else
        log_error "Expected 200, got $http_code"
        log_error "Response: $body"
    fi
}

# Test 6: Verify OTP
test_verify_otp() {
    run_test "Verify OTP"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"otp\":\"123456\",\"purpose\":\"verification\"}" \
        "$BASE_URL/verify-otp")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ $http_code -eq 200 ]; then
        log_success "OTP verification successful"
        log_info "Response: $body"
        # Extract verification token for password change
        VERIFICATION_TOKEN=$(echo $body | grep -o '"verificationToken":"[^"]*"' | cut -d'"' -f4)
        log_info "Verification token extracted"
    else
        log_error "Expected 200, got $http_code"
        log_error "Response: $body"
    fi
}

# Test 7: Change Password
test_change_password() {
    run_test "Change Password"
    
    if [ -z "$VERIFICATION_TOKEN" ]; then
        log_error "No verification token available"
        return
    fi
    
    NEW_PASSWORD="NewTestPassword123!"
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -b "$COOKIE_JAR" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"newPassword\":\"$NEW_PASSWORD\",\"verificationToken\":\"$VERIFICATION_TOKEN\"}" \
        "$BASE_URL/change-password")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ $http_code -eq 200 ]; then
        log_success "Password changed successfully"
        log_info "Response: $body"
        TEST_PASSWORD="$NEW_PASSWORD"
    else
        log_error "Expected 200, got $http_code"
        log_error "Response: $body"
    fi
}

# Test 8: Login with New Password
test_login_new_password() {
    run_test "Login with New Password"
    
    # Logout first
    curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/logout" > /dev/null
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -c "$COOKIE_JAR" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        "$BASE_URL/login")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ $http_code -eq 200 ]; then
        log_success "Login with new password successful"
        log_info "Response: $body"
    else
        log_error "Expected 200, got $http_code"
        log_error "Response: $body"
    fi
}

# Test 9: Update Notifications
test_update_notifications() {
    run_test "Update Notification Preferences"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -b "$COOKIE_JAR" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"emailEnabled\":true}" \
        "$BASE_URL/notifications")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ $http_code -eq 200 ]; then
        log_success "Notification preferences updated"
        log_info "Response: $body"
    else
        log_error "Expected 200, got $http_code"
        log_error "Response: $body"
    fi
}

# Test 10: Toggle Two-Factor
test_toggle_two_factor() {
    run_test "Toggle Two-Factor Authentication"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -b "$COOKIE_JAR" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"enabled\":true}" \
        "$BASE_URL/two-factor")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ $http_code -eq 200 ]; then
        log_success "Two-factor authentication toggled"
        log_info "Response: $body"
    else
        log_error "Expected 200, got $http_code"
        log_error "Response: $body"
    fi
}

# Test 11: Refresh Token
test_refresh_token() {
    run_test "Refresh Token"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -b "$COOKIE_JAR" \
        -c "$COOKIE_JAR" \
        -X POST \
        "$BASE_URL/refresh")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ $http_code -eq 200 ]; then
        log_success "Token refresh successful"
        log_info "Response: $body"
    else
        log_error "Expected 200, got $http_code"
        log_error "Response: $body"
    fi
}

# Test 12: Validation Tests
test_validation_errors() {
    run_test "Validation Error Tests"
    
    # Test invalid email
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"invalid-email\",\"purpose\":\"verification\"}" \
        "$BASE_URL/send-otp")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    
    if [ $http_code -eq 400 ]; then
        log_success "Invalid email validation working"
    else
        log_error "Invalid email validation not working - got $http_code"
    fi
    
    # Test invalid OTP
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"otp\":\"12345\",\"purpose\":\"verification\"}" \
        "$BASE_URL/verify-otp")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    
    if [ $http_code -eq 400 ]; then
        log_success "Invalid OTP validation working"
    else
        log_error "Invalid OTP validation not working - got $http_code"
    fi
}

# Test 13: Logout
test_logout() {
    run_test "Logout"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -b "$COOKIE_JAR" \
        -X POST \
        "$BASE_URL/logout")
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ $http_code -eq 200 ]; then
        log_success "Logout successful"
        log_info "Response: $body"
    else
        log_error "Expected 200, got $http_code"
        log_error "Response: $body"
    fi
}

# Cleanup
cleanup() {
    rm -f "$COOKIE_JAR"
    log_info "Cleanup completed"
}

# Main test execution
main() {
    echo "🚀 Starting Backend API Tests"
    echo "==============================="
    
    # Initialize
    rm -f "$COOKIE_JAR"
    
    # Run all tests
    test_send_otp_account_verification
    sleep 2
    test_register_with_otp
    test_login
    test_verify_token
    test_send_otp_verification
    sleep 2
    test_verify_otp
    test_change_password
    test_login_new_password
    test_update_notifications
    test_toggle_two_factor
    test_refresh_token
    test_validation_errors
    test_logout
    
    # Print results
    echo ""
    echo "==============================="
    echo "📊 Test Results:"
    echo "   Total Tests: $TOTAL"
    echo -e "   Passed: ${GREEN}$PASSED${NC}"
    echo -e "   Failed: ${RED}$FAILED${NC}"
    
    SUCCESS_RATE=$(( PASSED * 100 / TOTAL ))
    echo "   Success Rate: $SUCCESS_RATE%"
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed!${NC}"
    else
        echo -e "${YELLOW}🔍 Some tests failed. Please check the logs above.${NC}"
    fi
    
    # Cleanup
    cleanup
}

# Run the tests
main
