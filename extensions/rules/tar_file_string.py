# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

from extensions.rules import base


class ChecksWrapperDirName(base.TarFileStringRule):
    description = 'does not have a wrapper directory named {{x|UnicodeString}}'
    is_generic = True

    def _evaluate(self, subject):
        members = subject.getmembers()
        for member in members:
            if '/' not in member.name:
                return member.isdir() and member.name != self.x
        return True


class ChecksWrapperDirPresence(base.TarFileStringRule):
    description = 'does not have a wrapper directory.'
    is_generic = True

    def _evaluate(self, subject):
        members = subject.getmembers()
        for member in members:
            if '/' not in member.name:
                return not member.isdir()
        return True


class HasAppleDoubleFile(base.TarFileStringRule):
    description = 'contains an Apple Double file.'
    is_generic = True

    def _evaluate(self, subject):
        members = subject.getmembers()
        for member in members:
            if '/._' in member.name:
                return True
        return False


class HasUnexpectedFile(base.TarFileStringRule):
    description = (
        'contains a top-level file not present in '
        '{{expected_files|SetOfUnicodeString}}.'
    )
    is_generic = True

    def _evaluate(self, subject):
        members = subject.getmembers()
        for member in members:
            if member.name not in self.expected_files:
                return True
        return False


class MissingExpectedFile(base.TarFileStringRule):
    description = (
        'omits one or more files in {{expected_files|SetOfUnicodeString}}.')
    is_generic = True

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
    description = (
        'contains file not present in {{file_list|SetOfUnicodeString}}.')
    is_generic = True

    def _evaluate(self, subject):
        members = subject.getmembers()
        for member in members:
            if member.isfile():
                filename = member.name.split('/')[-1]
                if filename in self.file_list:
                    subj_contents = subject.extractfile(member).read()
                    expected_contents = self.fs.get(filename).decode('utf-8')
                    if subj_contents != expected_contents:
                        return True
        return False
