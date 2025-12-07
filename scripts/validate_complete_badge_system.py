#!/usr/bin/env python
# coding: utf-8
#
# Copyright 2024 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Complete Badge System Implementation Validation Script.

This script validates all Phases (1-4) of the badge system implementation
and provides a comprehensive status report.
"""

import os
import sys
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ANSI color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'


class BadgeSystemValidator:
    """Validator for badge system implementation."""

    def __init__(self):
        self.workspace_root = '/home/priyanshu/oppia'
        self.passed_checks = 0
        self.failed_checks = 0
        self.results = {}

    def check_file_exists(self, file_path, description):
        """Check if a file exists.
        
        Args:
            file_path: str. Path to file.
            description: str. Description of what is being checked.
            
        Returns:
            bool. True if file exists.
        """
        full_path = os.path.join(self.workspace_root, file_path)
        exists = os.path.isfile(full_path)
        
        if exists:
            self.passed_checks += 1
            print(f"{GREEN}✓{RESET} {description}")
        else:
            self.failed_checks += 1
            print(f"{RED}✗{RESET} {description} - File not found: {file_path}")
        
        return exists

    def check_file_contains(self, file_path, search_string, description):
        """Check if a file contains specific content.
        
        Args:
            file_path: str. Path to file.
            search_string: str. String to search for.
            description: str. Description of what is being checked.
            
        Returns:
            bool. True if content found.
        """
        full_path = os.path.join(self.workspace_root, file_path)
        
        try:
            with open(full_path, 'r') as f:
                content = f.read()
                found = search_string in content
                
                if found:
                    self.passed_checks += 1
                    print(f"{GREEN}✓{RESET} {description}")
                else:
                    self.failed_checks += 1
                    print(f"{RED}✗{RESET} {description}")
                
                return found
        except Exception as e:
            self.failed_checks += 1
            print(f"{RED}✗{RESET} {description} - Error: {str(e)}")
            return False

    def validate_phase_1_architecture(self):
        """Validate Phase 1: Architecture fixes."""
        print(f"\n{BOLD}{BLUE}PHASE 1: ARCHITECTURE VALIDATION{RESET}")
        print("=" * 60)
        
        # Model registration
        self.check_file_contains(
            'core/feconf.py',
            "BADGE = 'badge'",
            "Model registration in feconf.py"
        )
        
        # Model import
        self.check_file_contains(
            'core/platform/models.py',
            'badge_models',
            "Badge model import in models.py"
        )
        
        # Configuration flags
        self.check_file_contains(
            'core/feconf.py',
            'BADGE_SYSTEM_ENABLED',
            "Badge configuration flags"
        )
        
        # ACL decorators
        self.check_file_contains(
            'core/controllers/badge_handlers.py',
            '@acl_decorators.can_access_learner_dashboard',
            "ACL decorators on badge handlers"
        )
        
        # Route registration
        self.check_file_contains(
            'main.py',
            '/badgehandler',
            "Badge routes registered in main.py"
        )

    def validate_phase_2_services(self):
        """Validate Phase 2: Service integration."""
        print(f"\n{BOLD}{BLUE}PHASE 2: SERVICE INTEGRATION VALIDATION{RESET}")
        print("=" * 60)
        
        # Badge services enhancements
        self.check_file_contains(
            'core/domain/badge_services.py',
            'class BadgeAwardingService',
            "BadgeAwardingService class"
        )
        
        self.check_file_contains(
            'core/domain/badge_services.py',
            'class BadgeCacheService',
            "BadgeCacheService class"
        )
        
        # Activity services integration
        self.check_file_contains(
            'core/domain/activity_services.py',
            'def award_badges_on_lesson_completion',
            "Lesson completion badge award function"
        )
        
        self.check_file_contains(
            'core/domain/activity_services.py',
            'def award_badges_on_daily_login',
            "Daily login badge award function"
        )
        
        # User services integration
        self.check_file_contains(
            'core/domain/user_services.py',
            'def get_user_badge_summary',
            "User badge summary function"
        )
        
        # Learner dashboard handler
        self.check_file_contains(
            'core/controllers/learner_dashboard.py',
            'class LearnerDashboardBadgesSummaryHandler',
            "Learner dashboard badge summary handler"
        )

    def validate_phase_3_frontend(self):
        """Validate Phase 3: Frontend components."""
        print(f"\n{BOLD}{BLUE}PHASE 3: FRONTEND INTEGRATION VALIDATION{RESET}")
        print("=" * 60)
        
        badges_dir = 'core/templates/pages/learner-dashboard-page/badges'
        
        # Angular module
        self.check_file_exists(
            f'{badges_dir}/badges.module.ts',
            "Badges Angular module"
        )
        
        # Components
        self.check_file_exists(
            f'{badges_dir}/badge-card.component.ts',
            "Badge card component"
        )
        
        self.check_file_exists(
            f'{badges_dir}/badge-summary.component.ts',
            "Badge summary component"
        )
        
        self.check_file_exists(
            f'{badges_dir}/badge-detail.component.ts',
            "Badge detail component"
        )
        
        self.check_file_exists(
            f'{badges_dir}/badge-leaderboard.component.ts',
            "Badge leaderboard component"
        )
        
        # Styles (check for SCSS, not CSS)
        self.check_file_exists(
            f'{badges_dir}/badge-card.component.scss',
            "Badge card styles (SCSS)"
        )
        
        self.check_file_exists(
            f'{badges_dir}/badge-summary.component.scss',
            "Badge summary styles (SCSS)"
        )

    def validate_phase_4_testing(self):
        """Validate Phase 4: Testing and scripts."""
        print(f"\n{BOLD}{BLUE}PHASE 4: TESTING & DEPLOYMENT VALIDATION{RESET}")
        print("=" * 60)
        
        # Unit tests
        self.check_file_exists(
            'core/domain/badge_services_test.py',
            "Badge services unit tests"
        )
        
        self.check_file_contains(
            'core/domain/badge_services_test.py',
            'class BadgeServiceTest',
            "BadgeServiceTest class"
        )
        
        # Migration script
        self.check_file_exists(
            'scripts/badge_system_migration.py',
            "Badge system migration script"
        )
        
        # Internationalization
        self.check_file_exists(
            'assets/i18n/badges/en.json',
            "Badge i18n translation file"
        )
        
        self.check_file_contains(
            'assets/i18n/badges/en.json',
            '"badge"',
            "i18n badge translations"
        )

    def validate_error_handling(self):
        """Validate error handling and logging."""
        print(f"\n{BOLD}{BLUE}ERROR HANDLING VALIDATION{RESET}")
        print("=" * 60)
        
        # Check logging in services
        self.check_file_contains(
            'core/domain/badge_services.py',
            'logging.error',
            "Error logging in badge services"
        )
        
        # Check try-except in integration points
        self.check_file_contains(
            'core/domain/activity_services.py',
            'try:',
            "Exception handling in activity services"
        )

    def generate_summary(self):
        """Generate validation summary."""
        total = self.passed_checks + self.failed_checks
        percentage = (self.passed_checks / total * 100) if total > 0 else 0
        
        print(f"\n{BOLD}{'=' * 60}")
        print(f"BADGE SYSTEM IMPLEMENTATION SUMMARY")
        print(f"{'=' * 60}{RESET}")
        
        print(f"\n{BOLD}Validation Results:{RESET}")
        print(f"  {GREEN}Passed: {self.passed_checks}{RESET}")
        print(f"  {RED}Failed: {self.failed_checks}{RESET}")
        print(f"  Total:  {total}")
        print(f"  Success Rate: {percentage:.1f}%")
        
        if self.failed_checks == 0:
            print(f"\n{GREEN}{BOLD}✓ ALL VALIDATIONS PASSED{RESET}")
            print("\n{BOLD}Implementation Status:{RESET}")
            print("  Phase 1 (Architecture): ✓ COMPLETE")
            print("  Phase 2 (Services): ✓ COMPLETE")
            print("  Phase 3 (Frontend): ✓ COMPLETE")
            print("  Phase 4 (Testing): ✓ COMPLETE")
            return True
        else:
            print(f"\n{RED}{BOLD}✗ VALIDATION FAILED{RESET}")
            print(f"\nPlease fix the {self.failed_checks} issue(s) above.")
            return False

    def run_all_validations(self):
        """Run all validation checks."""
        print(f"\n{BOLD}{BLUE}BADGE SYSTEM IMPLEMENTATION VALIDATOR{RESET}")
        print(f"{BLUE}Starting comprehensive validation...{RESET}\n")
        
        self.validate_phase_1_architecture()
        self.validate_phase_2_services()
        self.validate_phase_3_frontend()
        self.validate_phase_4_testing()
        self.validate_error_handling()
        
        return self.generate_summary()


def main():
    """Main entry point."""
    try:
        validator = BadgeSystemValidator()
        success = validator.run_all_validations()
        
        print(f"\n{BLUE}Next Steps:{RESET}")
        print("1. Run: python scripts/badge_system_migration.py")
        print("2. Run: python -m pytest core/domain/badge_services_test.py -v")
        print("3. Run: npm run build")
        print("4. Test in browser: http://localhost:8181/learner-dashboard")
        print()
        
        return 0 if success else 1
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        print(f"\n{RED}Critical Error: {str(e)}{RESET}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
