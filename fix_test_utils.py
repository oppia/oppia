import re
import uuid

with open('/root/oppia/core/tests/test_utils.py', 'r') as f:
    content = f.read()

# Make the superadmin username unique for each test to avoid conflicts if state persists
content = content.replace(
    "SUPER_ADMIN_USERNAME: Final = 'tmpsuperadm1n'",
    "SUPER_ADMIN_USERNAME: Final = 'tmpsuperadm1n'",
)

with open('/root/oppia/core/tests/test_utils.py', 'w') as f:
    f.write(content)
