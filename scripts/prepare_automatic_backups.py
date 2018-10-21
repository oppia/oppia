# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Contains routines which will add a backup cron job to prepare Oppia for a
deployment push to https://www.oppia.org/.
"""
import sys

import utils

_BACKUP_NAME_PREFIX = 'opbkp'
_BACKUP_EVENT_QUEUE_NAME = 'backups'
_BACKUP_EVENT_QUEUE_RATE = '5/s'
_MAX_BACKUP_URL_LENGTH = 2000
_CRON_YAML_FILE_NAME = 'cron.yaml'
_OMITTED_MODELS = [
    'JobModel', 'ContinuousComputationModel', 'FeedbackAnalyticsModel',
    'ExplorationRecommendationsModel', 'TopicSimilaritiesModel',
    'ExplorationAnnotationsModel', 'StateAnswersCalcOutputModel',
    'UserRecentChangesBatchModel', 'UserStatsModel']


def generate_backup_url(cloud_storage_bucket_name, module_class_names):
    """Generates updated backup url.

    Args:
        cloud_storage_bucket_name: str. Name of cloud storage bucket.
        module_class_names: list(str). List of newly added module and class
            names.

    Returns:
        str. url of backup.
    """
    return (
        '/_ah/datastore_admin/backup.create?name=%s&kind=%s&queue=%s'
        '&filesystem=gs&gs_bucket_name=%s' % (
            _BACKUP_NAME_PREFIX,
            '&kind='.join(module_class_names),
            _BACKUP_EVENT_QUEUE_NAME,
            cloud_storage_bucket_name))


def update_cron_dict(cron_dict):
    """Adds new url in cron file for backup.

    Args:
        cron_dict: dict(str ,str). Content of yaml file in dictionary type.
        The keys and values are as follows:
            'description': str. weekly backup.
            'url': str. new backup url.
            'schedule': str. scheduled time of cron job.
            'target': str. backup target.
    """
    sys_args = sys.argv
    cloud_storage_bucket_name = sys_args[1]
    module_class_names = [
        module_name for module_name in sys_args[2:]
        if module_name not in _OMITTED_MODELS]

    # TODO(bhenning): Consider improving this to avoid generating a backup URL
    # for each tested subset of module_class_names.
    bucketed_module_class_names = []
    backup_urls = []
    for module_class_name in module_class_names:
        latest_bucket = []
        potential_bucket = [module_class_name]
        if bucketed_module_class_names:
            latest_bucket = bucketed_module_class_names[-1]
        backup_url = generate_backup_url(
            cloud_storage_bucket_name, latest_bucket + potential_bucket)
        if not bucketed_module_class_names or len(
                backup_url) >= _MAX_BACKUP_URL_LENGTH:
            bucketed_module_class_names.append(potential_bucket)
            backup_urls.append(backup_url)
        else:
            bucketed_module_class_names[-1] += potential_bucket
            backup_urls[-1] = backup_url

    for idx, backup_url in enumerate(backup_urls):
        cron_dict['cron'].append({
            'description': 'weekly backup (part %d/%d)' % (
                idx + 1, len(backup_urls)),
            'url': '%s' % backup_url,
            'schedule': 'every thursday 09:00',
            'target': 'ah-builtin-python-bundle'
        })


def get_cron_dict():
    """Gets cron file content in dict format.

    Returns:
        dict(str, str). yaml file in dict format.
        The keys and values are as follows:
            'description': str. weekly backup.
            'url': str. current backup url.
            'schedule': str. sheduled time of cron job.
            'target': str. backup target.
    """
    return utils.dict_from_yaml(utils.get_file_contents(_CRON_YAML_FILE_NAME))


def save_cron_dict(cron_dict):
    """Converts dict into yaml format and saving into a cron file.

    Args:
        cron_dict: dict. The content to save as a YAML file.
    """
    with open(_CRON_YAML_FILE_NAME, 'wt') as cron_yaml_file:
        cron_yaml_file.write(utils.yaml_from_dict(cron_dict))


def update_yaml_files():
    """Adds new updated url in cron file for backup."""
    cron_dict = get_cron_dict()
    update_cron_dict(cron_dict)
    save_cron_dict(cron_dict)


def _prepare_for_prod():
    """It calls function that updates cron file."""
    update_yaml_files()


if __name__ == '__main__':
    _prepare_for_prod()
