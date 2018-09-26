import "reflect-metadata";//need this even though not using the container
import { PlaylistElementCreator } from "../entities";
import { UINewPlaylist } from "../interfaces";

describe('PlaylistElementCreator',()=>{
    it('should deep clone the playlist element for each new playlist provider, changing a couple of properties',()=>{
        var clones=[];
        var mockPlaylistElement={
            cloneNode:jest.fn(()=>{
                var clone={
                    children:[{},{innerText:""}]
                };
                clones.push(clone);
                return clone;
            })
        }
        
        var uiNewPlaylists:Array<UINewPlaylist>=[
            {description:"description1",newPlaylist:function(){}},
            {description:"description1",newPlaylist:function(){}},
        ]
        var playlistElementCreator=new PlaylistElementCreator();
        var newPlaylistElements=playlistElementCreator.create(mockPlaylistElement as any,uiNewPlaylists) as any;
        
        expect(mockPlaylistElement.cloneNode.mock.calls[0][0]).toBe(true);
        expect(mockPlaylistElement.cloneNode.mock.calls[1][0]).toBe(true);

        expect(newPlaylistElements.length).toBe(2);
        for(var i=0;i<uiNewPlaylists.length;i++){
            expect(newPlaylistElements[i]).toBe(clones[i]);
            expect(newPlaylistElements[i].title).toBe(uiNewPlaylists[i].description);
            expect(newPlaylistElements[i].onclick).toBe(uiNewPlaylists[i].newPlaylist);
            expect(newPlaylistElements[i].children[1].innerText).toBe(uiNewPlaylists[i].description);
        }
        
        

    })
})