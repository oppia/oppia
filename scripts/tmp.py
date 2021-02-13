import re

from scripts.check_frontend_coverage import NOT_FULLY_COVERED_FILENAMES


DIRECTIVE_REGEX = r'[a-zA-Z0-9-.]+.directive.ts'
COMPONENT_REGEX = r'[a-zA-Z0-9-.]+.component.ts'
SERVICE_REGEX = r'[a-zA-Z0-9-.]+.service.ts'


directives = []
components = []
services = []
other = []

for filename in NOT_FULLY_COVERED_FILENAMES:
    lst = None
    if re.match(DIRECTIVE_REGEX, filename):
        lst = directives
    if re.match(COMPONENT_REGEX, filename):
        if lst:
            raise AssertionError(
                'Filename {} matches multiple'.format(filename))
        lst = components
    if re.match(SERVICE_REGEX, filename):
        if lst:
            raise AssertionError(
                'Filename {} matches multiple'.format(filename))
        lst = services
    if lst is None:
        lst = other
    lst.append(filename)

with open('directives.txt', 'w') as f:
    f.write('\n'.join(directives))
with open('components.txt', 'w') as f:
    f.write('\n'.join(components))
with open('services.txt', 'w') as f:
    f.write('\n'.join(services))
with open('other.txt', 'w') as f:
    f.write('\n'.join(other))
