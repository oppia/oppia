import os
import re
import bs4


def return_all_files(dir_to_scan):
    """
    expects a directory name to search in
    returns all the files in the directory and subdirectories
    """
    val = []
    for root, subdir, files in os.walk(dir_to_scan):
        for f in files:
            val.append(os.path.join(root, f))

        for d in subdir:
            val.extend(return_all_files(d))
    return val


def return_matched_files(files, pattern):
    """
    expects a list of files
    returns all the files matching the pattern
    """
    val = []
    for f in files:
        if pattern.match(str(f)) is not None:
            val.append(f)
    return val


def file_find_matching_classes(file_name, pattern):
    """
    expects the file name and pattern of class to find
    returns all the classes that have same pattern as specified
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
                if cur_classes is None:
                    continue
                else:
                    for j in cur_classes:
                        if pattern.match(j):
                            list_oppia_classes.append(j)
        else:
            cur_classes = i.attrs.get('class')
            if cur_classes is None:
                continue
            else:
                for j in cur_classes:
                    if pattern.match(j):
                        list_oppia_classes.append(j)

    return set(list_oppia_classes)


def print_output(file_dict):
    """
    expects file dictionary with file as keys and classes as values
    outputs in proper format
    """
    for i in file_dict.keys():
        if len(file_dict[i]) == 0:
            continue
        print '$ ',
        print i
        for j in file_dict[i]:
            print j,
        print '\n\n'


def give_unique_classes(file_dict, file_store):
    """
    expects file dictionary with file as keys and classes as values
    return dict with file as keys and only those classes that are
    present uniquely in the file
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


DIRECTORY = raw_input('Enter path to directory  ')

# pattern for all html files
HTML_PATTERN = re.compile(r'.*\.html')

# pattern for matching directive html files
DIRECTIVE_PATTERN = re.compile(r'.*directive\.html')

# pattern for matching the classes
FIND_CLASS_PATTERN = re.compile(r'.*oppia.*')

ALL_FILES_IN_PATH = return_all_files(DIRECTORY)
HTML_FILES = return_matched_files(ALL_FILES_IN_PATH, HTML_PATTERN)
DIRECTIVE_FILES = return_matched_files(ALL_FILES_IN_PATH, DIRECTIVE_PATTERN)

LIST_ALL_FILE_CLASSES = {}
LIST_DIRECTIVE_FILE_CLASSES = {}

for fl in HTML_FILES:
    LIST_ALL_FILE_CLASSES[fl] = file_find_matching_classes(
        fl, FIND_CLASS_PATTERN)

for fl in DIRECTIVE_FILES:
    LIST_DIRECTIVE_FILE_CLASSES[fl] = file_find_matching_classes(
        fl, FIND_CLASS_PATTERN)

print_output(
    give_unique_classes(LIST_DIRECTIVE_FILE_CLASSES, LIST_ALL_FILE_CLASSES))


