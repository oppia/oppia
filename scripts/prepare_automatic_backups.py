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
deployment push to https://oppia.org/.
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
    return (
        '/_ah/datastore_admin/backup.create?name=%s&kind=%s&queue=%s'
        '&filesystem=gs&gs_bucket_name=%s' % (
            _BACKUP_NAME_PREFIX,
            '&kind='.join(module_class_names),
            _BACKUP_EVENT_QUEUE_NAME,
            cloud_storage_bucket_name))


def update_cron_dict(cron_dict):
    sys_args = sys.argv
    cloud_storage_bucket_name = sys_args[1]
    module_class_names = [
        module_name for module_name in sys_args[2:]
        if module_name not in _OMITTED_MODELS]
    backup_url = generate_backup_url(
        cloud_storage_bucket_name, module_class_names)
    print 'Generating URL to backup %d models (%d were skipped)' % (
        len(module_class_names), len(sys_args[2:]) - len(module_class_names))

    average_model_name_length = (
        sum([len(model_name) for model_name in module_class_names])
        / len(module_class_names))
    warning_threshold = _MAX_BACKUP_URL_LENGTH - average_model_name_length * 3
    if len(backup_url) > warning_threshold:
        print (
            'IMPORTANT: Bad things are going to happen in the next release if '
            'you don\'t fix this. Bring it up at the TL meeting.')
    if len(backup_url) > _MAX_BACKUP_URL_LENGTH:
        raise Exception(
            'Backup URL exceeds app engine limit by %d: %s' % (
                len(backup_url) - _MAX_BACKUP_URL_LENGTH, backup_url))

    cron_dict['cron'].append({
        'description': 'weekly backup',
        'url': '%s' % backup_url,
        'schedule': 'every thursday 09:00',
        'target': 'ah-builtin-python-bundle'
    })


def get_cron_dict():
    return utils.dict_from_yaml(utils.get_file_contents(_CRON_YAML_FILE_NAME))


def save_cron_dict(cron_dict):
    with open(_CRON_YAML_FILE_NAME, 'wt') as cron_yaml_file:
        cron_yaml_file.write(utils.yaml_from_dict(cron_dict))


def update_yaml_files():
    cron_dict = get_cron_dict()
    update_cron_dict(cron_dict)
    save_cron_dict(cron_dict)


def _prepare_for_prod():
    update_yaml_files()

if __name__ == '__main__':
    _prepare_for_prod()
