import os
import re
import bs4


def return_all_files(dir):
    """
    expects a directory name to search in
    returns all the files in the directory and subdirectories
    """
    val = []
    for root, subdir, files in os.walk(dir):
        for f in files:
            val.append(os.path.join(root, f))

        for d in subdir:
            val.append(return_all_files(d))

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

    # making BeautifulSoup object of file then extracting the script tag and
    # making BeautifulSoup object of text inside script tag
    my_soup = bs4.BeautifulSoup(f.read(), 'html.parser').find('script')

    inside_script_content = str(my_soup.contents)

    soup_from_text_inside_script = bs4.BeautifulSoup(
        inside_script_content, 'html.parser')

    # extracting list of all the classes per tag
    all_classes = [
        t.attrs.get('class') for t in soup_from_text_inside_script.findAll()]

    list_oppia_classes = []

    #iterating through the list and output the result if there is a match
    for i in all_classes:
        if i is None:
            continue
        else:
            for j in i:
                if pattern.match(j):
                    list_oppia_classes.append(j)

    return set(list_oppia_classes)


def print_output(file_dict):
    """
    expects file dictionary with file as keys and classes as values
    outputs in proper format
    """
    for i in file_dict.keys() :
        if len(file_dict[i]) == 0:
            continue
        print '$ ',
        print i
        for j in file_dict[i]:
            print j,
        print '\n\n'


def give_unique_classes(file_dict):
    """
    expects file dictionary with file as keys and classes as values
    return dict with file as keys and only those classes that are present uniquely in the file
    """
    val = {}
    for i in file_dict.keys():
        val[i] = []
        for j in file_dict[i]:
            check_if_class_exist_in_some_other_file = 0
            for k in file_dict.keys() :
                if k == i:
                    continue
                for z in file_dict[k]:
                    if z == j:
                        check_if_class_exist_in_some_other_file = 1
            if check_if_class_exist_in_some_other_file == 0:
                val[i].append(j)

    return val


DIRECTORY = raw_input('Enter path to directory  ')

#pattern for matching directive html files
FILE_PATTERN = re.compile('.*directive\.html')

#pattern for matching the classes
FIND_PATTERN = re.compile('.*oppia.*')

ALL_FILES_IN_PATH = return_all_files(DIRECTORY)

DIRECTIVE_FILES = return_matched_files(ALL_FILES_IN_PATH, FILE_PATTERN)

LIST_FILE_CLASSES = {}

for file in DIRECTIVE_FILES:
    LIST_FILE_CLASSES[file] = file_find_matching_classes(file, FIND_PATTERN)

# print_output(LIST_FILE_CLASSES)

print_output(give_unique_classes(LIST_FILE_CLASSES))

