import "reflect-metadata";//need this even though not using the container
import { MediaGalleryManager } from "../entities";
declare var global:any;
var mockMetadata={};

var mockMediaFileSystemMetadatas=[
    {
        name:"name1",
        galleryId:"galleryId1"
    },
    {
        name:"name2",
        galleryId:"galleryId2"
    },
]
var getMediaFileSystemMetadataCallCount=0;
var mockSelectedFileSystemName="Selected";
var matchedMediaFileSystem={name:mockSelectedFileSystemName};
var mockMediaFileSystems=[{name:"No match"},matchedMediaFileSystem];
var addUserSelectedFolderCancels=false;
var mockChrome={
    mediaGalleries:{
        getMetadata:jest.fn((file,options,callback)=>{
            callback(mockMetadata);
        }),
        getMediaFileSystems:jest.fn((options,callback)=>{
            callback(mockMediaFileSystems)
        }),
        //think mockReturnValueOnce is broken in this verison of jest
        getMediaFileSystemMetadata:jest.fn(()=>{
            return mockMediaFileSystemMetadatas[getMediaFileSystemMetadataCallCount++];
        }),
        addUserSelectedFolder:jest.fn(callback=>{
            if(addUserSelectedFolderCancels){
                callback(mockMediaFileSystems, undefined);
            }else{
                callback(mockMediaFileSystems, mockSelectedFileSystemName);
            }
        })
    }
}
global.chrome=mockChrome;
describe('MediaGalleryManager',()=>{
    beforeEach(()=>{
        getMediaFileSystemMetadataCallCount=0;
        jest.clearAllMocks();
    })
    describe('getMediaFileSystemMetadata',()=>{
        it('should pass through to the chrome api',()=>{
            var mediaGalleryManager=new MediaGalleryManager();
            var mockFileSystem={} as FileSystem;
            mediaGalleryManager.getMediaFileSystemMetadata(mockFileSystem);
            expect(mockChrome.mediaGalleries.getMediaFileSystemMetadata).toHaveBeenCalledWith(mockFileSystem);
        })
    })
    describe('getMetadataAsync',()=>{
        it('should promisfy the chrome api with metadataType: "mimeTypeAndTags"',async ()=>{
            var mediaGalleryManager=new MediaGalleryManager();
            var mockMediaFile={};
            var metadata=await mediaGalleryManager.getMetadataAsync(mockMediaFile as Blob);
            var getMetadataCall=mockChrome.mediaGalleries.getMetadata.mock.calls[0];
            expect(getMetadataCall[0]).toBe(mockMediaFile);
            expect(getMetadataCall[1]).toEqual({ metadataType: "mimeTypeAndTags" });
            expect(getMetadataCall[2]).toBeInstanceOf(Function);
            expect(metadata).toBe(mockMetadata);
        })
    })
    describe('getGalleriesAsync',()=>{
        it('should promisify getting gallery name and id, non interactive',async ()=>{
            var mediaGalleryManager=new MediaGalleryManager();
            var galleryDetails=await mediaGalleryManager.getGalleriesAsync();
            var getMediaFileSystemsCall=mockChrome.mediaGalleries.getMediaFileSystems.mock.calls[0];
            expect(getMediaFileSystemsCall[0]).toEqual({ interactive: "no" });
            var getMediaFileSystemMetadataCalls=mockChrome.mediaGalleries.getMediaFileSystemMetadata.mock.calls;
            expect(getMediaFileSystemMetadataCalls.length).toBe(2);
            expect(getMediaFileSystemMetadataCalls[0][0]).toBe(mockMediaFileSystems[0]);
            expect(getMediaFileSystemMetadataCalls[1][0]).toBe(mockMediaFileSystems[1]);
            [0,1].forEach(index=>{
                var galleryDetail=galleryDetails[index];
                var mockMetadata=mockMediaFileSystemMetadatas[index];
                expect(galleryDetail.path).toBe(mockMetadata.name);
                expect(galleryDetail.id).toBe(mockMetadata.galleryId);
            })
        });
    })
    describe('addUserSelectedFolderAsync',()=>{
        describe('when user selects',()=>{
            it('should return the selected fileSystem as a promise',async ()=>{
                var mediaGalleryManager=new MediaGalleryManager();
                var fileSystem=await mediaGalleryManager.addUserSelectedFolderAsync();
                expect(fileSystem).toBe(matchedMediaFileSystem);
            });
        })
        describe('when the user cancels', ()=>{
            it(' it should return null as a promise',async ()=>{
                addUserSelectedFolderCancels=true;
                var mediaGalleryManager=new MediaGalleryManager();
                var fileSystem=await mediaGalleryManager.addUserSelectedFolderAsync();
                expect(fileSystem).toBeNull();
            })
        })
    })
})