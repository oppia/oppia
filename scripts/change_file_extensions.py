# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Utility script to change file extensions."""

import os


def change_extension(path_list, current_extension, new_extension):
    """Method to change file extensions."""

    files = []

    for path_name in path_list:
        for (dirpath, _, filenames) in os.walk(path_name):
            for filename in filenames:
                files.append(os.path.join(dirpath, filename))

    for complete_file_name in files:
        filename, file_extension = os.path.splitext(complete_file_name)
        if file_extension == current_extension:
            os.rename(complete_file_name, filename + new_extension)


if __name__ == '__main__':
    change_extension(
        ['./core', './extensions'],
        '.js',
        '.ts'
    )
