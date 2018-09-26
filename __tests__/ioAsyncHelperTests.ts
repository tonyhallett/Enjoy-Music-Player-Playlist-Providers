import "reflect-metadata";//need this even though not using the container
import { IOAsyncHelper, } from "../entities";
import { expectAsyncErrorToBe } from "../testHelpers/asyncExpectations";

declare var global:any;

var fileReaderReadAsTextAsyncThrows=false;
var mockFileReaderReadAsTextAsyncError={};
var mockFileReaderReadAsTextText="Some text";


class MockFileReader{
    public result:string
    public error:DOMException;
    readAsText(file:Blob){
        if(fileReaderReadAsTextAsyncThrows){
            this.error=mockFileReaderReadAsTextAsyncError as any;
            this.onerror();
        }else{
            this.result=mockFileReaderReadAsTextText;
            this.onload();
        }
    }
    onload(){

    }
    onerror(){

    }
}

var mockChosenEntry={};
var mockChrome={
    fileSystem:{
        chooseEntry:jest.fn((options,callback)=>{
            callback(mockChosenEntry)
        })
    }
}
global.chrome=mockChrome;
global.FileReader=MockFileReader;
describe('IOAsyncHelper',()=>{
    beforeEach(()=>{
        fileReaderReadAsTextAsyncThrows=false;
        jest.clearAllMocks();
    })
    describe('chooseEntryAsync',()=>{
        it('promisifies the chrome method',async ()=>{
            var ioAsyncHelper=new IOAsyncHelper();
            var chooseEntryOptions={someOption:""};
            var chosenEntry=await ioAsyncHelper.chooseEntryAsync(chooseEntryOptions as chrome.fileSystem.ChooseEntryOptions);
            expect(mockChrome.fileSystem.chooseEntry.mock.calls[0][0]).toBe(chooseEntryOptions);
            expect(chosenEntry).toBe(mockChosenEntry);
        });
    })
    
    describe('reading directory entry',()=>{
        describe('directoryReaderReadEntriesAsync',()=>{
            [true,false].forEach(errors=>{
                it('should promisfy',async ()=>{
                    var ioAsyncHelper=new IOAsyncHelper();
                    var mockEntries=[];
                    var mockError={}
                    var mockDirectoryReader={
                        readEntries:jest.fn((cb,ecb)=>{
                            if(errors){
                                ecb(mockError);
                            }else{
                                cb(mockEntries);
                            }
                            
                        })
                    }
                    var entries;
                    var error;
                    try{
                        entries = await ioAsyncHelper.directoryReaderReadEntriesAsync(mockDirectoryReader);
                    }catch(e){
                        error=e;
                    }
                    if(errors){
                        expect(error).toBe(mockError);
                    }else{
                        expect(entries).toBe(mockEntries);
                    }
                    
                })
            });
        })
        describe('readDirectoryAsync',()=>{
            it('should create reader from the directory entry and return directoryReaderReadEntriesAsync',async ()=>{
                var ioAsyncHelper=new IOAsyncHelper();
                var mockEntries=[];
                var directoryReaderReadEntriesAsyncReturn=Promise.resolve(mockEntries);
                var spy=jest.spyOn(ioAsyncHelper,"directoryReaderReadEntriesAsync").mockImplementation(()=>{
                    return mockEntries;
                })
                
                var mockDirectoryReader={
                    readEntries:jest.fn((cb,ecb)=>{
                        cb(mockEntries);
                    })
                }
                var mockDirectoryEntry={
                    createReader:jest.fn().mockReturnValue(mockDirectoryReader)
                }
                var entries=await ioAsyncHelper.readDirectoryAsync(mockDirectoryEntry as any);
                expect(mockDirectoryEntry.createReader).toHaveBeenCalled();
                expect(spy).toHaveBeenCalledWith(mockDirectoryReader);
                expect(entries).toBe(mockEntries);

            })
        })
        describe('readDirectoryFilesAsync',()=>{
            [true,false].forEach(throws=>{
                it('should read the directory and filter files',async ()=>{
                    var ioAsyncHelper=new IOAsyncHelper();
                    var mockEntries=[
                        {
                            isFile:true
                        },
                        {
                            isFile:false
                        },
                        {
                            isFile:true
                        }
                    ]
                    var mockError={};
                    var mockReader={
                        readEntries:function(cb,ecb){
                            if(throws){
                                ecb(mockError);
                            }else{
                                cb(mockEntries)
                            }
                        }
                    }
                    var mockDirectoryEntry={
                        createReader:function(){return mockReader;}
                    }
                    var files;
                    var error;
                    try{
                        files=await ioAsyncHelper.readDirectoryFilesAsync(mockDirectoryEntry as any);
                    }catch(e){
                        error=e;
                    }
                    if(throws){
                        expect(error).toBe(mockError);
                    }else{
                        expect(files.length).toBe(2);
                        expect(files[0]).toBe(mockEntries[0]);
                        expect(files[1]).toBe(mockEntries[2]);
                    }
                });
            });
            
        })
    })
    describe('fileEntryFileAsync',()=>{
        [true,false].forEach(throws=>{
            it('promisifies',async ()=>{
                var mockFile={};
                var mockError={};
                var mockFileEntry={
                    file:jest.fn((cb,ecb)=>{
                        if(throws){
                            ecb(mockError);
                        }else{
                            cb(mockFile);
                        }
                    })
                }
                var ioAsyncHelper=new IOAsyncHelper();
                var file;
                var error;
                try{
                    file = await ioAsyncHelper.fileEntryFileAsync(mockFileEntry as any);
                }catch(e){
                    error=e;
                }
                if(throws){
                    expect(error).toBe(mockError);
                }else{
                    expect(file).toBe(mockFile);
                }
               
            });
        });
    })
    describe('file reading',()=>{
        describe('fileReaderReadAsTextAsync',()=>{
            describe('promisfies the FileReader.readAsText',()=>{
                it('rejects errors', async ()=>{
                    await expectAsyncErrorToBe(()=>{
                        fileReaderReadAsTextAsyncThrows=true;
                        var ioAsyncHelper=new IOAsyncHelper();
                        return ioAsyncHelper.fileReaderReadAsTextAsync({} as File);
                    },mockFileReaderReadAsTextAsyncError);
                });
                it('resolves text', async ()=>{
                    var ioAsyncHelper=new IOAsyncHelper();
                    var text=await ioAsyncHelper.fileReaderReadAsTextAsync({} as File);
                    expect(text).toBe(mockFileReaderReadAsTextText);
                });
            })
        });
        describe('fileEntryTextAsync',()=>{
            it('should read the the text from the file of the file entry',async ()=>{
                var ioAsyncHelper=new IOAsyncHelper();
                var mockFileEntry={};
                var mockFile={};
                var mockText="File text";
                var spiedFileEntryFileAsync=jest.spyOn(ioAsyncHelper,"fileEntryFileAsync").mockImplementation(()=>{
                    return Promise.resolve(mockFile);
                })
                var spiedFileReaderReadAsTextAsync=jest.spyOn(ioAsyncHelper,"fileReaderReadAsTextAsync").mockImplementation(()=>{
                    return Promise.resolve(mockText);
                })
                
                var text=await ioAsyncHelper.fileEntryTextAsync(mockFileEntry as any);
                expect(spiedFileEntryFileAsync.mock.calls[0][0]).toBe(mockFileEntry);
                expect(spiedFileReaderReadAsTextAsync.mock.calls[0][0]).toBe(mockFile);
                expect(text).toBe(mockText);
            })
        })
    })
})