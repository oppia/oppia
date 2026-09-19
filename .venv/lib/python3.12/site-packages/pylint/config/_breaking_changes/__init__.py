# Licensed under the GPL: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
# For details: https://github.com/pylint-dev/pylint/blob/main/LICENSE
# Copyright (c) https://github.com/pylint-dev/pylint/blob/main/CONTRIBUTORS.txt

"""List the breaking changes in configuration files and their solutions."""

from __future__ import annotations

import enum
import textwrap
from typing import NamedTuple


class Intention(enum.Enum):
    KEEP = "Keep the same behavior"
    USE_DEFAULT = "Use the new default behavior"
    # This could/should always be automated
    FIX_CONF = "Fix the configuration to become consistent again"


class BreakingChange(enum.Enum):
    MESSAGE_MADE_DISABLED_BY_DEFAULT = "{symbol} ({msgid}) was disabled by default"
    MESSAGE_MADE_ENABLED_BY_DEFAULT = "{symbol} ({msgid}) was enabled by default"
    MESSAGE_MOVED_TO_EXTENSION = "{symbol} ({msgid}) was moved to {extension}"
    EXTENSION_REMOVED = "{extension} was removed"
    OPTION_REMOVED = "{option} option was removed"
    OPTION_RENAMED = "{option} option was renamed to {new_value}"
    OPTION_BEHAVIOR_CHANGED = "{option} behavior changed: {description}"
    # This kind of upgrade is non-breaking but if we want to automatically upgrade it,
    # then we should use the message store and old_names values instead of duplicating
    # MESSAGE_RENAMED= "{symbol} ({msgid}) was renamed"


class Condition(enum.Enum):
    MESSAGE_IS_ENABLED = "{symbol} ({msgid}) is enabled"
    MESSAGE_IS_NOT_ENABLED = "{symbol} ({msgid}) is not enabled"
    MESSAGE_IS_DISABLED = "{symbol} ({msgid}) is disabled"
    MESSAGE_IS_NOT_DISABLED = "{symbol} ({msgid}) is not disabled"
    EXTENSION_IS_LOADED = "{extension} is loaded"
    EXTENSION_IS_NOT_LOADED = "{extension} is not loaded"
    OPTION_IS_PRESENT = "{option} is present in configuration"
    OPTION_IS_NOT_PRESENT = "{option} is not present in configuration"


class MessageInformation(NamedTuple):
    msgid_or_symbol: str
    extension: str | None = None


class OptionInformation(NamedTuple):
    option: list[str] | str
    description: str | None = None
    new_value: str | None = None


class Solution(enum.Enum):
    ADD_EXTENSION = "Add {extension} in 'load-plugins' option"
    REMOVE_EXTENSION = "Remove {extension} from the 'load-plugins' option"
    ENABLE_MESSAGE_EXPLICITLY = (
        "{symbol} ({msgid}) should be added in the 'enable' option"
    )
    ENABLE_MESSAGE_IMPLICITLY = (
        "{symbol} ({msgid}) should be removed from the 'disable' option"
    )
    DISABLE_MESSAGE_EXPLICITLY = (
        "{symbol} ({msgid}) should be added in the 'disable' option"
    )
    DISABLE_MESSAGE_IMPLICITLY = (
        "{symbol} ({msgid}) should be removed from the 'enable' option"
    )
    REMOVE_OPTION = "Remove {option} from configuration"
    REVIEW_OPTION = "Review and adjust or remove {option}: {description}"
    RENAME_OPTION = "Rename {option} to {new_value}"
    DO_NOTHING = "Do nothing"


ConditionsToBeAffected = list[Condition]
# A solution to a breaking change might imply multiple actions
MultipleActionSolution = list[Solution]
# Sometimes there's multiple solutions and the user needs to choose
Solutions = dict[Intention, MultipleActionSolution]
Information = MessageInformation | OptionInformation
BreakingChangeWithSolution = tuple[
    BreakingChange, Information, ConditionsToBeAffected, Solutions
]

NO_SELF_USE = MessageInformation(
    msgid_or_symbol="no-self-use", extension="pylint.extensions.no_self_use"
)
CONFIGURATION_BREAKING_CHANGES: dict[str, list[BreakingChangeWithSolution]] = {
    "2.7.3": [
        (
            BreakingChange.OPTION_RENAMED,
            OptionInformation(
                option="extension-pkg-whitelist",
                new_value="extension-pkg-allow-list",
            ),
            [Condition.OPTION_IS_PRESENT],
            {Intention.FIX_CONF: [Solution.RENAME_OPTION]},
        ),
    ],
    "2.14.0": [
        (
            BreakingChange.MESSAGE_MOVED_TO_EXTENSION,
            NO_SELF_USE,
            [Condition.MESSAGE_IS_ENABLED, Condition.EXTENSION_IS_NOT_LOADED],
            {
                Intention.KEEP: [Solution.ADD_EXTENSION],
                Intention.USE_DEFAULT: [Solution.DISABLE_MESSAGE_IMPLICITLY],
            },
        ),
    ],
    "3.0.0": [
        (
            BreakingChange.EXTENSION_REMOVED,
            MessageInformation(
                msgid_or_symbol="compare-to-zero",
                extension="pylint.extensions.comparetozero",
            ),
            [Condition.MESSAGE_IS_NOT_DISABLED, Condition.EXTENSION_IS_LOADED],
            {
                Intention.FIX_CONF: [
                    Solution.REMOVE_EXTENSION,
                    Solution.ENABLE_MESSAGE_EXPLICITLY,
                ],
            },
        ),
        (
            BreakingChange.EXTENSION_REMOVED,
            MessageInformation(
                msgid_or_symbol="compare-to-empty-string",
                extension="pylint.extensions.emptystring",
            ),
            [Condition.MESSAGE_IS_NOT_DISABLED, Condition.EXTENSION_IS_LOADED],
            {
                Intention.FIX_CONF: [
                    Solution.REMOVE_EXTENSION,
                    Solution.ENABLE_MESSAGE_EXPLICITLY,
                ],
            },
        ),
    ],
    "4.0.0": [
        (
            BreakingChange.OPTION_REMOVED,
            OptionInformation(
                option="suggestion-mode",
                description="This option is no longer used and should be removed",
            ),
            [Condition.OPTION_IS_PRESENT],
            {
                Intention.FIX_CONF: [Solution.REMOVE_OPTION],
            },
        ),
        (
            BreakingChange.OPTION_BEHAVIOR_CHANGED,
            OptionInformation(
                option=["const-rgx", "const-naming-style"],
                description=textwrap.dedent(
                    """
                    In 'invalid-name', module-level constants that are reassigned are now treated
                    as variables and checked against ``--variable-rgx`` rather than ``--const-rgx``.
                    Module-level lists, sets, and objects can pass against either regex.

                    You may need to adjust this option to match your naming conventions.

                    See the release notes for concrete examples:
                    https://pylint.readthedocs.io/en/stable/whatsnew/4/4.0/index.html""",
                ),
            ),
            [],
            {
                Intention.KEEP: [Solution.REVIEW_OPTION],
                Intention.USE_DEFAULT: [Solution.DO_NOTHING],
            },
        ),
    ],
}
