import "reflect-metadata";//need this even though not using the container
import { FolderPlaylistProvider, } from "../entities";

describe('The folder playlist provider new playlist', () => {
    var selectedMediaGalleryFileSystem = {
        root:{

        }
    };
    
    var musicFileEntry = { name: "AMusicFile.mp3" };
    var notAMusicFileEntry = { name: "NotAMusicFile.not" };
    
    var musicFile = {};
    var mockAsyncHelper= {
        fileEntryFileAsync: jest.fn(() => Promise.resolve(musicFile)),
        readDirectoryFilesAsync:jest.fn(()=> Promise.resolve([musicFileEntry, notAMusicFileEntry]))
    };
    
    var mockMetadata = {
        album: "Album title",
        artist: "Track artist",
        title: "Track title"
    }
    
    var folderName="PsyChill";
    var galleryId="3";
    var userSelected=true;
    var mockGalleryManager= {
        addUserSelectedFolderAsync:jest.fn(()=>{
            if(userSelected){
                return Promise.resolve(selectedMediaGalleryFileSystem);
            }
            return Promise.resolve(null);
            
        }),
        getMediaFileSystemMetadata: jest.fn().mockReturnValue(
            {
                name: "C:\\Users\\tonyh\\Music\\" + folderName,
                galleryId: galleryId
            }
        ),
            
        getMetadataAsync:jest.fn(() => {
            return Promise.resolve(mockMetadata);
        })
    }

    var folderPlaylistProvider=new FolderPlaylistProvider(mockAsyncHelper as any, mockGalleryManager as any, ["mp3"]);;

    beforeEach(() => {
        userSelected=true;
        jest.clearAllMocks();
    })
    it('should get the user selected folder from the gallery manager', async () => {
        var playlist = await folderPlaylistProvider.newPlaylist();
        
        expect(mockGalleryManager.addUserSelectedFolderAsync).toHaveBeenCalled();
    })
    describe('no folder is selected',()=>{
        it('should return a null playlist',async ()=>{
            userSelected=false;
            var playlist = await folderPlaylistProvider.newPlaylist();
            expect(playlist).toBeNull();
        })
    })
    describe('folder is selected',()=>{
        it('should get the playlist name and gallery id for the selected folder from the gallery manager file system metadata',async ()=>{
            var playlist = await folderPlaylistProvider.newPlaylist();
            expect(mockGalleryManager.getMediaFileSystemMetadata).toHaveBeenCalledWith(selectedMediaGalleryFileSystem);
            expect(playlist.name).toBe(folderName);
            playlist.songs.forEach(ps=>{
                expect(ps.galleryId).toBe(galleryId);
            })
        })
        it('should have playlist songs for each music file in the selected directory with metadata properties and path properties',async ()=>{
            var playlist = await folderPlaylistProvider.newPlaylist();
            expect(mockAsyncHelper.readDirectoryFilesAsync).toHaveBeenCalledWith(selectedMediaGalleryFileSystem.root);
    
            //only music files
            expect(mockAsyncHelper.fileEntryFileAsync).toHaveBeenCalledTimes(1);
            expect(mockAsyncHelper.fileEntryFileAsync).toHaveBeenCalledWith(musicFileEntry);
    
            expect(mockGalleryManager.getMetadataAsync).toHaveBeenCalledTimes(1);
            expect(mockGalleryManager.getMetadataAsync).toHaveBeenCalledWith(musicFile);
    
            expect(playlist.songs.length).toBe(1);
    
            var playlistSong = playlist.songs[0];
    
            expect(playlistSong.album).toBe(mockMetadata.album);
            expect(playlistSong.artist).toBe(mockMetadata.artist);
            expect(playlistSong.title).toBe(mockMetadata.title);
    
            var path="/" + musicFileEntry.name;
            expect(playlistSong.path).toBe(path);
            expect(playlistSong.id).toBe(galleryId + path);
            expect(playlistSong.track).toBe("");
    
        })
    })
    
})