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

"""Gets the status of a GitHub workflow run using the status of its jobs."""

from __future__ import annotations

import argparse
import enum
import json
import os

from typing import Dict, Final, List, Optional, TypedDict

_PARSER: Final = argparse.ArgumentParser(
    description="""
Checks the status of a GitHub workflow run using the status of its jobs.
""")

_PARSER.add_argument(
    '--jobs', type=str, required=True,
)


class GithubJobResultEnum(enum.Enum):
    """The possible results of a GitHub job."""

    SUCCESS = 'success'
    FAILURE = 'failure'
    SKIPPED = 'skipped'
    CANCELLED = 'cancelled'


class WorkflowStatusEnum(enum.Enum):
    """The possible statuses of a GitHub workflow."""

    SUCCESS = 'success'
    FAILURE = 'failure'


class GithubJobDict(TypedDict):
    """A dictionary representing a GitHub job."""

    result: GithubJobResultEnum


def get_workflow_status(jobs: Dict[str, GithubJobDict]) -> WorkflowStatusEnum:
    """Gets the status of a GitHub workflow run using the status of its jobs."""
    workflow_is_successful = all(
        GithubJobResultEnum(job['result']) in [
            GithubJobResultEnum.SUCCESS, GithubJobResultEnum.SKIPPED
        ] for job in jobs.values()
    )

    return (
        WorkflowStatusEnum.SUCCESS if workflow_is_successful
        else WorkflowStatusEnum.FAILURE
    )


def main(args: Optional[List[str]] = None) -> None:
    """Checks the status of a GitHub workflow run using the status
    of its jobs.
    """
    parsed_args = _PARSER.parse_args(args)

    jobs: Dict[str, GithubJobDict] = json.loads(parsed_args.jobs) or {}

    for job_name, job in jobs.items():
        print('Job \'%s\' status: %s' % (job_name, job['result']))

    workflow_status = get_workflow_status(jobs)
    print('Workflow status: %s' % workflow_status.value)

    with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as f:
        print(f'WORKFLOW_STATUS={workflow_status.value}', file=f)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when check_e2e_tests_are_captured_in_ci.py
# is used as a script.
if __name__ == '__main__':  # pragma: no cover
    main()
