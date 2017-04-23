#!/usr/bin/env python
"""Script for creating release tarballs"""
import os
import sys
import glob
import shutil
import subprocess
import zipfile

exclude = [".svn", "*.pyc", "*~", "*.orig", "*.patch", "__basedir__/utils",
           "__basedir__/setup_base.py", "*.prof", "#*", "__basedir__/build",
           '__basedir__/tests', '*.out', '__basedir__/dist', 
           '__basedir__/html5lib.egg-info', '__basedir__/print-stats.py']

class Package(object):

    def __init__(self, inDir, outDir, version="0", status=4, installDir="~"):
        #List of files to remove on exit
        self.version = str(version)
        self.status = str(status)
        self.cleanupFiles = []
        self.inDir = os.path.abspath(inDir)
        self.outDir = os.path.abspath(outDir)
        self.exclude = self.getExcludeList()
        self.fileList = self.getFileList()
        self.installDir = installDir
        self.outFiles = []

    def runall(self):
        self.copyTestData()
        self.copy()
        self.makeInitFile()
        self.makeSetupFile()
        self.preprocess()
        #if self.test():
        self.makeZipFile()
        self.cleanup()
        

    def getExcludeList(self):
        rv = []
        for item in exclude:
            rv.append(item.replace("__basedir__", self.inDir))
        return rv

    def copyTestData(self):
        outDir = os.path.join(self.inDir, "tests/testdata")
        print 
        try:
            os.mkdir(outDir)
        except OSError:
            #the directory already exists
            if not os.path.exists(outDir):
                raise
            
        inBaseDir = os.path.abspath(os.path.join(self.inDir, "..", "testdata"))
        dirWalker = os.walk(inBaseDir)
        for (curDir, dirs, files) in dirWalker:
            outDir = os.path.join(self.inDir, "tests", "testdata", curDir[len(inBaseDir)+1:])
            for dir in dirs[:]:
                if self.excludeItem(curDir, dir):
                    dirs.remove(dir)
                else:
                    try:
                        os.mkdir(os.path.join(outDir, dir))
                    except OSError:
                        #the directory already exists    
                        pass
            for fn in files[:]:
                if not self.excludeItem(curDir, fn):
                    newFn = os.path.join(outDir, fn)
                    shutil.copy(os.path.join(curDir, fn), newFn)
                    self.cleanupFiles.append(newFn)
    def getFileList(self):
        """Get a list of files to copy"""
        fileList = []
        dirWalker = os.walk(self.inDir)
        for (inDir, dirs, files) in dirWalker:
            basePath = os.path.abspath(inDir)
            for dir in dirs[:]:
                if self.excludeItem(basePath, dir):
                    dirs.remove(dir)
                else:
                    fileList.append(os.path.join(basePath, dir))
            for fn in files[:]:
                if self.excludeItem(basePath, fn):
                    files.remove(fn)
                else:
                    fileList.append(os.path.join(basePath, fn))
        return fileList
    
    def excludeItem(self, baseName, filename):
        rv = False
        fn = os.path.join(baseName,filename)
        for item in self.exclude:
            for f in glob.glob(os.path.join(baseName, item)):
                if os.path.samefile(f, fn):
                    rv = True
                    break
                if rv:
                    break
        return rv

    def makeSetupFile(self):
        statusStrings = {"1":"1 - Planning",                 
                        "2":"2 - Pre-Alpha",
                        "3":"3 - Alpha",
                        "4":"4 - Beta",
                        "5":"5 - Production/Stable",
                        "6":"6 - Mature",
                        "7":"7 - Inactive"}
        inFile = open(os.path.join(self.outDir, "setup.py"))
        text = "".join(inFile.readlines())
        inFile.close()
        outFile = open(os.path.join(self.outDir, "setup.py"), "w")
        outFile.write(text%{"status":statusStrings[self.status],
                            "version":self.version})

    def makeInitFile(self):
        inFile = open(os.path.join(self.outDir, "src", "html5lib", "__init__.py"))
        text = "".join(inFile.readlines())
        outFile = open(os.path.join(self.outDir, "src", "html5lib", "__init__.py"), 
                       "w")
        outFile.write(text%{"version":self.version})

    def copy(self):
        if not os.path.exists(self.outDir):
            os.mkdir(self.outDir)
        for inPath in self.fileList:
            filename = inPath[len(self.inDir)+1:]
            outPath = os.path.join(self.outDir, filename)
            self.outFiles.append(outPath)
            if os.path.isdir(inPath):
                try:
                    os.mkdir(outPath)
                except OSError:
                    #File may already exist
                    pass
            else:
                shutil.copyfile(inPath, outPath)
    
    def preprocess(self):
        p = Preprocessor()
        newOutFiles = []
        for fn in self.outFiles:
            if os.path.isfile(fn):
                newOutFiles.append(p.process(fn, self.outDir))
        self.outFiles = newOutFiles
    
    def test(self):
        dir = os.path.abspath(os.curdir)
        os.chdir(self.outDir)
        install = subprocess.call(("python", os.path.join(self.outDir,
                                                                 "setup.py"),
                                   "install", "--home="+self.installDir))
        subprocess.call(("python", os.path.join(self.outDir, "setup.py"),
                         "clean"))
        test = subprocess.call(("python", os.path.join(self.outDir, "tests",
                                                           "runtests.py")))
        os.chdir(dir)
        return install==0 and test==0
    
    def makeZipFile(self):
        z = zipfile.ZipFile(os.path.join(self.outDir,
                                         "html5lib-%s.zip"%self.version), 'w',
                            zipfile.ZIP_DEFLATED)
        for f in self.outFiles:
            z.write(f, os.path.join("html5lib-%s"%self.version,
                                    f[len(self.outDir)+1:]))
        z.close()

    def cleanup(self):
        #Doesn't yet clean up everything
        for f in self.outFiles:
            os.remove(f)
    
class Preprocessor(object):
    def __init__(self):
        self.instructions = {"remove":self.remove,
                             "add":self.add,
                             "move":self.move}
    
    def process(self, fn, inDir):
        self.inDir = inDir
        self.outPath = fn
        f = open(fn)
        self.inData = f.readlines()
        self.outData = []
        while self.inData:
            line = self.inData.pop(0)
            instruction = self.getInstruction(line)
            if instruction is not None:
                self.instructions[instruction](line)
            else:
                self.outData.append(line)
        #Write to the output file
        f = open(self.outPath, 'w')
        for line in self.outData:
            f.write(line)
        if self.outPath != fn:
            os.remove(fn)
        return self.outPath

    def getInstruction(self, line):
        rv = None
        if line.startswith("#RELEASE"):
            for item in self.instructions.keys():
                if line[len("#RELEASE"):].strip().startswith(item):
                    rv = item
                    break
        return rv

    def remove(self, line):
        """Remove a section of the input data"""
        while self.inData:
            data = self.inData.pop(0)
            if data.startswith("#END RELEASE"):
                break

    def add(self, line):
         while self.inData:
            data = self.inData.pop(0)
            if data.startswith("#END RELEASE"):
                break
            else:
                self.outData.append(data.strip("#"))
    
    def move(self, line):
        self.outPath = os.path.abspath(os.path.join(self.inDir,
                                        line[line.find("move")+4:].strip(),
                                        self.outPath[len(self.inDir)+1:]))
        dirName = os.path.dirname(self.outPath)
        if not os.path.exists(dirName):
            dirsToCreate = []
            while not os.path.exists(dirName):
                dirsToCreate.append(dirName)
                dirName = os.path.dirname(dirName)
            
            for item in dirsToCreate[::-1]:
                os.mkdir(item)
