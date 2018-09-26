import "reflect-metadata";//need this even though not using the container
import { WPLParser, } from "../entities";

var mockPlaylistTitle="Yeah!";
class MockSeq{
    constructor(src:string,albumArtist:string,albumTitle:string,trackArtist:string,trackTitle:string){

    }
    getAttribute(attName:string){
        return this[attName];
    }
}
var mockSeq1=new MockSeq("src1","albumArtist1","albumTitle1","trackArtist1","trackTitle1");
var mockSeq2=new MockSeq("src1","albumArtist1","albumTitle1","trackArtist1","trackTitle1");
var mockDocument={
    getElementsByTagName:function(tagName:string){
        if(tagName=="title"){
            return [{
                innerHTML:mockPlaylistTitle
            }]
        }else{
            return [
                mockSeq1,mockSeq2
            ]
        }
    }
}
var sourceArg:string;
var mimeTypeArg:string;
class MockDomParser implements DOMParser{
    parseFromString(source: string, mimeType: string): Document {
        sourceArg=source;
        mimeTypeArg=mimeType;
        return mockDocument as any;
    }
}

declare var global:any
global.DOMParser=MockDomParser;

describe('wpl parser', () => {
    it('should parse wpl text into a WPLPlaylist using the DOMParser', () => {
        var wplParser=new WPLParser();
        var mockSource="some wpl";
        var playlist=wplParser.parsePlaylist(mockSource);
        expect(sourceArg).toBe(mockSource);
        expect(mimeTypeArg).toBe("text/xml");
        expect(playlist.title).toBe(mockPlaylistTitle);
    })
});