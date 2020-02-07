import os
a = None
with open("pngImages.txt","r") as f:
    line = f.readline().strip()
    while line:
        l = line.split("/")[-1]
        os.system("grep -r -n \"{}\"".format(l))
        print("\n\n\n\n")
        line = f.readline().strip()
