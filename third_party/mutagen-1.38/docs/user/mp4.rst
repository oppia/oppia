===
MP4
===

There is no MPEG-4 iTunes metadata standard. Mutagen's features are
known to lead to problems in other implementations. For example, FAAD
will crash when reading a file with multiple "tmpo" atoms. iTunes
itself is our main compatibility target.


Compatibility / Bugs
^^^^^^^^^^^^^^^^^^^^

* Prior to 1.16, the MP4 cover atom used a .format attribute to indicate
  the image format (JPEG/PNG). Python 2.6 added a str.format method which
  conflicts with this. 1.17 provides .imageformat when running on any version,
  and still provides .format when running on a version before 2.6.
