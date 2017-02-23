import os
import re
import bs4
import resource, sys
resource.setrlimit(resource.RLIMIT_STACK, (2**29,-1))
sys.setrecursionlimit(10**6)


NUM_CALLS = 0


def return_all_files(dir_to_scan):
    """
    expects a directory name to search in
    returns all the files in the directory and subdirectories
    """
    global NUM_CALLS
    val = []
    for root, subdir, files in os.walk(dir_to_scan):
        for f in files:
            val.append(os.path.join(root, f))
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


def match_classes_pattern(classes, pattern):
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
                list_oppia_classes.extend(
                    match_classes_pattern(cur_classes, pattern))
        else:
            cur_classes = i.attrs.get('class')
            list_oppia_classes.extend(
                match_classes_pattern(cur_classes, pattern))

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


def give_classes_unique_per_file(file_dict, file_store):
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


def main():
    global NUM_CALLS
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

    print str(NUM_CALLS) + " $ "

    print_output(
        give_classes_unique_per_file(
            directive_file_css_classes, all_html_file_css_classes))


if __name__ == '__main__':
    main()
