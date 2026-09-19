# Licensed under the GPL: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
# For details: https://github.com/pylint-dev/pylint/blob/main/LICENSE
# Copyright (c) https://github.com/pylint-dev/pylint/blob/main/CONTRIBUTORS.txt

import operator
import re
import sys
from pathlib import Path

# This is faster/terser without f-strings:
# '"%d%d%d" % sys.version_info[:3]': (best of 5: 214 nanoseconds per loop)
# '"".join(str(x) for x in sys.version_info[:3])'`: best of 5: 546 nanoseconds per loop
# pylint: disable-next=consider-using-f-string
SYS_VERS_STR = "%d%d%d" % sys.version_info[:3]  # noqa: UP031
TITLE_UNDERLINES = ["", "=", "-", "."]
UPDATE_OPTION = "--update-functional-output"
UPDATE_FILE = Path("pylint-functional-test-update")
# Common sub-expressions.
_MESSAGE = {"msg": r"[a-z][a-z\-]+"}
# Matches a #,
#  - followed by a comparison operator and a Python version (optional),
#  - followed by a line number with a +/- (optional),
#  - followed by a list of bracketed message symbols.
# Used to extract expected messages from testdata files.
_EXPECTED_RE = re.compile(
    r"\s*#\s*(?:(?P<line>[+-]?[0-9]+):)?"  # pylint: disable=consider-using-f-string
    r"(?:(?P<op>[><=]+) *(?P<version>[0-9.]+):)?"
    r"\s*\[(?P<msgs>{msg}(?:,\s*{msg})*)]".format(**_MESSAGE)
)

_OPERATORS = {">": operator.gt, "<": operator.lt, ">=": operator.ge, "<=": operator.le}
