"""Comprehensive timestamp standardization script for Oppia codebase.

This script performs a full migration of timestamp handling across the codebase to use
standardized UTC-aware timestamp utilities. It handles:
1. Direct datetime.utcnow() calls
2. datetime.fromtimestamp() conversions  
3. datetime.now() usage
4. Timestamp update methods
"""

import ast
import astor
import os
from typing import List, Set, Optional, Tuple, Dict
from dataclasses import dataclass
import black

@dataclass
class FileChange:
    """Tracks changes made to a file during migration."""
    filename: str
    original_lines: int
    modified_lines: int
    changes_made: List[str]

class TimestampTransformer(ast.NodeTransformer):
    """AST transformer that standardizes timestamp handling across the codebase."""
    
    def __init__(self, debug_level='normal', is_test_file=False):
        self.needs_datetime_utils_import = False
        self.needs_datetime_import = False
        self.needs_timezone_import = False
        self.changes: List[str] = []
        self.datetime_calls_found = 0
        self.patterns_matched = 0
        self.debug_level = debug_level
        self.is_test_file = is_test_file  # Special handling for test files
    def _get_parents(self, node: ast.AST) -> List[ast.AST]:
        parents = []
        current = getattr(node, 'parent', None)
        while current:
            parents.append(current)
            current = getattr(current, 'parent', None)
        return parents
    def _transform_date_fromtimestamp(self, node: ast.Call) -> Optional[ast.AST]:
        """Handles datetime.date.fromtimestamp() conversions."""
        original_code = astor.to_source(node).strip()
        self.needs_datetime_utils_import = True
        self.changes.append('Standardized date fromtimestamp conversion')
        self.patterns_matched += 1  # Fix typo from 'patterns' to 'patterns_matched'
        
        # Create a datetime first, then extract the date
        datetime_node = ast.Call(
            func=ast.Name(id='from_milliseconds_utc', ctx=ast.Load()),
            args=[
                ast.BinOp(
                    left=node.args[0],
                    op=ast.Mult(),
                    right=ast.Num(n=1000.0)
                )
            ],
            keywords=[]
        )
        
        # Convert datetime to date
        new_node = ast.Attribute(
            value=datetime_node,
            attr='date',
            ctx=ast.Load()
        )
        
        self._log_transformation(
            original_code,
            f'from_milliseconds_utc({astor.to_source(node.args[0]).strip()} * 1000.0).date()',
            'date fromtimestamp replacement'
        )
        return new_node   
    def _build_attribute_chain(self, node: ast.AST) -> List[str]:
        """Builds full attribute chain from a node (e.g. datetime.datetime.utcnow)."""
        chain = []
        current = node
        while isinstance(current, ast.Attribute):
            chain.append(current.attr)
            current = current.value
        if isinstance(current, ast.Name):
            chain.append(current.id)
        return list(reversed(chain))
    
    def _log_transformation(self, old_code: str, new_code: str, transformation_type: str):
        """Log transformation details based on debug level."""
        if self.debug_level == 'quiet':
            return
            
        print(f"\nTransformation detected: {transformation_type}")
        if self.debug_level == 'verbose':
            print(f"  Original: {old_code}")
            print(f"  Modified: {new_code}")
    def _handle_timestamp_milliseconds(self, node: ast.Call) -> Optional[ast.AST]:
        """Special handler for millisecond-based timestamp conversions."""
        original_code = astor.to_source(node).strip()
        self.needs_datetime_utils_import = True
        self.changes.append('Standardized millisecond timestamp conversion')
        self.patterns_matched += 1

        new_node = ast.Call(
            func=ast.Name(id='from_milliseconds_utc', ctx=ast.Load()),
            args=[node.args[0]],
            keywords=[]
        )
        
        self._log_transformation(
            original_code,
            f'from_milliseconds_utc({astor.to_source(node.args[0]).strip()})',
            'millisecond timestamp standardization'
        )
        return new_node
    def _is_in_mock_context(self, node: ast.Call) -> bool:
        """
        Determines if a datetime call is within a mock context in test files.
        
        This handles several test-specific patterns:
        1. Direct mock usage: with mock_datetime_utcnow():
        2. Mock assignments: mocked_datetime = datetime.datetime.utcnow()
        3. Test method context: test_*_utcnow* method names
        
        Returns:
            bool: True if the node appears to be in a mock/test context
        """
        if not self.is_test_file:
            return False
        if any(parent.id == 'mocker' for parent in self._get_parents(node)):
            return True
        # Detect unittest.mock.patch
        if isinstance(node.parent, ast.With) and 'patch' in self._get_call_name(node.parent):
            return True    
            # Walk up the AST to find parent contexts
        current = node
        while hasattr(current, 'parent'):
            # Check if we're inside a with statement
            if isinstance(current, ast.With):
                for item in current.items:
                    if isinstance(item.context_expr, ast.Call):
                        # Check if the with statement uses a mock
                        call_name = self._get_call_name(item.context_expr)
                        if 'mock' in call_name.lower():
                            return True
            
            
            # Check variable assignments for mock patterns
            if isinstance(current, ast.Assign):
                for target in current.targets:
                    if isinstance(target, ast.Name):
                        if 'mock' in target.id.lower() or 'fake' in target.id.lower():
                            return True
            
            current = getattr(current, 'parent', None)
            if current is None:
                break
                
        return False
        
    def _get_call_name(self, node: ast.Call) -> str:
        """Helper to get the full name of a function call."""
        if isinstance(node.func, ast.Name):
            return node.func.id
        elif isinstance(node.func, ast.Attribute):
            return f"{self._get_call_name(node.func.value)}.{node.func.attr}"
        return ""

    def visit(self, node: ast.AST) -> ast.AST:
        """Override visit to maintain parent references."""
        for child in ast.iter_child_nodes(node):
            setattr(child, 'parent', node)
        return super().visit(node)
    def _is_datetime_operation(self, node: ast.Call) -> Tuple[bool, str]:
        """Checks if node represents a datetime operation and returns its type."""
        if not isinstance(node.func, ast.Attribute):
            return False, ""
            
        attr_chain = self._build_attribute_chain(node.func)
        attr_path = '.'.join(attr_chain)
        
        # Define patterns to match
        patterns = {
            'utcnow': ['datetime.datetime.utcnow', 'datetime.utcnow'],
            'now': ['datetime.datetime.now', 'datetime.now'],
            'fromtimestamp': ['datetime.datetime.fromtimestamp', 'datetime.fromtimestamp',
                            'datetime.date.fromtimestamp'],
            'strftime': ['datetime.datetime.strftime', 'datetime.strftime'],
        }
        
        for op_type, pattern_list in patterns.items():
            if any(pattern in attr_path for pattern in pattern_list):
                return True, op_type
                
        return False, ""
    
    def _handle_complex_operation(self, node: ast.BinOp) -> Optional[ast.AST]:
        """Handles datetime operations within complex expressions."""
        if isinstance(node.left, ast.Call):
            is_dt, op_type = self._is_datetime_operation(node.left)
            if is_dt:
                new_left = self._transform_datetime_call(node.left, op_type)
                if new_left:
                    return ast.BinOp(left=new_left, op=node.op, right=node.right)
        
        if isinstance(node.right, ast.Call):
            is_dt, op_type = self._is_datetime_operation(node.right)
            if is_dt:
                new_right = self._transform_datetime_call(node.right, op_type)
                if new_right:
                    return ast.BinOp(left=node.left, op=node.op, right=new_right)
        
        return None

    def _transform_datetime_call(self, node: ast.Call, op_type: str) -> Optional[ast.AST]:
        """Transforms a datetime call into its standardized form."""
        if self.is_test_file and self._is_in_mock_context(node):
            return None  # Don't transform mocked datetime calls
            
        original_code = astor.to_source(node).strip()
        if any(name in original_code for name in ['from_milliseconds', 'timestamp_ms', 'datetime_ms']):
            return self._handle_timestamp_milliseconds(node)
        if op_type == 'utcnow':
            self.needs_datetime_utils_import = True
            self.changes.append('Replaced datetime.utcnow() with get_current_datetime_utc()')
            self.patterns_matched += 1
            new_node = ast.Call(
                func=ast.Name(id='get_current_datetime_utc', ctx=ast.Load()),
                args=[],
                keywords=[]
            )
            self._log_transformation(original_code, 'get_current_datetime_utc()', 'utcnow replacement')
            return new_node
            
        elif op_type == 'fromtimestamp':
            attr_chain = self._build_attribute_chain(node.func)
            if 'date' in attr_chain:
                # Handle date.fromtimestamp() differently
                return self._transform_date_fromtimestamp(node)
            
            self.needs_datetime_utils_import = True
            self.changes.append('Replaced datetime.fromtimestamp() with from_milliseconds_utc()')
            self.patterns_matched += 1
            new_node = ast.Call(
                func=ast.Name(id='from_milliseconds_utc', ctx=ast.Load()),
                args=[
                    ast.BinOp(
                        left=node.args[0],
                        op=ast.Mult(),
                        right=ast.Num(n=1000.0)
                    )
                ],
                keywords=[]
            )
            self._log_transformation(
                original_code,
                f'from_milliseconds_utc({astor.to_source(node.args[0]).strip()} * 1000.0)',
                'fromtimestamp replacement'
            )
            return new_node
            
        elif op_type == 'now':
            self.needs_datetime_utils_import = True
            self.changes.append('Replaced datetime.now() with get_current_datetime_utc()')
            self.patterns_matched += 1
            new_node = ast.Call(
                func=ast.Name(id='get_current_datetime_utc', ctx=ast.Load()),
                args=[],
                keywords=[]
            )
            self._log_transformation(original_code, 'get_current_datetime_utc()', 'now replacement')
            return new_node
            
        return None
    
    def visit_Call(self, node: ast.Call) -> ast.Call:
        """Transforms datetime function calls to use standard utilities."""
        is_dt, op_type = self._is_datetime_operation(node)
        if not is_dt:
            return node
            
        self.datetime_calls_found += 1
        transformed = self._transform_datetime_call(node, op_type)
        return transformed if transformed else node

    def visit_BinOp(self, node: ast.BinOp) -> ast.AST:
        """Visit binary operations to handle datetime operations within them."""
        transformed = self._handle_complex_operation(node)
        return transformed if transformed else node

def find_python_files(start_dir: str = '.') -> List[str]:
    """Finds all Python files in the codebase."""
    python_files = []
    for root, _, files in os.walk(start_dir):
        for file in files:
            if file.endswith('.py'):
                python_files.append(os.path.join(root, file))
    return python_files

def analyze_imports(tree: ast.AST) -> Tuple[bool, bool, bool]:
    """Analyzes existing imports to determine what needs to be added."""
    has_datetime = False
    has_timezone = False
    has_utils = False
    
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom):
            if node.module == 'datetime':
                for alias in node.names:
                    if alias.name == 'datetime':
                        has_datetime = True
                    elif alias.name == 'timezone':
                        has_timezone = True
            elif (node.module == 'core.utils.datetime_utils' and
                  any(alias.name in ['get_current_datetime_utc', 'from_milliseconds_utc'] 
                      for alias in node.names)):
                has_utils = True
        elif isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name == 'datetime':
                    has_datetime = True
                    
    return has_datetime, has_timezone, has_utils
def _transform_date_fromtimestamp(self, node: ast.Call) -> Optional[ast.AST]:
    """Handles datetime.date.fromtimestamp() conversions."""
    original_code = astor.to_source(node).strip()
    self.needs_datetime_utils_import = True
    self.changes.append('Standardized date fromtimestamp conversion')
    self.patterns_matched += 1
    
    # Create a datetime first, then extract the date
    datetime_node = ast.Call(
        func=ast.Name(id='from_milliseconds_utc', ctx=ast.Load()),
        args=[
            ast.BinOp(
                left=node.args[0],
                op=ast.Mult(),
                right=ast.Num(n=1000.0)
            )
        ],
        keywords=[]
    )
    
    # Convert datetime to date
    new_node = ast.Attribute(
        value=datetime_node,
        attr='date',
        ctx=ast.Load()
    )
    
    self._log_transformation(
        original_code,
        f'from_milliseconds_utc({astor.to_source(node.args[0]).strip()} * 1000.0).date()',
        'date fromtimestamp replacement'
    )
    return new_node
def add_imports(tree: ast.AST, needs_utils: bool) -> ast.AST:
    """Adds required imports if they don't exist."""
    has_datetime, has_timezone, has_utils = analyze_imports(tree)
    
    new_imports = []
    
    # Add datetime imports if needed
    if not has_datetime or not has_timezone:
        new_imports.append(
            ast.ImportFrom(
                module='datetime',
                names=[
                    ast.alias(name='datetime', asname=None),
                    ast.alias(name='timezone', asname=None)
                ],
                level=0
            )
        )
    
    # Add utils import if needed
    if needs_utils and not has_utils:
        new_imports.append(
            ast.ImportFrom(
                module='core.utils.datetime_utils',
                names=[
                    ast.alias(name='get_current_datetime_utc', asname=None),
                    ast.alias(name='from_milliseconds_utc', asname=None)
                ],
                level=0
            )
        )
    
    # Insert imports after any __future__ imports
    insert_pos = 0
    for i, node in enumerate(tree.body):
        if isinstance(node, ast.ImportFrom) and node.module == '__future__':
            insert_pos = i + 1
        else:
            break
            
    for import_stmt in reversed(new_imports):
        tree.body.insert(insert_pos, import_stmt)
    
    return tree
def process_file(filepath: str, debug_level: str = 'normal') -> Optional[FileChange]:
    is_test_file = filepath.endswith('_test.py')
    try:
        # Create backup
        backup_path = filepath + '.bak'
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            original_lines = len(content.splitlines())
        
       
            
        # Transform the code - USE THE PROPER TRANSFORMER
        tree = ast.parse(content)
        transformer = TimestampTransformer(
            debug_level=debug_level,
            is_test_file=is_test_file  # Add this line
        )
        modified_tree = transformer.visit(tree)
        
        if not transformer.needs_datetime_utils_import:
            return None
            
        # Add required imports
        modified_tree = add_imports(modified_tree, transformer.needs_datetime_utils_import)
        modified_code = astor.to_source(modified_tree).strip()        
        # Write changes
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(modified_code)
            
        return FileChange(
            filename=filepath,
            original_lines=original_lines,
            modified_lines=len(modified_code.splitlines()),
            changes_made=transformer.changes
        )
            
    except Exception as e:
        print(f"Error processing {filepath}: {str(e)}")
        return None

def analyze_file(filepath: str, debug_level: str = 'normal') -> Optional[FileChange]:
    try:
        print(f"\n=== Analyzing {filepath} ===")
        is_test_file = filepath.endswith('_test.py')  # Add this line
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            original_lines = len(content.splitlines())
        
        
            
        tree = ast.parse(content)
        transformer = TimestampTransformer(
            debug_level=debug_level,
            is_test_file=is_test_file  # Add this line
        )
        modified_tree = transformer.visit(tree)
        
        print(f"\nAnalysis results:")
        print(f"Datetime calls found: {transformer.datetime_calls_found}")
        print(f"Patterns matched: {transformer.patterns_matched}")
        print(f"Changes planned: {transformer.changes}")
        
        if not transformer.needs_datetime_utils_import:
            return None
            
        modified_tree = add_imports(modified_tree, transformer.needs_datetime_utils_import)
        modified_code = astor.to_source(modified_tree)
        modified_lines = len(modified_code.splitlines())
        
        return FileChange(
            filename=filepath,
            original_lines=original_lines,
            modified_lines=modified_lines,
            changes_made=transformer.changes
        )
            
    except Exception as e:
        print(f"Error analyzing {filepath}: {str(e)}")
        return None

def main():
    """Main migration function."""
    import argparse
    parser = argparse.ArgumentParser(description='Timestamp standardization migration')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without making them')
    parser.add_argument('--debug-level', choices=['quiet', 'normal', 'verbose'],
                       default='normal', help='Set debug output level')
    parser.add_argument('--start-dir', default='core',
                       help='Starting directory for migration')
    args = parser.parse_args()

    print(f"Starting timestamp standardization migration...")
    print(f"Mode: {'Dry run' if args.dry_run else 'Live run'}")
    print(f"Debug level: {args.debug_level}")
    print(f"Starting directory: {args.start_dir}")
    
    python_files = find_python_files(args.start_dir)
    total_files = len(python_files)
    print(f"Found {total_files} Python files to process")

    changes_made = []
    for i, filepath in enumerate(python_files, 1):
        print(f"Processing {i}/{total_files}: {filepath}")
        if args.dry_run:
            result = analyze_file(filepath, args.debug_level)
        else:
            result = process_file(filepath, args.debug_level)
        if result:
            changes_made.append(result)
    
    print("\nMigration Summary:")
    print(f"Processed {total_files} files")
    print(f"Modified {len(changes_made)} files")
    
    if changes_made:
        print("\nDetailed Changes:")
        for change in changes_made:
            print(f"\n{change.filename}:")
            for modification in change.changes_made:
                print(f"  - {modification}")
            print(f"  Lines: {change.original_lines} → {change.modified_lines}")

if __name__ == '__main__':
    main()