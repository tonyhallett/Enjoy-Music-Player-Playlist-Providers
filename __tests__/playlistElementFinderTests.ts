import "reflect-metadata";//need this even though not using the container
import { PlaylistElementFinder } from "../entities";

describe('PlaylistElementFinder',()=>{
    it('should find with the selector',()=>{
        var mockPlaylistElement={};
        var mockFoundElements=[mockPlaylistElement,{}];
        var mockQuerySelectorAll=jest.fn().mockReturnValue(mockFoundElements);
        document.querySelectorAll=mockQuerySelectorAll;
        
        var selector="selector";
        var playlistElementFinder=new PlaylistElementFinder(selector);
        var foundElement=playlistElementFinder.find();
        expect(mockQuerySelectorAll).toHaveBeenCalledWith(selector);
        expect(foundElement).toBe(mockPlaylistElement);
    })
})