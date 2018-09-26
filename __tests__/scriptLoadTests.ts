import { Types } from "../types"

var mockPlaylistManager={
    setUp:jest.fn()
}
jest.mock('../inversify.config',()=>{
    return {
        myContainer:{
            get:jest.fn().mockReturnValue(mockPlaylistManager)
        }
    }
})
import { myContainer } from "../inversify.config";


import '../playlistManager';

describe('when the root file executes',()=>{
    it('should get the playlist manager from the container and call setup',()=>{
        expect(myContainer.get).toHaveBeenCalledWith(Types.IPlaylistManager);
        expect(mockPlaylistManager.setUp).toHaveBeenCalled();
    })
})



