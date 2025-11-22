# coding: utf-8
#
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
# limitations under the License.]

"""Domain objects for Cloud task run."""

from __future__ import annotations

import datetime

from typing import List, TypedDict


class CloudTaskRunDict(TypedDict):
    """Dictionary representing the CloudTaskRun object."""

    task_run_id: str
    cloud_task_name: str
    task_id: str
    queue_id: str
    latest_job_state: str
    function_id: str
    exception_messages_for_failed_runs: List[str]
    last_updated: str
    current_retry_attempt: int
    created_on: str


class CloudTaskRun:
    """Domain object for the execution of an individual Cloud task."""

    def __init__(
        self,
        task_run_id: str,
        cloud_task_name: str,
        task_id: str,
        queue_id: str,
        latest_job_state: str,
        function_id: str,
        exception_messages_for_failed_runs: List[str],
        current_retry_attempt: int,
        last_updated: datetime.datetime,
        created_on: datetime.datetime,
    ) -> None:
        self.task_run_id = task_run_id
        self.cloud_task_name = cloud_task_name
        self.task_id = task_id
        self.queue_id = queue_id
        self.latest_job_state = latest_job_state
        self.function_id = function_id
        self.exception_messages_for_failed_runs = (
            exception_messages_for_failed_runs
        )
        self.current_retry_attempt = current_retry_attempt
        self.last_updated = last_updated
        self.created_on = created_on

    def to_dict(self) -> CloudTaskRunDict:
        """Returns a dictionary representation of this domain object.

        Returns:
            CloudTaskRunDict. A dictionary representation of the CloudTaskRun
            object, with keys matching the attributes of the object.
        """
        return {
            'task_run_id': self.task_run_id,
            'cloud_task_name': self.cloud_task_name,
            'task_id': self.task_id,
            'queue_id': self.queue_id,
            'latest_job_state': self.latest_job_state,
            'function_id': self.function_id,
            'exception_messages_for_failed_runs': (
                self.exception_messages_for_failed_runs
            ),
            'current_retry_attempt': self.current_retry_attempt,
            'last_updated': self.last_updated.isoformat(),
            'created_on': self.created_on.isoformat(),
        }

    @classmethod
    def from_dict(cls, cloud_task_run_dict: CloudTaskRunDict) -> CloudTaskRun:
        """Returns a domain object from a dictionary.

        Args:
            cloud_task_run_dict: CloudTaskRunDict. A dictionary representation
                of the CloudTaskRun object.

        Returns:
            CloudTaskRun. A CloudTaskRun domain object created from the given
            dictionary.
        """
        return cls(
            task_run_id=cloud_task_run_dict['task_run_id'],
            cloud_task_name=cloud_task_run_dict['cloud_task_name'],
            task_id=cloud_task_run_dict['task_id'],
            queue_id=cloud_task_run_dict['queue_id'],
            latest_job_state=cloud_task_run_dict['latest_job_state'],
            function_id=cloud_task_run_dict['function_id'],
            exception_messages_for_failed_runs=cloud_task_run_dict[
                'exception_messages_for_failed_runs'
            ],
            current_retry_attempt=cloud_task_run_dict['current_retry_attempt'],
            last_updated=datetime.datetime.fromisoformat(
                cloud_task_run_dict['last_updated']
            ),
            created_on=datetime.datetime.fromisoformat(
                cloud_task_run_dict['created_on']
            ),
        )


class VoiceoverRegenerationTaskMapping:
    """A domain object that models a voiceover regeneration request for an
    exploration, associated with a specific cloud task run ID.
    """

    def __init__(
        self, exploration_id, task_run_id, language_accent_to_content_status_map
    ) -> None:
        self.exploration_id = exploration_id
        self.task_run_id = task_run_id
        self.language_accent_to_content_status_map = (
            language_accent_to_content_status_map
        )

    def to_dict(self) -> dict:
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dictionary representation of the
            VoiceoverRegenerationTaskMapping object, with keys matching the
            attributes of the object.
        """

        return {
            'exploration_id': self.exploration_id,
            'task_run_id': self.task_run_id,
            'language_accent_to_content_status_map': (
                self.language_accent_to_content_status_map
            ),
        }

    @classmethod
    def from_dict(cls, mapping_dict: dict) -> VoiceoverRegenerationTaskMapping:
        """Returns a domain object from a dictionary.

        Args:
            mapping_dict: dict. A dictionary representation of the
                VoiceoverRegenerationTaskMapping object.

        Returns:
            VoiceoverRegenerationTaskMapping. A
            VoiceoverRegenerationTaskMapping domain object created from the
            given dictionary.
        """
        return cls(
            exploration_id=mapping_dict['exploration_id'],
            task_run_id=mapping_dict['task_run_id'],
            language_accent_to_content_status_map=(
                mapping_dict['language_accent_to_content_status_map']
            ),
        )

    def are_all_voiceovers_generated(self) -> bool:
        """Checks if all the contents for the voiceover regeneration request
        have been generated.

        Returns:
            bool. Whether all contents have been generated.
        """
        for (
            content_id_to_regeneration_status
        ) in self.language_accent_to_content_status_map.values():
            for status in content_id_to_regeneration_status.values():
                if status != 'generated':
                    return False
        return True

    def update_content_status_for_cloud_task_run(
        self, language_accent_code: str, failed_content_ids: List[str]
    ) -> dict:
        if (
            language_accent_code
            not in self.language_accent_to_content_status_map
        ):
            return

        content_status_map = self.language_accent_to_content_status_map.get(
            language_accent_code
        )

        for content_id, regeneration_status in content_status_map.items():
            if content_id in failed_content_ids:
                content_status_map[content_id] = 'failed'
            else:
                content_status_map[content_id] = 'succeeded'

    def create_default_voiceover_regeneration_task_mapping(
        exploration_id: str, task_run_id: str
    ) -> VoiceoverRegenerationTaskMapping:
        """Creates a default voiceover regeneration task mapping.

        Args:
            exploration_id: str. The ID of the exploration.
            task_run_id: str. The ID of the cloud task run.

        Returns:
            VoiceoverRegenerationTaskMapping. The created voiceover
            regeneration task mapping.
        """
        return VoiceoverRegenerationTaskMapping(
            exploration_id=exploration_id,
            task_run_id=task_run_id,
            language_accent_to_content_status_map={},
        )

    def add_language_accent_to_content_status_map(
        self, language_accent_code: str, content_id_list: List[str]
    ) -> None:
        """Adds a new language accent to content status mapping for the
        voiceover regeneration task.

        Args:
            language_accent_code: str. The language accent code.
            content_id_list: List[str]. The list of content IDs for which
                voiceovers need to be regenerated.
        """
        if language_accent_code in self.language_accent_to_content_status_map:
            return

        content_status_map = {}
        for content_id in content_id_list:
            content_status_map[content_id] = 'generating'

        self.language_accent_to_content_status_map[language_accent_code] = (
            content_status_map
        )
