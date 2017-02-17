import re
import bs4

#get directive filename from user
file_name = raw_input('enter file name  ')

f = open(file_name, 'r')

#making regular expression to match all oppia classes
find_match = re.compile('.*oppia.*')

#making BeautifulSoup object of file then extracting the script tag and
# making BeautifulSoup object of text inside script tag
my_soup = bs4.BeautifulSoup(f.read(), 'html.parser').find('script')

inside_script_content = str(my_soup.contents)

soup_from_text_inside_script = bs4.BeautifulSoup(
   inside_script_content, 'html.parser')

#extracting list of all the classes per tag
all_classes = [
   tag.attrs.get('class') for tag in soup_from_text_inside_script.findAll()]

list_oppia_classes = []

#iterating through the list and output the result if there is a match
for i in all_classes:
    if i is None:
        continue
    else:
        for j in i:
            if find_match.match(j):
            list_oppia_classes.append(j)

for i in set(list_oppia_classes):
    print i





