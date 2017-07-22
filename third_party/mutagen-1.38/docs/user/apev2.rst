=====
APEv2
=====

Python 2.5 forced an API change in the APEv2 reading code. Some things
which were case-insensitive are now case-sensitive. For example,
given::

    tag = APEv2()
    tag["Foo"] = "Bar"
    print "foo" in tag.keys()

Mutagen 1.7.1 and earlier would print "True", as the keys were a str
subclass that compared case-insensitively. However, Mutagen 1.8 and
above print "False", as the keys are normal strings.

::

    print "foo" in tag

Still prints "True", however, as __getitem__, __delitem__, and
__setitem__ (and so any operations on the dict itself) remain
case-insensitive.

As of 1.10.1, Mutagen no longer allows non-ASCII keys in APEv2
tags. This is in accordance with the APEv2 standard. A KeyError is
raised if you try.


Compatibility / Bugs
^^^^^^^^^^^^^^^^^^^^

* Prior to 1.10.1, Mutagen wrote an incorrect flag for APEv2 tags that
  claimed they did not have footers. This has been fixed, however it means
  that all APEv2 tags written before 1.10.1 are corrupt.
