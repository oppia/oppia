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

"""Validation script for Badge System implementation in Oppia."""

from __future__ import annotations

import os
import sys
from typing import List, Tuple

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BOLD = '\033[1m'
RESET = '\033[0m'


def print_success(message: str) -> None:
    """Print success message."""
    print(f'{GREEN}✓ {message}{RESET}')


def print_error(message: str) -> None:
    """Print error message."""
    print(f'{RED}✗ {message}{RESET}')


def print_warning(message: str) -> None:
    """Print warning message."""
    print(f'{YELLOW}⚠ {message}{RESET}')


def print_section(title: str) -> None:
    """Print section header."""
    print(f'\n{BOLD}{title}{RESET}')
    print('=' * 60)


def check_file_exists(filepath: str) -> Tuple[bool, str]:
    """Check if a file exists."""
    if os.path.isfile(filepath):
        return True, f'File exists: {filepath}'
    return False, f'File NOT found: {filepath}'


def check_file_contains(filepath: str, search_term: str) -> Tuple[bool, str]:
    """Check if a file contains a specific term."""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
            if search_term in content:
                return True, f'Found "{search_term}" in {filepath}'
            return False, f'NOT found "{search_term}" in {filepath}'
    except IOError as e:
        return False, f'Error reading {filepath}: {str(e)}'


def validate_implementation() -> bool:
    """Validate badge system implementation.
    
    Returns:
        bool: True if validation passes, False otherwise.
    """
    print_section('Badge System Implementation Validation')
    
    errors = []
    warnings = []
    
    # 1. Check required files
    print_section('1. Checking Required Files')
    
    required_files = [
        'core/domain/badge_domain.py',
        'core/domain/badge_services.py',
        'core/storage/badge/badge_models.py',
        'core/storage/badge/gae_models.py',
        'core/controllers/badge_handlers.py',
    ]
    
    for filepath in required_files:
        exists, message = check_file_exists(filepath)
        if exists:
            print_success(message)
        else:
            print_error(message)
            errors.append(message)
    
    # 2. Check model registration
    print_section('2. Checking Model Registration')
    
    # Check feconf.py for BADGE enum
    has_badge_enum, msg1 = check_file_contains('core/feconf.py', 'BADGE = \'badge\'')
    if has_badge_enum:
        print_success(msg1)
    else:
        print_error(msg1)
        errors.append('Badge model not registered in feconf.py')
    
    # Check models.py for badge import
    has_badge_import, msg2 = check_file_contains(
        'core/platform/models.py',
        'Names.BADGE'
    )
    if has_badge_import:
        print_success(msg2)
    else:
        print_error(msg2)
        errors.append('Badge model not imported in core/platform/models.py')
    
    # 3. Check configuration
    print_section('3. Checking Configuration Flags')
    
    config_flags = [
        'BADGE_SYSTEM_ENABLED',
        'BADGE_CACHE_TIMEOUT_SECONDS',
        'MAX_BADGE_ICON_SIZE_KB',
    ]
    
    for flag in config_flags:
        has_flag, msg = check_file_contains('core/feconf.py', flag)
        if has_flag:
            print_success(f'Configuration flag: {flag}')
        else:
            print_error(f'Missing configuration flag: {flag}')
            errors.append(f'Missing config flag: {flag}')
    
    # 4. Check ACL decorators
    print_section('4. Checking ACL Decorators')
    
    acl_decorators_required = [
        ('UserBadgesHandler', '@acl_decorators.can_access_learner_dashboard'),
        ('UserBadgeProgressHandler', '@acl_decorators.can_access_learner_dashboard'),
        ('ToggleFavoriteBadgeHandler', '@acl_decorators.can_access_learner_dashboard'),
        ('ShareBadgeHandler', '@acl_decorators.can_access_learner_dashboard'),
        ('AdminBadgeHandler', '@acl_decorators.can_manage_system'),
    ]
    
    for handler, decorator in acl_decorators_required:
        has_decorator, msg = check_file_contains(
            'core/controllers/badge_handlers.py',
            decorator
        )
        if has_decorator:
            print_success(f'{handler} has proper ACL decorator')
        else:
            print_warning(f'{handler} might be missing ACL decorator')
            warnings.append(f'{handler} might need ACL decorator')
    
    # 5. Check URL registration
    print_section('5. Checking URL Registration')
    
    url_patterns = [
        '/badgehandler/list',
        '/badgehandler/userbadges',
        '/badgehandler/progress',
        '/badgehandler/favorite/',
        '/badgehandler/share/',
        '/badgehandler/leaderboard',
    ]
    
    for pattern in url_patterns:
        has_route, msg = check_file_contains('main.py', pattern)
        if has_route:
            print_success(f'URL registered: {pattern}')
        else:
            print_error(f'URL NOT registered: {pattern}')
            errors.append(f'Missing URL: {pattern}')
    
    # 6. Check service structure
    print_section('6. Checking Service Structure')
    
    service_classes = [
        'BadgeService',
        'UserBadgeService',
        'BadgeAwardingService',
        'BadgeAnalyticsService',
    ]
    
    for service_class in service_classes:
        has_class, msg = check_file_contains(
            'core/domain/badge_services.py',
            f'class {service_class}'
        )
        if has_class:
            print_success(f'Service class found: {service_class}')
        else:
            print_error(f'Service class NOT found: {service_class}')
            errors.append(f'Missing service: {service_class}')
    
    # 7. Check handler structure
    print_section('7. Checking Handler Structure')
    
    handler_classes = [
        'BadgeListHandler',
        'BadgeDetailHandler',
        'UserBadgesHandler',
        'UserBadgeProgressHandler',
        'ToggleFavoriteBadgeHandler',
        'ShareBadgeHandler',
        'BadgeLeaderboardHandler',
        'AdminBadgeHandler',
        'AdminBadgeAwardHandler',
        'BadgeProgressUpdateHandler',
    ]
    
    for handler_class in handler_classes:
        has_handler, msg = check_file_contains(
            'core/controllers/badge_handlers.py',
            f'class {handler_class}'
        )
        if has_handler:
            print_success(f'Handler found: {handler_class}')
        else:
            print_error(f'Handler NOT found: {handler_class}')
            errors.append(f'Missing handler: {handler_class}')
    
    # 8. Check domain objects
    print_section('8. Checking Domain Objects')
    
    domain_classes = [
        'BadgeCriteria',
        'Badge',
        'UserBadge',
        'BadgeCollection',
        'BadgeAnalytics',
    ]
    
    for domain_class in domain_classes:
        has_class, msg = check_file_contains(
            'core/domain/badge_domain.py',
            f'class {domain_class}'
        )
        if has_class:
            print_success(f'Domain class found: {domain_class}')
        else:
            print_error(f'Domain class NOT found: {domain_class}')
            errors.append(f'Missing domain class: {domain_class}')
    
    # 9. Check domain enums
    print_section('9. Checking Domain Enums')
    
    enums = [
        'BadgeRarity',
        'BadgeTier',
        'BadgeType',
        'BadgeCategory',
    ]
    
    for enum in enums:
        has_enum, msg = check_file_contains(
            'core/domain/badge_domain.py',
            f'class {enum}'
        )
        if has_enum:
            print_success(f'Enum found: {enum}')
        else:
            print_error(f'Enum NOT found: {enum}')
            errors.append(f'Missing enum: {enum}')
    
    # Summary
    print_section('VALIDATION SUMMARY')
    
    if errors:
        print(f'{RED}{BOLD}FAILED - {len(errors)} Error(s) Found:{RESET}')
        for i, error in enumerate(errors, 1):
            print(f'  {i}. {error}')
        print()
    
    if warnings:
        print(f'{YELLOW}{BOLD}WARNINGS - {len(warnings)} Issue(s) to Review:{RESET}')
        for i, warning in enumerate(warnings, 1):
            print(f'  {i}. {warning}')
        print()
    
    if not errors:
        print(f'{GREEN}{BOLD}✓ VALIDATION PASSED{RESET}')
        print(f'{GREEN}All critical checks completed successfully!{RESET}')
        print()
        print('Next steps:')
        print('  1. Integrate with activity_services.py')
        print('  2. Integrate with user_services.py')
        print('  3. Add Angular module registration')
        print('  4. Create unit tests')
        print('  5. Add internationalization (i18n)')
        print('  6. Run full test suite')
        return True
    else:
        print()
        return False


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    success = validate_implementation()
    sys.exit(0 if success else 1)
