# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Rules for TarFileString."""

__author__ = 'Tarashish Mishra'

import os

from extensions.rules import base
import feconf
import utils


class ChecksWrapperDirName(base.TarFileStringRule):
    description = 'does not have a wrapper directory named {{x|UnicodeString}}'

    def _evaluate(self, subject):
        members = subject.getmembers()
        for member in members:
            if '/' not in member.name:
                return member.isdir() and member.name != self.x
        return True


class ChecksWrapperDirPresence(base.TarFileStringRule):
    description = 'does not have a wrapper directory.'

    def _evaluate(self, subject):
        members = subject.getmembers()
        for member in members:
            if '/' not in member.name:
                return not member.isdir()
        return True


class HasAppleDoubleFile(base.TarFileStringRule):
    description = 'Contains an Apple Double file.'

    def _evaluate(self, subject):
        members = subject.getmembers()
        for member in members:
            if '/._' in member.name:
                return True
        return False


class HasUnexpectedFile(base.TarFileStringRule):
    description = 'Contains a file not present in {{expected_files|List}}.'

    def _evaluate(self, subject):
        members = subject.getmembers()
        for member in members:
            if member.name not in self.expected_files:
                return True
        return False


class MissingExpectedFile(base.TarFileStringRule):
    description = 'Omits one or more files in {{expected_files|List}}.'

    def _evaluate(self, subject):
        members = subject.getmembers()
        member_list = []
        for member in members:
            if member.name in self.expected_files:
                member_list.append(member.name)
        return bool(
            set(self.expected_files) - set(member_list)
        )


class HasUnexpectedContent(base.TarFileStringRule):
    description = 'Contains file not present in {{file_list|List}}.'

    def _evaluate(self, subject):
        members = subject.getmembers()
        for member in members:
            if member.isfile():
                filename = member.name.split('/')[-1]
                if filename in self.file_list:
                    subj_contents = subject.extractfile(member).read()
                    expected_contents = utils.get_file_contents(
                        os.path.join(feconf.DATA_DIR, filename)
                    )
                    if subj_contents != expected_contents:
                        return True
        return False
