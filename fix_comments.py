#!/usr/bin/env python3
"""Fix exactly 5 comment lines in logged-out-user.ts."""

file_path = (
    'core/tests/puppeteer-acceptance-tests/utilities/user/logged-out-user.ts'
)

with open(file_path, 'r') as f:
    lines = f.readlines()

# Define the exact replacements (1-indexed line numbers)
replacements = {
    3999: '    // This is a manual check for the element.\n',
    4002: '    // This ensures the element is visible on screen.\n',
    4009: '    // This reloads the page to handle latency.\n',
    4014: '    // This verifies the success state after reload.\n',
    4017: '    // Final verification of the visibility.\n',
}

new_lines = []
for i, line in enumerate(lines, 1):
    if i in replacements:
        new_lines.append(replacements[i])
    else:
        new_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(new_lines)

print("Fixed 5 comment lines in logged-out-user.ts")
