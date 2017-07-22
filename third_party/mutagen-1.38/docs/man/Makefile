# update man pages

all: mid3cp.1 mid3iconv.1 mid3v2.1 moggsplit.1 mutagen-inspect.1 mutagen-pony.1

%.1:%.rst
	rst2man $< > ../../man/$@
