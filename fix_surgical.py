#!/usr/bin/env python3
"""Apply surgical punctuation fixes to logged-out-user.ts."""

file_path = (
    'core/tests/puppeteer-acceptance-tests/utilities/user/logged-out-user.ts'
)

with open(file_path, 'r') as f:
    lines = f.readlines()

# Find and replace comments based on their content patterns
new_lines = []
for i, line in enumerate(lines, 1):
    stripped = line.strip()

    # Line 3999 pattern - manual check
    if stripped.startswith('// This is a manual check'):
        new_lines.append('    // This is a manual check for the element.\n')
    # Line 4005 pattern - ensures visibility
    elif stripped.startswith('// This ensures the element'):
        new_lines.append(
            '    // This ensures the element is visible on screen.\n'
        )
    # Line 4015 pattern - reloads page
    elif stripped.startswith('// This reloads the page'):
        new_lines.append('    // This reloads the page to handle latency.\n')
    # Line 4020 pattern - verifies success
    elif stripped.startswith('// This verifies the success'):
        new_lines.append(
            '    // This verifies the success state after reload.\n'
        )
    # Line 4023 pattern - final verification
    elif stripped.startswith('// Final verification'):
        new_lines.append('    // Final verification of the visibility.\n')
    else:
        new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Applied surgical punctuation fixes")
