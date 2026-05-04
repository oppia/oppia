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

from core import feconf

from typing import Dict, List, TypedDict


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

    def to_dict_with_timezone_info(self) -> CloudTaskRunDict:
        """Returns a dictionary representation of this domain object with timezone
        information included in the datetime fields.

        Returns:
            CloudTaskRunDict. A dictionary representation of the CloudTaskRun
            object, with keys matching the attributes of the object and timezone
            information included in the datetime fields.
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
            'last_updated': self.last_updated.replace(
                tzinfo=datetime.timezone.utc
            ).isoformat(),
            'created_on': self.created_on.replace(
                tzinfo=datetime.timezone.utc
            ).isoformat(),
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


class VoiceoverRegenerationJobDict(TypedDict):
    """Dictionary representing the VoiceoverRegenerationJob object."""

    exploration_id: str
    task_run_id: str
    language_accent_to_content_status_map: Dict[str, Dict[str, str]]


class VoiceoverRegenerationJob:
    """Domain object class that models the voiceover regeneration request for an
    exploration, associated with a specific cloud task run.
    """

    def __init__(
        self,
        exploration_id: str,
        task_run_id: str,
        language_accent_to_content_status_map: Dict[str, Dict[str, str]],
    ) -> None:
        """Initializes a VoiceoverRegenerationJob domain object.

        Args:
            exploration_id: str. The ID of the exploration.
            task_run_id: str. The ID of the cloud task run.
            language_accent_to_content_status_map: dict. A mapping of language
                accents to their content regeneration status.
        """
        self.exploration_id = exploration_id
        self.task_run_id = task_run_id
        self.language_accent_to_content_status_map = (
            language_accent_to_content_status_map
        )

    def to_dict(self) -> VoiceoverRegenerationJobDict:
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dictionary representation of the
            VoiceoverRegenerationJob object, with keys matching the
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
    def from_dict(
        cls,
        voiceover_regeneration_job_dict: VoiceoverRegenerationJobDict,
    ) -> VoiceoverRegenerationJob:
        """Returns an instance of VoiceoverRegenerationJob from the
        given dictionary.

        Args:
            voiceover_regeneration_job_dict: dict. A dictionary
                representation of the VoiceoverRegenerationJob object.

        Returns:
            VoiceoverRegenerationJob. A VoiceoverRegenerationJob
            domain object created from the given dict representation.
        """
        return cls(
            exploration_id=voiceover_regeneration_job_dict['exploration_id'],
            task_run_id=voiceover_regeneration_job_dict['task_run_id'],
            language_accent_to_content_status_map=(
                voiceover_regeneration_job_dict[
                    'language_accent_to_content_status_map'
                ]
            ),
        )

    @classmethod
    def create_default(
        cls, exploration_id: str, task_run_id: str
    ) -> VoiceoverRegenerationJob:
        """Creates a default voiceover regeneration job instance.

        Args:
            exploration_id: str. The ID of the exploration.
            task_run_id: str. The ID of the cloud task run.

        Returns:
            VoiceoverRegenerationJob. The created voiceover regeneration job
            instance with an empty language accent to content status map.
        """
        return cls(
            exploration_id=exploration_id,
            task_run_id=task_run_id,
            language_accent_to_content_status_map={},
        )

    def are_all_voiceovers_generated(self) -> bool:
        """Checks if all the contents for the voiceover regeneration request
        have been generated successfully.

        Returns:
            bool. Whether all contents have been generated successfully or not.
        """
        for (
            content_id_to_regeneration_status
        ) in self.language_accent_to_content_status_map.values():
            for (
                regeneration_status
            ) in content_id_to_regeneration_status.values():
                if (
                    regeneration_status
                    != feconf.VoiceoverRegenerationState.SUCCEEDED.value
                ):
                    return False
        return True

    def are_all_voiceovers_attempted(self) -> bool:
        """Checks if all the contents for the voiceover regeneration request
        have been attempted i.e., either succeeded or failed, none
        of them are still generating.

        Returns:
            bool. Whether all contents have been attempted or not.
        """
        for (
            content_id_to_regeneration_status
        ) in self.language_accent_to_content_status_map.values():
            for (
                regeneration_status
            ) in content_id_to_regeneration_status.values():
                if (
                    regeneration_status
                    == feconf.VoiceoverRegenerationState.GENERATING.value
                ):
                    return False
        return True

    def update_failed_content_status(
        self, language_accent_code: str, failed_content_ids: List[str]
    ) -> None:
        """Updates the content-status map for a given language-accent code by
        marking the content IDs in failed_content_ids as FAILED.

        Args:
            language_accent_code: str. The language accent code.
            failed_content_ids: List[str]. The list of content IDs for which
                voiceover regeneration has failed.
        """
        content_status_map = self.language_accent_to_content_status_map.get(
            language_accent_code, {}
        )

        for content_id in failed_content_ids:
            if content_id in content_status_map:
                content_status_map[content_id] = (
                    feconf.VoiceoverRegenerationState.FAILED.value
                )

    def update_succeeded_content_status(
        self, language_accent_code: str, succeeded_content_ids: List[str]
    ) -> None:
        """Updates the content-status map for a given language-accent code by
        marking the content IDs in succeeded_content_ids as SUCCEEDED.

        Args:
            language_accent_code: str. The language accent code.
            succeeded_content_ids: List[str]. The list of content IDs for which
                voiceover regeneration has succeeded.
        """
        content_status_map = self.language_accent_to_content_status_map.get(
            language_accent_code, {}
        )

        for content_id in succeeded_content_ids:
            if content_id in content_status_map:
                content_status_map[content_id] = (
                    feconf.VoiceoverRegenerationState.SUCCEEDED.value
                )

    def update_remaining_content_status_as_succeeded(self) -> None:
        """Updates the content-status map for a given language-accent code by
        marking all content IDs which are still GENERATING as SUCCEEDED.
        """
        for (
            content_status_map
        ) in self.language_accent_to_content_status_map.values():
            for content_id, regeneration_status in content_status_map.items():
                if (
                    regeneration_status
                    == feconf.VoiceoverRegenerationState.GENERATING.value
                ):
                    content_status_map[content_id] = (
                        feconf.VoiceoverRegenerationState.SUCCEEDED.value
                    )

    def update_final_content_status(
        self, language_accent_code: str, failed_content_ids: List[str]
    ) -> None:
        """Updates the content-status map for a given language-accent code by
        marking the content IDs in failed_content_ids as FAILED and all
        remaining content IDs as SUCCEEDED.

        Args:
            language_accent_code: str. The language accent code.
            failed_content_ids: List[str]. The list of content IDs for which
                voiceover regeneration has failed.
        """
        content_status_map = self.language_accent_to_content_status_map.get(
            language_accent_code, {}
        )

        for content_id in content_status_map.keys():
            if content_id in failed_content_ids:
                content_status_map[content_id] = (
                    feconf.VoiceoverRegenerationState.FAILED.value
                )
            else:
                content_status_map[content_id] = (
                    feconf.VoiceoverRegenerationState.SUCCEEDED.value
                )

    def add_language_accent_to_content_status_map(
        self, language_accent_code: str, content_id_list: List[str]
    ) -> None:
        """Adds a new language accent to content status mapping for the
        voiceover regeneration task and mark all content IDs as GENERATING.

        Args:
            language_accent_code: str. The language accent code.
            content_id_list: List[str]. The list of content IDs for which
                voiceovers need to be regenerated.
        """
        content_status_map = {}
        for content_id in content_id_list:
            content_status_map[content_id] = (
                feconf.VoiceoverRegenerationState.GENERATING.value
            )

        self.language_accent_to_content_status_map[language_accent_code] = (
            content_status_map
        )

    def count_total_failed_contents(self) -> int:
        """Counts the total number of contents for which voiceover regeneration
        has failed.

        Returns:
            int. The total number of contents for which voiceover regeneration
            has failed.
        """
        total_failed_contents = 0
        for (
            content_id_to_regeneration_status
        ) in self.language_accent_to_content_status_map.values():
            for (
                regeneration_status
            ) in content_id_to_regeneration_status.values():
                if (
                    regeneration_status
                    == feconf.VoiceoverRegenerationState.FAILED.value
                ):
                    total_failed_contents += 1

        return total_failed_contents


class VoiceoverRegenerationTaskBatchDict(TypedDict):
    """Dictionary representing the VoiceoverRegenerationTaskBatch object."""

    parent_cloud_task_run_id: str
    child_cloud_task_run_id: str
    exploration_id: str
    exploration_version: int
    language_accent_code: str
    content_ids_to_contents_map: Dict[str, str]


class VoiceoverRegenerationTaskBatch:
    """Voiceover regeneration for a large number of contents within a single
    Cloud Task run (deferred request) significantly increases the workload and
    may lead to timeout failures due to Gunicorn limitations.

    To mitigate this issue, a single deferred regeneration task is split into
    multiple smaller batches, organized in a parent-child relationship between
    Cloud Task runs.

    This class is the domain class representation for
    VoiceoverRegenerationBatchExecutionModel.
    """

    def __init__(
        self,
        parent_cloud_task_run_id: str,
        child_cloud_task_run_id: str,
        exploration_id: str,
        exploration_version: int,
        language_accent_code: str,
        content_ids_to_contents_map: Dict[str, str],
    ) -> None:
        self.parent_cloud_task_run_id = parent_cloud_task_run_id
        self.child_cloud_task_run_id = child_cloud_task_run_id
        self.exploration_id = exploration_id
        self.exploration_version = exploration_version
        self.language_accent_code = language_accent_code
        self.content_ids_to_contents_map = content_ids_to_contents_map

    def to_dict(self) -> VoiceoverRegenerationTaskBatchDict:
        """Returns a dictionary representation of this domain object.

        Returns:
            dict. A dictionary representation of the
            VoiceoverRegenerationTaskBatch object, with keys matching the
            attributes of the object.
        """
        return {
            'parent_cloud_task_run_id': self.parent_cloud_task_run_id,
            'child_cloud_task_run_id': self.child_cloud_task_run_id,
            'exploration_id': self.exploration_id,
            'exploration_version': self.exploration_version,
            'language_accent_code': self.language_accent_code,
            'content_ids_to_contents_map': self.content_ids_to_contents_map,
        }

    @classmethod
    def from_dict(
        cls,
        voiceover_regeneration_task_batch_dict: VoiceoverRegenerationTaskBatchDict,
    ) -> VoiceoverRegenerationTaskBatch:
        """Returns an instance of VoiceoverRegenerationTaskBatch from the
        given dictionary.

        Args:
            voiceover_regeneration_task_batch_dict: dict. A dictionary
                representation of the VoiceoverRegenerationTaskBatch object.

        Returns:
            VoiceoverRegenerationTaskBatch. A VoiceoverRegenerationTaskBatch
            domain object created from the given dict representation.
        """
        return cls(
            parent_cloud_task_run_id=voiceover_regeneration_task_batch_dict[
                'parent_cloud_task_run_id'
            ],
            child_cloud_task_run_id=voiceover_regeneration_task_batch_dict[
                'child_cloud_task_run_id'
            ],
            exploration_id=voiceover_regeneration_task_batch_dict[
                'exploration_id'
            ],
            exploration_version=voiceover_regeneration_task_batch_dict[
                'exploration_version'
            ],
            language_accent_code=voiceover_regeneration_task_batch_dict[
                'language_accent_code'
            ],
            content_ids_to_contents_map=voiceover_regeneration_task_batch_dict[
                'content_ids_to_contents_map'
            ],
        )
