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
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""get_oppia_classes.py
This script is used to get a dictionary with directive files as keys and
oppia classes(belonging to them uniquely) as values.
This can be used to shift all the classes which are used only in single
files from oppia.css to respective files
The scripts ask for the path to directory in which you want to run it.
The script will search among all the files that lie below that directory
in file structure i.e it will search in subdirs recursively also.

====================================
CUSTOMIZATION OPTIONS FOR DEVELOPERS
====================================
You can also use this script for similar use cases but different type of
files by changing the variables html_pattern, directive_pattern and class
_pattern respectively
"""

import os
import re
import bs4


def return_all_files(dir_to_scan):
    """
    returns all files that lie below that directory in file structure

    ARGS: directory name
    RETURNS: all files in the path
    """
    file_result = []
    subdirs = []
    for root, subdir, files in os.walk(dir_to_scan):
        for f in files:
            file_result.append(os.path.join(root, f))
        for d in subdir:
            subdirs.append(d)
    return file_result


def return_matched_files(files, pattern):
    """
    returns all the files matching given pattern

    ARGS: list of files to search from, pattern to search
    RETURNS: list of files matching pattern
    """
    val = []
    for f in files:
        if pattern.match(str(f)) is not None:
            val.append(f)
    return val


def match_classes_pattern(classes, pattern):
    """
    return the classes which match given pattern

    ARGS: list of classes to search from, pattern
    RETURNS: list of classes matching pattern
    """
    matched_classes = []
    if classes is None:
        return matched_classes
    else:
        for j in classes:
            if pattern.match(j):
                matched_classes.append(j)
    return matched_classes


def file_find_matching_classes(file_name, pattern):
    """
    returns all the classes matching the pattern in a file

    ARGS: file name, pattern to match
    RETURNS: list of classes matching pattern
    """
    f = open(file_name)
    # making BeautifulSoup object of file then extracting all classes
    # and if the tag is script we further make BeautifulSoup object to
    # take case of ng-template
    file_soup = bs4.BeautifulSoup(f.read(), 'html.parser')

    list_oppia_classes = []

    for i in file_soup.findAll():
        if i.name == 'script' and i.attrs.get('type') == 'text/ng-template':
            inside_script_content = str(i.contents)
            soup_from_text_inside_script = bs4.BeautifulSoup(
                inside_script_content, 'html.parser')
            for t in soup_from_text_inside_script.findAll():
                cur_classes = t.attrs.get('class')
                list_oppia_classes.extend(
                    match_classes_pattern(cur_classes, pattern))
        else:
            cur_classes = i.attrs.get('class')
            list_oppia_classes.extend(
                match_classes_pattern(cur_classes, pattern))

    return set(list_oppia_classes)


def print_output(file_dict):
    """
    prints the file-class dictionary on the screen
    ARGS: dictionary of file as keys and classes as values
    RETURNS: none
    """
    for i in file_dict.keys():
        if len(file_dict[i]) == 0:
            continue
        print '$ ',
        print i
        for j in file_dict[i]:
            print j,
        print '\n\n'


def give_classes_unique_per_file(file_dict, file_store):
    """
    takes out all the classes that contain reused classes and returns
    dictionary with files only with unique classes as values

    ARGS: dictionary from which files are to be removed, dictionary in
    which files are to be checked
    RETURNS: dictionary with files and unique classes
    """
    val = {}
    for i in file_dict.keys():
        val[i] = []
        for j in file_dict[i]:
            check_if_class_exist_in_some_other_file = 0
            for k in file_store.keys():
                if k == i:
                    continue
                for z in file_store[k]:
                    if z == j:
                        check_if_class_exist_in_some_other_file = 1

            if check_if_class_exist_in_some_other_file == 0:
                val[i].append(j)

    return val


def main():
    dir_to_scan = raw_input('Enter path to directory  ')

    # pattern for all html files
    html_pattern = re.compile(r'.*\.html')

    # pattern for matching directive html files
    directive_pattern = re.compile(r'.*directive\.html')

    # pattern for matching the classes
    class_pattern = re.compile(r'.*oppia.*')

    all_files = return_all_files(dir_to_scan)
    html_files = return_matched_files(all_files, html_pattern)
    directive_files = return_matched_files(
        all_files, directive_pattern)

    all_html_file_css_classes = {}
    directive_file_css_classes = {}

    for fl in html_files:
        all_html_file_css_classes[fl] = file_find_matching_classes(
            fl, class_pattern)

    for fl in directive_files:
        directive_file_css_classes[fl] = file_find_matching_classes(
            fl, class_pattern)

    print_output(
        give_classes_unique_per_file(
            directive_file_css_classes, all_html_file_css_classes))


if __name__ == '__main__':
    main()
