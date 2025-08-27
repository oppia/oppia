# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Python execution for running circular dependency checks using Madge.

This script can be run standalone or imported by other modules (linters, hooks).
It follows Oppia's established patterns for tool integration and provides
comprehensive circular dependency detection for TypeScript and JavaScript files.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from typing import Dict, Final, List, Optional, Tuple

from scripts import common

# Parser configuration following run_acceptance_tests.py pattern
_PARSER: Final = argparse.ArgumentParser(
    description="""
Run this script from the oppia root folder:
   python -m scripts.run_circular_dependency_checks

The root folder MUST be named 'oppia'.
For integration with other tools, import and use check_circular_dependencies().
""")

_PARSER.add_argument(
    '--files',
    nargs='*',
    help='Specific files or directories to check for circular dependencies. '
         'If not specified, checks default directories (core, extensions, assets).')

_PARSER.add_argument(
    '--verbose', '-v',
    action='store_true',
    help='Enable verbose output showing detailed execution information.')

_PARSER.add_argument(
    '--skip-install-check',
    action='store_true',
    help='Skip checking if Madge is installed. Useful when Madge installation '
         'is guaranteed to be available.')

_PARSER.add_argument(
    '--exclude',
    nargs='*',
    help='Additional exclusion patterns beyond the default ones. '
         'Patterns should be glob-style (e.g., "**/*.spec.ts").')

_PARSER.add_argument(
    '--format',
    choices=['text', 'json'],
    default='text',
    help='Output format for circular dependencies. Default is text.')

_PARSER.add_argument(
    '--config',
    help='Path to custom Madge configuration file. If not provided, '
         'uses built-in configuration optimized for Oppia.')

_PARSER.add_argument(
    '--timeout',
    type=int,
    default=300,
    help='Timeout for Madge execution in seconds. Default is 300 (5 minutes).')


# Default exclusion patterns optimized for Oppia codebase
DEFAULT_EXCLUDE_PATTERNS: Final[List[str]] = [
    'node_modules/',
    '**/*.spec.ts',
    '**/*.spec.js', 
    '**/test/**',
    '**/tests/**',
    '**/*.test.ts',
    '**/*.test.js',
    'third_party/',
    'assets/scripts/',
    'local_compiled_js_for_test/',
    'stubs/',
    'typings/',
    '**/*_test.ts',
    '**/*_test.js',
    'core/tests/',
    'scripts/run_*_checks.py'
]

# Default target directories when no specific files provided
DEFAULT_TARGET_DIRECTORIES: Final[List[str]] = [
    'core',
    'extensions', 
    'assets'
]


def get_madge_config(
    exclude_patterns: Optional[List[str]] = None,
    output_format: str = 'text'
) -> Dict[str, any]:
    """Get the Madge configuration optimized for Oppia codebase.
    
    Args:
        exclude_patterns: Additional exclusion patterns beyond defaults.
        output_format: Output format ('text' or 'json').
        
    Returns:
        Dict containing Madge configuration options.
    """
    all_excludes = DEFAULT_EXCLUDE_PATTERNS[:]
    if exclude_patterns:
        all_excludes.extend(exclude_patterns)
    
    config = {
        'extensions': ['ts', 'js'],
        'exclude_patterns': all_excludes,
        'circular': True,
        'format': output_format,
        'detective_options': {
            'ts': {
                'skipTypeImports': True
            }
        }
    }
    
    return config


def check_madge_installation(skip_check: bool = False) -> Optional[str]:
    """Check if Madge is installed and return the command to execute it.
    
    Args:
        skip_check: If True, skips installation check and returns default command.
        
    Returns:
        String command to run Madge, or None if not available.
        
    Raises:
        RuntimeError: If Madge is not installed and skip_check is False.
    """
    if skip_check:
        return 'madge'
    
    # Check for global Madge installation first
    try:
        result = subprocess.run(
            ['madge', '--version'], 
            capture_output=True, 
            text=True, 
            timeout=10
        )
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f'Using global Madge installation (version {version})')
            return 'madge'
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        pass
    
    # Check for local Madge via npx
    try:
        if hasattr(common, 'NPX_BIN_PATH') and os.path.exists(common.NPX_BIN_PATH):
            result = subprocess.run(
                [common.NPX_BIN_PATH, 'madge', '--version'],
                capture_output=True,
                text=True,
                timeout=10,
                cwd=common.CURR_DIR
            )
            if result.returncode == 0:
                version = result.stdout.strip()
                print(f'Using local Madge installation via npx (version {version})')
                return f'{common.NPX_BIN_PATH} madge'
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        pass
    
    # Check for local Madge via node_modules
    try:
        madge_path = os.path.join(common.CURR_DIR, 'node_modules', '.bin', 'madge')
        if os.path.exists(madge_path):
            result = subprocess.run(
                [madge_path, '--version'],
                capture_output=True,
                text=True,
                timeout=10,
                cwd=common.CURR_DIR
            )
            if result.returncode == 0:
                version = result.stdout.strip()
                print(f'Using local Madge installation (version {version})')
                return madge_path
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        pass
    
    # If we reach here, Madge is not available
    raise RuntimeError(
        'Madge is not installed or not accessible. Please install it using:\n'
        '  npm install madge --save-dev  (for local installation)\n'
        '  npm install -g madge          (for global installation)\n\n'
        'Or use --skip-install-check flag if Madge is guaranteed to be available.'
    )


def validate_target_paths(targets: List[str], verbose: bool = False) -> List[str]:
    """Validate and filter target paths, returning only existing ones.
    
    Args:
        targets: List of file or directory paths to validate.
        verbose: Whether to print warnings for non-existent paths.
        
    Returns:
        List of existing target paths.
    """
    valid_targets = []
    
    for target in targets:
        if os.path.exists(target):
            valid_targets.append(target)
        elif verbose:
            print(f'Warning: Target path "{target}" does not exist, skipping.')
    
    return valid_targets


def run_madge_command(
    madge_cmd: str,
    targets: List[str],
    config: Dict[str, any],
    timeout: int = 300,
    verbose: bool = False
) -> Tuple[bool, str]:
    """Execute Madge command with the provided configuration.
    
    Args:
        madge_cmd: Base Madge command to execute.
        targets: List of target directories/files to check.
        config: Madge configuration dictionary.
        timeout: Command timeout in seconds.
        verbose: Whether to print verbose execution details.
        
    Returns:
        Tuple of (success: bool, output: str).
    """
    # Build command arguments
    cmd_parts = madge_cmd.split()
    cmd_args = cmd_parts + ['--circular']
    
    # Add file extensions
    extensions = ','.join(config['extensions'])
    cmd_args.extend(['--extensions', extensions])
    
    # Add exclusion patterns
    for pattern in config['exclude_patterns']:
        cmd_args.extend(['--exclude', pattern])
    
    # Add output format if JSON requested
    if config.get('format') == 'json':
        cmd_args.append('--json')
    
    # Add target paths
    cmd_args.extend(targets)
    
    if verbose:
        print(f'Executing command: {" ".join(cmd_args)}')
        print(f'Working directory: {common.CURR_DIR}')
        print(f'Timeout: {timeout} seconds')
    
    try:
        # Execute Madge command
        result = subprocess.run(
            cmd_args,
            cwd=common.CURR_DIR,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        if verbose:
            print(f'Command completed with return code: {result.returncode}')
            print(f'Stdout length: {len(result.stdout)} characters')
            print(f'Stderr length: {len(result.stderr)} characters')
        
        # Handle command results
        if result.returncode == 0:
            if result.stdout.strip():
                # Circular dependencies found
                return False, result.stdout.strip()
            else:
                # No circular dependencies
                return True, 'No circular dependencies detected.'
        else:
            # Command failed
            error_msg = f'Madge execution failed with return code {result.returncode}'
            if result.stderr:
                error_msg += f':\n{result.stderr}'
            if result.stdout:
                error_msg += f'\nOutput:\n{result.stdout}'
            return False, error_msg
            
    except subprocess.TimeoutExpired:
        return False, f'Madge execution timed out after {timeout} seconds.'
    except Exception as e:
        return False, f'Error executing Madge: {str(e)}'


def check_circular_dependencies(
    files: Optional[List[str]] = None,
    verbose: bool = False,
    skip_install_check: bool = False,
    exclude_patterns: Optional[List[str]] = None,
    output_format: str = 'text',
    config_file: Optional[str] = None,
    timeout: int = 300
) -> Tuple[bool, str]:
    """Main function to check for circular dependencies.
    
    This function can be imported and used by other modules (linters, hooks).
    
    Args:
        files: Specific files or directories to check. If None, uses defaults.
        verbose: Enable verbose output.
        skip_install_check: Skip Madge installation verification.
        exclude_patterns: Additional exclusion patterns.
        output_format: Output format ('text' or 'json').
        config_file: Path to custom Madge config (not implemented yet).
        timeout: Execution timeout in seconds.
        
    Returns:
        Tuple of (success: bool, message: str).
    """
    try:
        # Determine target directories/files
        targets = files if files else DEFAULT_TARGET_DIRECTORIES
        
        # Validate target paths
        valid_targets = validate_target_paths(targets, verbose)
        if not valid_targets:
            return False, 'No valid target files or directories found to check.'
        
        # Check Madge installation
        try:
            madge_cmd = check_madge_installation(skip_install_check)
        except RuntimeError as e:
            return False, str(e)
        
        # Get Madge configuration
        config = get_madge_config(exclude_patterns, output_format)
        
        # Execute circular dependency check
        if verbose:
            print('Starting circular dependency analysis...')
            print(f'Targets: {valid_targets}')
        
        success, output = run_madge_command(
            madge_cmd, valid_targets, config, timeout, verbose
        )
        
        return success, output
        
    except Exception as e:
        return False, f'Unexpected error during circular dependency check: {str(e)}'


def main(args: Optional[List[str]] = None) -> None:
    """Main entry point for the circular dependency checker.
    
    Args:
        args: Command line arguments. If None, uses sys.argv.
    """
    parsed_args = _PARSER.parse_args(args=args)
    
    print('Oppia Circular Dependency Checker')
    print('=' * 50)
    
    # Run circular dependency check
    success, message = check_circular_dependencies(
        files=parsed_args.files,
        verbose=parsed_args.verbose,
        skip_install_check=parsed_args.skip_install_check,
        exclude_patterns=parsed_args.exclude,
        output_format=parsed_args.format,
        config_file=parsed_args.config,
        timeout=parsed_args.timeout
    )
    
    # Handle results
    if success:
        print(f'✅ SUCCESS: {message}')
        print('\nNo circular dependencies detected in the checked files.')
        sys.exit(0)
    else:
        print(f'❌ CIRCULAR DEPENDENCIES DETECTED')
        print('=' * 50)
        print(message)
        print('\n' + '=' * 50)
        print('RESOLUTION GUIDANCE')
        print('=' * 50)
        print('To fix circular dependencies, consider these strategies:')
        print('1. Extract shared functionality into separate modules')
        print('2. Use dependency injection instead of direct imports')
        print('3. Implement interfaces to break circular type dependencies')
        print('4. Reorganize code to establish clear dependency hierarchy')
        print('5. Use dynamic imports for non-critical dependencies')
        print('\nFor more information, see: https://github.com/oppia/oppia/wiki/Resolving-Circular-Dependencies')
        print('=' * 50)
        sys.exit(1)


if __name__ == '__main__':  # pragma: no cover
    main()
