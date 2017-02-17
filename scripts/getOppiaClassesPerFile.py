import bs4
import re

#get directive filename from user
fname = raw_input('enter file name  ')

f = open(fname, 'r')

#making regular expression to match all oppia classes
findMatch = re.compile('.*oppia.*')

#making BeautifulSoup object of file then extracting the script tag and 
# making BeautifulSoup object of text inside script tag
mySoup = bs4.BeautifulSoup(f.read(), 'html.parser').find('script')

insideScriptContent = str(mySoup.contents)

soupFromTextInsideScript = bs4.BeautifulSoup(insideScriptContent, 'html.parser')

#extracting list of all the classes per tag
all_classes = [tag.attrs.get('class') for tag in soupFromTextInsideScript.findAll()]

listOppiaClasses = []

#iterating through the list and output the result if there is a match
for i in all_classes :
	if i == None :
		continue
	else:
		for j in i :
			if findMatch.match(j):
				listOppiaClasses.append(j)

for i in set(listOppiaClasses):
	print i





