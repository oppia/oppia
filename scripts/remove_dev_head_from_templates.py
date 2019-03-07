# Copyright 2019 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

""" This scripts simplify the directery struture of templates."""

import os

TEMPLATES_PATH = os.getcwd() + '/core/templates/dev/head'


# For loop for finding all the html files in templates directory.
for path, subdirs, files in os.walk(TEMPLATES_PATH):
    for name in files:
        path_of_file = os.path.join(path, name)
        path_of_file = path_of_file.split('.')
        if path_of_file[1] == 'html':
            old_file = os.path.join(path, name)
            new_file = os.path.join(path, 'cleaned_' + name)

            delete_list = ['/dev', '/head']
            fin = open(old_file)
            fout = open(new_file, 'w+')

            for line in fin:
                for word in delete_list:
                    line = line.replace(word, '')
                fout.write(line)

            fin.close()
            fout.close()
            os.remove(old_file)


# For loop for renaming the copy file created above.
for path, subdirs, files in os.walk(TEMPLATES_PATH):
    for name in files:
        file_name = name.split('.')
        if file_name[1] == 'html':
            rename_file_name = file_name[0]
            rename_file_name = rename_file_name.split('_')
            rename_file_name = rename_file_name[1:]
            rename_file_name = '_'.join(map(str, rename_file_name)) + '.html'
            os.rename(os.path.join(path, name), (
                os.path.join(path, rename_file_name)))
