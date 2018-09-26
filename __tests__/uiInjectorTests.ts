import "reflect-metadata";//need this even though not using the container
import { UIManager, MessageService, UIInjector } from "../entities";
import { IMessageService, UIInjectorTimeoutDetails, IPlaylistElementCreator, IPlaylistElementInjector } from "../interfaces";

describe('uiInjector',()=>{
    describe('domReady',()=>{
        [true,false].forEach(found=>{
            it('is ready when the playlistElement is found',()=>{
                var mockPlaylistElementFinder={
                    find:jest.fn(()=>{
                        if(found){
                            return {};
                        }
                        return null;
                    })
                }
                var uiInjector=new UIInjector(mockPlaylistElementFinder,null,null);
                var domReady=uiInjector.domReady();
                expect(domReady).toBe(found);
            });
        })
        
    })
    describe('inject',()=>{
        it('should delegate to the creator and injector',()=>{
            var mockPlaylistElement={};
            var mockPlaylistElementFinder={
                find:function(){return mockPlaylistElement;}
            }
            var mockNewPlaylistElements=[];
            var mockPlaylistElementCreator:IPlaylistElementCreator={
                create:jest.fn().mockReturnValue(mockNewPlaylistElements)
            }
            var mockPlaylistInjector:IPlaylistElementInjector={
                inject:jest.fn()
            }
            var mockPlaylistProviderDetails=[];
            var uiInjector=new UIInjector(mockPlaylistElementFinder as any,mockPlaylistElementCreator,mockPlaylistInjector);
            uiInjector.domReady();
            uiInjector.inject(mockPlaylistProviderDetails as any);
            expect(mockPlaylistElementCreator.create).toHaveBeenCalledWith(mockPlaylistElement,mockPlaylistProviderDetails);
            expect(mockPlaylistInjector.inject).toHaveBeenCalledWith(mockPlaylistElement,mockNewPlaylistElements);

        })
    })
})