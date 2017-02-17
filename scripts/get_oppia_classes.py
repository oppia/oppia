import re
import bs4

#get directive filename from user
FILE_NAME = raw_input('enter file name  ')

f = open(FILE_NAME, 'r')

#making regular expression to match all oppia classes
FIND_MATCH = re.compile('.*oppia.*')

#making BeautifulSoup object of file then extracting the script tag and
# making BeautifulSoup object of text inside script tag
MY_SOUP = bs4.BeautifulSoup(f.read(), 'html.parser').find('script')

INSIDE_SCRIPT_CONTENT = str(MY_SOUP.contents)

SOUP_FROM_TEXT_INSIDE_SCRIPT = bs4.BeautifulSoup(
    INSIDE_SCRIPT_CONTENT, 'html.parser')

#extracting list of all the classes per tag
ALL_CLASSES = [
    tag.attrs.get('class') for tag in SOUP_FROM_TEXT_INSIDE_SCRIPT.findAll()]

LIST_OPPIA_CLASSES = []

#iterating through the list and output the result if there is a match
for i in ALL_CLASSES:
    if i is None:
        continue
    else:
        for j in i:
            if FIND_MATCH.match(j):
                LIST_OPPIA_CLASSES.append(j)

for i in set(LIST_OPPIA_CLASSES):
    print i





