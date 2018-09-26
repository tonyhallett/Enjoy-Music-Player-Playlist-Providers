import "reflect-metadata";//need this even though not using the container
import { WPLPlaylistProvider, } from "../entities";
import { WPLMedia } from "../interfaces";


describe('wpl playlist provider new playlist', () => {
    var cancel=false;

    var wplFileEntry={};
    var wplText = "Mocked playlist xml string";
    var mockIOAsyncHelper = {
        chooseEntryAsync:jest.fn(()=>{
            return Promise.resolve(cancel?null:wplFileEntry);
        }),
        fileEntryTextAsync:jest.fn().mockReturnValue(Promise.resolve(wplText)),
    }
    
    var nonMatchingGallery= { path:"C:\\Users\\tonyh\\Downloads",id:1};
    var matchingGallery1= { path: "C:\\Users\\tonyh\\Music",id:2};
    var matchingGallery1Sub= { path:"C:\\Users\\tonyh\\Music\\Breaks",id:3};
    var matchingGallery2= { path:"C:\\Users\\tonyh\\Documents\\PsyChill",id:4};
    var mockMediaGalleryManager = {
        getGalleriesAsync: jest.fn().mockReturnValue(
            Promise.resolve([
                nonMatchingGallery,
                matchingGallery1,
                matchingGallery1Sub,
                matchingGallery2,
            ])
        )
    }

    var matchingGallery1SeqPath="\\Breaks\\match1.mp3";
    var matchingGallery1Seq:WPLMedia={
        src:matchingGallery1.path + matchingGallery1SeqPath,
        albumArtist:"match1AlbumArtist",
        albumTitle:"match1AlbumTitle",
        trackArtist:"matchTrackArtist",
        trackTitle:"matchTrackTitle"
    }
    var notMatchingSeq={
        src:"C:\NoMatch\nomatch.mp3"
    }
    var matchingGallery2SeqPath="\\match2.mp3";
    var matchingGallery2Seq:WPLMedia={
        albumArtist:"match2AlbumArtist",
        albumTitle:"match2AlbumTitle",
        trackArtist:"match2TrackArtist",
        trackTitle:"match2TrackTitle",
        src:matchingGallery2.path+matchingGallery2SeqPath
        
    }
    var returnMatchingPlaylist=true;
    var mockMatchingPlaylist={
        title: "PsyTrance",
        seq: [notMatchingSeq,matchingGallery1Seq,notMatchingSeq,matchingGallery2Seq]
    }
    var mockNotMatchingPlaylist={
        title: "PsyTrance",
        seq: [notMatchingSeq]
    }
    var mockParser = {
        parsePlaylist:jest.fn(()=>{
            return returnMatchingPlaylist?mockMatchingPlaylist:mockNotMatchingPlaylist;
        })
    }
    var wplPlaylistProvider = new WPLPlaylistProvider(mockIOAsyncHelper as any, mockParser, mockMediaGalleryManager as any);
    beforeEach(() => {
        cancel=false;
        returnMatchingPlaylist=true;
        jest.clearAllMocks();
    })
    it('should ask the user to select a wpl file',async ()=>{
        var playlist = await wplPlaylistProvider.newPlaylist();
        var chooseWpl=mockIOAsyncHelper.chooseEntryAsync.mock.calls[0][0];
        expect(chooseWpl.type).toBe('openFile');
        expect(chooseWpl.acceptsAllTypes).toBe(false);
        expect(chooseWpl.accepts[0].extensions[0]).toBe('wpl');
    });
    describe('the user does not select a wpl file',()=>{
        it('should return null when user cancels choose entry', async () => {
            cancel = true;
            var playlist = await wplPlaylistProvider.newPlaylist();
            expect(playlist).toBeNull();
        });
    })
    describe('the user selects a wpl file',()=>{
        it('should pass the wpl text to the WplParser',async () => {
            await wplPlaylistProvider.newPlaylist();
            expect(mockIOAsyncHelper.fileEntryTextAsync).toHaveBeenCalledWith(wplFileEntry);
            expect(mockParser.parsePlaylist.mock.calls[0][0]).toBe(wplText);
        });
        describe('no playlist songs in galleries',()=>{
            it('should return null',async ()=>{
                returnMatchingPlaylist=false;
                var playlist = await wplPlaylistProvider.newPlaylist();
                expect(playlist).toBeNull();
            })
        })
        describe('playlist songs in galleries',()=>{
            it('should return a playlist excluding songs outside of media galleries, using the first matching gallery',async  () => {
                var playlist = await wplPlaylistProvider.newPlaylist();
                expect(mockMediaGalleryManager.getGalleriesAsync).toHaveBeenCalled();
                
                expect(playlist.name).toBe(mockMatchingPlaylist.title);
                expect(playlist.songs.length).toBe(2);

                var firstPlaylistSong = playlist.songs[0];
                expect(firstPlaylistSong.album).toBe(matchingGallery1Seq.albumTitle);
                expect(firstPlaylistSong.artist).toBe(matchingGallery1Seq.trackArtist);
                expect(firstPlaylistSong.title).toBe(matchingGallery1Seq.trackTitle);

                expect(firstPlaylistSong.galleryId).toBe(matchingGallery1.id);
                expect(firstPlaylistSong.path).toBe(matchingGallery1SeqPath);
                expect(firstPlaylistSong.id).toBe(matchingGallery1.id+matchingGallery1SeqPath);
                
                var secondPlaylistSong = playlist.songs[1];
                expect(secondPlaylistSong.album).toBe(matchingGallery2Seq.albumTitle);
                expect(secondPlaylistSong.artist).toBe(matchingGallery2Seq.trackArtist);
                expect(secondPlaylistSong.title).toBe(matchingGallery2Seq.trackTitle);

                expect(secondPlaylistSong.galleryId).toBe(matchingGallery2.id);
                expect(secondPlaylistSong.path).toBe(matchingGallery2SeqPath);
                expect(secondPlaylistSong.id).toBe(matchingGallery2.id + matchingGallery2SeqPath);
            });
        })
       
    })
});

