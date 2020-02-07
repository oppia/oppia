import os
os.system("find . -name '*.png' > pngImages.txt")
with open("pngImages.txt", "r") as f:
    line = f.readline().strip()
    while line:
        line2 = line.replace(".png",".webp")
        os.system("cwebp {} -o {}".format(line,line2))
        line = f.readline().strip()
