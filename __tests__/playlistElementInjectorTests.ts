import "reflect-metadata";//need this even though not using the container
import { PlaylistElementInjector } from "../entities";

describe('PlaylistElementInjector',()=>{
    it('should insert all new playlist elements after the original',()=>{
        var mockPlaylistParent=document.createElement("div");
        var mockPlaylistElement=document.createElement("div");
        mockPlaylistParent.appendChild(mockPlaylistElement);
        var someOtherChild=document.createElement("div");
        mockPlaylistParent.appendChild(someOtherChild);

        var mockNewPlaylistElement1=document.createElement("div");
        var mockNewPlaylistElement2=document.createElement("div");

        var playlistElementInjector=new PlaylistElementInjector();
        playlistElementInjector.inject(mockPlaylistElement as any,[mockNewPlaylistElement1,mockNewPlaylistElement2]);

        expect(mockPlaylistParent.children[1]).toBe(mockNewPlaylistElement1);
        expect(mockPlaylistParent.children[2]).toBe(mockNewPlaylistElement2);

        expect(mockPlaylistParent.children[3]).toBe(someOtherChild);
    })
})