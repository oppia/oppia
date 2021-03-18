# Copyright 2021 The Oppia Authors. All Rights Reserved.
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
"""This script performs cla check for PR authors.
"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import argparse
import json
import os.path
import subprocess
import sys

import python_utils

from google.oauth2.credentials import Credentials # isort:skip pylint: disable=import-only-modules
from googleapiclient.discovery import build # isort:skip pylint: disable=import-only-modules

SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

# The ID and range of a sample spreadsheet.
LINK_RESULT = (
    'https://github.com/oppia/oppia/wiki' +
    '/Contributing-code-to-Oppia#setting-things-up')
PR_NUMBER = os.environ['PR_NUMBER']
SAMPLE_SPREADSHEET_ID = '1naQC7iEfnro5iOjTFEn7iPCxNMPaPa4YnIddjT5CTM8'
SAMPLE_RANGE_NAME = 'Usernames'
TOKEN = os.environ['SHEETS_TOKEN']

_PARSER = argparse.ArgumentParser(
    description="""
Run the script from the oppia root folder:
    python -m scripts.cla_check
Note that the root folder MUST be named 'oppia'.
""")


def get_values():
    """Does Google Sheets API Call."""
    result = None
    creds = None
    try:
        creds = Credentials.from_authorized_user_info(
            json.loads(TOKEN), scopes=SCOPES)  # pylint: disable=explicit-keyword-args
        service = build('sheets', 'v4', credentials=creds)
        sheet = service.spreadsheets()
        result = sheet.values().get(
            spreadsheetId=SAMPLE_SPREADSHEET_ID, range=SAMPLE_RANGE_NAME
            ).execute()
        result = result.get('values', [])
    except Exception as e:
        python_utils.PRINT('API error:', e)
        cmd = 'gh pr comment ' + PR_NUMBER + ' --body "CLA_CHECK: API ERROR."'
        python_utils.PRINT(cmd)
        subprocess.Popen(cmd, stderr=subprocess.STDOUT, shell=True).wait()
    return result


def main():
    """Runs cla check."""
    pr_author = [sys.argv[1]]
    python_utils.PRINT('Checking if ', pr_author, ' has signed the CLA')
    values = get_values()
    if not values:
        python_utils.PRINT('No data found.')
        cmd = (
            'gh pr comment ' + PR_NUMBER +
            ' --body "CLA_CHECK: No data found."')
        python_utils.PRINT(cmd)
        subprocess.Popen(cmd, stderr=subprocess.STDOUT, shell=True).wait()
        exit(1)
    if pr_author in values:
        python_utils.PRINT(pr_author, ' has signed the CLA')
        exit(0)
    else:
        python_utils.PRINT(pr_author, ' has not signed the CLA')
        comment = (
            'Hi! @' +
            pr_author[0] + ' Welcome to Oppia! Please could you ' +
            'follow the instructions ' + LINK_RESULT +
            ' to get started? You\'ll need' +
            ' to do this before we can accept your PR.')
        cmd = 'gh pr comment ' + PR_NUMBER + ' --body "' + comment + '"'
        python_utils.PRINT(cmd)
        subprocess.Popen(cmd, stderr=subprocess.STDOUT, shell=True).wait()
        exit(1)


if __name__ == '__main__':
    main()
