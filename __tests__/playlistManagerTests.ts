///<reference types='jest'/>
import "reflect-metadata";//need this even though not using the container
import { PlaylistManager } from "../entities";
import { IUIManager, IPlaylistProvider, IPlaylistStore, IMessageService, Playlist,NewPlaylistMessageTitles } from "../interfaces";



describe('The PlaylistManager', () => {
    var playlistManager: PlaylistManager;
    var mockUIManager: IUIManager;
    var mockPlaylistProviders: Array<IPlaylistProvider>
    var mockPlaylistStore: IPlaylistStore;
    var storeThrows = false;
    var storeRejectionMessage="Store rejection";
    var mockMessageService: IMessageService;
    var mockNewPlaylistTitles:NewPlaylistMessageTitles={
        errorTitle:"New playlist error",
        successTitle:"New playlist success"
    }
    var playlist:Playlist = {
        name: "Mock playlist",
        songs:null
    }

    function callbackFromUI(providerIndex:0|1):Promise<any> {
        var mockFn = mockUIManager.addNewPlaylistProviders as jest.Mock<{}>;
        return mockFn.mock.calls[0][0][providerIndex].newPlaylist();
    }

    beforeEach(() => {
        
        mockMessageService = {
            show: jest.fn()
        }
        mockPlaylistStore = {
            savePlaylist: jest.fn(() => {
                if (storeThrows) {
                    return Promise.reject(storeRejectionMessage);
                } else {
                    return Promise.resolve();
                }
            })
        }
        
        mockUIManager = {
            addNewPlaylistProviders: jest.fn().mockReturnValue(Promise.resolve())
        }
        mockPlaylistProviders = [
            {
                newPlaylist: jest.fn().mockReturnValue(Promise.resolve(null)),
                description:"PP1"
            },
            {
                newPlaylist: jest.fn().mockReturnValue(Promise.resolve(null)),
                description: "PP2"
            }
        ]
        playlistManager = new PlaylistManager(mockUIManager, mockPlaylistProviders, mockPlaylistStore, mockMessageService,mockNewPlaylistTitles);
    })
    it('should for each playlist provider set the ui', async () => {
        await playlistManager.setUp();
        var mockFn = mockUIManager.addNewPlaylistProviders as jest.Mock<{}>;
        var providerDetails = mockFn.mock.calls[0][0];
        var providerDetails0 = providerDetails[0];
        var providerDetails1 = providerDetails[1];
        expect(providerDetails0.description).toBe("PP1");
        expect(providerDetails1.description).toBe("PP2");
        expect(providerDetails0.newPlaylist).toEqual(expect.any(Function));
        expect(providerDetails1.newPlaylist).toEqual(expect.any(Function));
    });
    describe('when called back from the ui', () => {
        [0,1].forEach((providerIndex:0|1)=>{
            it('should get the playlist from the provider in the callback', async () => {
                await playlistManager.setUp();
                await callbackFromUI(providerIndex);
                var provider = mockPlaylistProviders[providerIndex];
                var mockAddNewPlaylist = provider.newPlaylist as jest.Mock<Promise<Playlist>>;
                expect(mockAddNewPlaylist).toHaveBeenCalled();
            })
        });

        describe('and the playlist provider returns', () => {
            describe('null or undefined', () => {
                [null,undefined].forEach(pl=>{
                    it('should not save the playlist to the store and no message',async () => {
                        await playlistManager.setUp();
                        mockPlaylistProviders[0].newPlaylist= () => Promise.resolve(pl);
                        await playlistManager.setUp();
                        await callbackFromUI(0);

                        expect(mockPlaylistStore.savePlaylist).not.toHaveBeenCalled();
                        expect(mockMessageService.show).not.toHaveBeenCalled();
                    });
                });
            });
            describe('a playlist', () => {
                it('should save the playlist to the store ( and if not throws ) and show a success message', async () => {
                    storeThrows = false;
                    await playlistManager.setUp();
                    mockPlaylistProviders[1].newPlaylist= () => Promise.resolve(playlist);
                    await callbackFromUI(1);
                    expect(mockPlaylistStore.savePlaylist).toHaveBeenCalledWith(playlist);

                    var mockShow = mockMessageService.show as jest.Mock<{}>;
                    expect(mockShow).toHaveBeenCalledWith(true,mockNewPlaylistTitles.successTitle,playlist.name);
                });
            });
            
    })
        describe('and the PlaylistManager calls code that rejects',()=>{
            function errorMessageExpectation(errorMessage:string){
                var mockShow = mockMessageService.show as jest.Mock<{}>;
                expect(mockShow).toHaveBeenCalledWith(false,mockNewPlaylistTitles.errorTitle,errorMessage);
            }
            describe('IPlaylistProvider.newPlaylist rejects', () => {
                it('the store should not be called and an error message shown with the rejection',async () => {
                    var errorMessage='Newplaylist error';
                    mockPlaylistProviders[0].newPlaylist = () => {
                        return new Promise((resolve, reject) => {
                            reject(errorMessage);
                        });
                    };
                    await playlistManager.setUp();
                    await callbackFromUI(0);
                    
                    expect(mockPlaylistStore.savePlaylist).not.toHaveBeenCalled();

                    errorMessageExpectation(errorMessage);
                });
            });
            describe('IPlaylistStore.savePlaylist',()=>{
                it('should show error message with the rejection', async () => {
                    storeThrows = true;
                    mockPlaylistProviders[0].newPlaylist = () => {
                        return Promise.resolve(playlist);
                    };
                    await playlistManager.setUp();
                    await callbackFromUI(0);
                    
                    errorMessageExpectation(storeRejectionMessage);
                })
            })
        })
    })
})