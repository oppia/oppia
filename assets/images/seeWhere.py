import os

with open("pngImages.txt","r") as f:
    line = f.readline()
    while line:
        l = line.split("/")[-1]
        print("grep -r -n \"{}\"".format(l))
        input()
        line = f.readline()