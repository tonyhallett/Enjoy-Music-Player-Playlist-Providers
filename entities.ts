///<reference path='./node_modules/@types/chrome/chrome-app.d.ts'/>
import { injectable, inject, multiInject } from "inversify";
import { Types } from "./types";
import { IPlaylistManager, IUIManager,UIInjectorTimeoutDetails, IPlaylistProvider, IMessageService, IPlaylistStore, Playlist, PlaylistSong, MessageOptions, IIOAsyncHelper, IWPLParser, WPLPlaylist, WPLMedia, IMediaGalleryManager, GalleryDetail, MessageIcons, UINewPlaylist, IUIInjector, IPlaylistElementFinder, IPlaylistElementCreator, IPlaylistElementInjector, NewPlaylistMessageTitles } from "./interfaces";


@injectable()
export class IndexedDbStore implements IPlaylistStore {
    openAsync(dbName: string): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            var openRequest = indexedDB.open(dbName);
            //typescript is typing result as any and this is coming from the IDBRequest
            //IDBOpenDBRequest extends IDBRequest 
            //this should change - also think it is possible to type on IDBRequest as well
            openRequest.onsuccess = (evt) => { resolve(openRequest.result) };
            openRequest.onerror = (evt) => {
                reject(openRequest.error)
            };
            
        });
    }
    //the type defintion for transaction mode is any - should be "readonly" | "readwrite"
    transactionAsync(database: IDBDatabase, storeNames: string[] | string, mode: "readonly" | "readwrite", transactionInitFunc: (transaction: IDBTransaction)=>void) :Promise<boolean>{
        return new Promise((resolve, reject) => {
            var transaction = database.transaction(storeNames, mode);
            transactionInitFunc(transaction);

            transaction.oncomplete = function (completeEvent) {
                resolve(true);
            }
            transaction.onerror = function (evt) {
                reject(transaction.error);
            }
            transaction.onabort = function () {
                resolve(false);
            }
        });
    }

    async savePlaylist(playlist: Playlist): Promise<void> {
        var database = await this.openAsync("EMP");
        
        await this.transactionAsync(database, "playlists", "readwrite", (transaction) => {
            var playlistsStore = transaction.objectStore("playlists");
            playlistsStore.add(playlist);
        });
        return;
    }
}

@injectable()
export class MessageService implements IMessageService{
    private timeout: number;
    private successImgUrl:string;
    private errorImgUrl:string;

    constructor( @inject(Types.MessageOptions) messageOptions: MessageOptions,@inject(Types.MessageIcons)  messageIcons:MessageIcons) {
        this.timeout = messageOptions.timeout;
        this.successImgUrl=chrome.runtime.getURL(messageIcons.successPath);
        this.errorImgUrl=chrome.runtime.getURL(messageIcons.errorPath);
    }
    private getBodyText(body:any){
        var bodyText="";
        if(body){
            if(typeof body=='string'){
                bodyText=body;
            }else{
                if(body.message){
                    bodyText=body.message;
                }
            }
        }
        return bodyText;
    }
    show(success: boolean, titleText: string, body: any) {
        
        var iconUrl=success?this.successImgUrl:this.errorImgUrl;
        var selfClosingNotification = new Notification(titleText, { body: this.getBodyText(body), icon:iconUrl });
        return new Promise<void>((resolve, reject) => {
            setTimeout(()=>{
                selfClosingNotification.close.bind(selfClosingNotification)();
                resolve();
            }, this.timeout);
        });
        
    }
}

@injectable()
export class IOAsyncHelper implements IIOAsyncHelper {
    async readDirectoryFilesAsync(directoryEntry: DirectoryEntry): Promise<FileEntry[]> {
        var entries = await this.readDirectoryAsync(directoryEntry);
        return entries.filter(e => e.isFile) as FileEntry[]
    }
    readDirectoryAsync(directoryEntry: DirectoryEntry): Promise<Entry[]> {
        var directoryReader = directoryEntry.createReader();
        return this.directoryReaderReadEntriesAsync(directoryReader);
    }
    directoryReaderReadEntriesAsync(directoryReader:DirectoryReader){
        return new Promise<Entry[]>((resolve, reject) => {
            directoryReader.readEntries((entries) => {
                resolve(entries);
            }, err => {
                reject(err);
            })
        })
    }

    chooseEntryAsync(options: chrome.fileSystem.ChooseEntryOptions){
        return new Promise<Entry|FileEntry[]>((resolve, reject) => {
            chrome.fileSystem.chooseEntry(options, (entryOrEntries: Entry|FileEntry[]) => {
                return resolve(entryOrEntries);
            })
        });
    }

    
    fileEntryFileAsync(fileEntry:FileEntry ): Promise<File> {
        return new Promise((resolve, reject) => {
            fileEntry.file((file) => {
                resolve(file);
            },(fileError)=>{
                reject(fileError);
            });
        });
    }
    fileReaderReadAsTextAsync(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.onload = function () {
                resolve(reader.result as string);
            };
            reader.onerror = function (e) {
                reject(reader.error);
            }
            reader.readAsText(file);
        });
    }
    fileEntryTextAsync(fileEntry:FileEntry):Promise<string>{
        return this.fileEntryFileAsync(fileEntry).then(file=>this.fileReaderReadAsTextAsync(file));
    }

}
@injectable()
export class MediaGalleryManager implements IMediaGalleryManager {
    addUserSelectedFolderAsync(): Promise<FileSystem|null> {
        return new Promise<FileSystem|null>((resolve, reject) => {
            chrome.mediaGalleries.addUserSelectedFolder((mediaFileSystems, selectedFileSystemName) => {
                var selectedMfs: FileSystem|null=null;
                if (selectedFileSystemName && selectedFileSystemName !== "") {
                    
                    for (var i = 0; i < mediaFileSystems.length; i++) {
                        var mfs = mediaFileSystems[i];
                        if (mfs.name === selectedFileSystemName) {
                            selectedMfs = mfs;
                            break;
                        }
                    }
                    
                }
                resolve( selectedMfs);
            });
        });
    }
    getMediaFileSystemMetadata(fileSystem: FileSystem): chrome.mediaGalleries.MediaFileSystemMetadata {
        return chrome.mediaGalleries.getMediaFileSystemMetadata(fileSystem);
    }
    getMetadataAsync(mediaFile: Blob): Promise<chrome.mediaGalleries.Metadata> {
        return new Promise((resolve, reject) => {
            chrome.mediaGalleries.getMetadata(mediaFile, { metadataType: "mimeTypeAndTags" },(metadata) => {
                resolve(metadata);
            })
        });
        
    }
    getGalleriesAsync(): Promise<GalleryDetail[]> {
        return new Promise<GalleryDetail[]>((resolve, reject) => {
            chrome.mediaGalleries.getMediaFileSystems({ interactive: "no" }, (mediaFileSystems) => {
                resolve(mediaFileSystems.map(mfs => {
                    var mfsMetadata = chrome.mediaGalleries.getMediaFileSystemMetadata(mfs);
                    var path = mfsMetadata.name;
                    return { path: path, id: mfsMetadata.galleryId }
                }));
            });
        });
    }
}
@injectable()
export class WPLParser implements IWPLParser {
    parsePlaylist(playlistString: string): WPLPlaylist {
        var parser = new DOMParser();
        var dom: XMLDocument = parser.parseFromString(playlistString, "text/xml");
        
        var titleElements = dom.getElementsByTagName("title")
        var titleElement = titleElements[0];
        var title = titleElement.innerHTML;

        var mediaElements = dom.getElementsByTagName("media");
        var seq: WPLMedia[] = [];
        var wplPlaylist: WPLPlaylist = { title: title, seq: seq }
        for (var i = 0; i < mediaElements.length; i++){
            var mediaElement = mediaElements[i];
            var src = mediaElement.getAttribute("src");
            seq.push({
                albumArtist:mediaElement.getAttribute("albumArtist"),
                albumTitle: mediaElement.getAttribute("albumTitle"),
                src: src,
                trackArtist: mediaElement.getAttribute("trackArtist"),
                trackTitle: mediaElement.getAttribute("trackTitle"),    
            });
        }
        return wplPlaylist;
    }
}
@injectable()
export class WPLPlaylistProvider implements IPlaylistProvider {
    description: string;
    constructor( @inject(Types.IIOAsyncHelper) private ioAsyncHelper: IIOAsyncHelper, @inject(Types.IWPLParser) private wplParser: IWPLParser, @inject(Types.IMediaGalleryManager) private galleryManager: IMediaGalleryManager) {
        this.description = "New playlist from WPL";
    }
    private async getWplPlaylist(){
        var wplFileEntry=await this.ioAsyncHelper.chooseEntryAsync({ type: 'openFile', acceptsAllTypes: false, accepts: [{ extensions: ['wpl'] }] })
        if (wplFileEntry) {
            var wplText = await this.ioAsyncHelper.fileEntryTextAsync(wplFileEntry as FileEntry);
            return this.wplParser.parsePlaylist(wplText);
        }
    }
    public async newPlaylist() {
        var playlist: Playlist = null;
        var wplPlaylist=await this.getWplPlaylist();
        if (wplPlaylist) {
            var galleryDetails = await this.galleryManager.getGalleriesAsync();
            var playlistSongs: Array<PlaylistSong>=[];
            var playlistTracks=wplPlaylist.seq;
            for(var i=0;i<playlistTracks.length;i++){
                var playlistTrack=playlistTracks[i];
                var trackPath=playlistTrack.src;
                var matchingGallery = galleryDetails.find(galleryDetail => trackPath.startsWith(galleryDetail.path));
                if (matchingGallery) {
                    var path = trackPath.substring(matchingGallery.path.length);
                    playlistSongs.push({ album: playlistTrack.albumTitle, artist: playlistTrack.trackArtist, title: playlistTrack.trackTitle, galleryId: matchingGallery.id, path: path, track: "", id: matchingGallery.id + path });
                }
            }
            if (playlistSongs.length > 0) {
                playlist = { name: wplPlaylist.title, songs: playlistSongs };
            }
        }
        return playlist;
    }
}
@injectable()
export class FolderPlaylistProvider implements IPlaylistProvider {
    constructor( @inject(Types.IIOAsyncHelper) private ioAsyncHelper: IOAsyncHelper, @inject(Types.IMediaGalleryManager) private galleryManager: IMediaGalleryManager, @inject(Types.musicFileExtensions) private musicFileExtensions: Array<string>) {
        this.description = "New playlist from folder";
    }
    getPlaylistNameAndGalleryId(fileSystem:FileSystem) {
        var galleryMetadata = this.galleryManager.getMediaFileSystemMetadata(fileSystem);
        
        var galleryId = galleryMetadata.galleryId;
        
        var galleryFullPath = galleryMetadata.name;
        var parts = galleryFullPath.split("\\");
        var playlistName = parts[parts.length - 1]
        return {
            playlistName: playlistName,
            galleryId: galleryId
        }
    }
    async getMetadataFileNames(musicFileEntries:FileEntry[]){
        var getMetadataPromises = musicFileEntries.map(fe => {
            return this.ioAsyncHelper.fileEntryFileAsync(fe).then(async f => {
                var metadata = await this.galleryManager.getMetadataAsync(f);
                return { metadata: metadata, fileName: fe.name }
            })
        });           
        return Promise.all(getMetadataPromises);
    }
    async getMusicFileEntries(directory:DirectoryEntry){
        var fileEntries= await this.ioAsyncHelper.readDirectoryFilesAsync(directory)
        return fileEntries.filter(fe => {
            var name = fe.name;
            var extensionIndex = name.lastIndexOf(".");
            var extension = name.substring(extensionIndex + 1);
            return this.musicFileExtensions.includes(extension);
        });
    }
    async newPlaylist(): Promise<Playlist> {
        var playlist: Playlist=null;
        var fileSystem = await this.galleryManager.addUserSelectedFolderAsync();
        if (fileSystem) {
            var playlistNameAndId = this.getPlaylistNameAndGalleryId(fileSystem);
            var directory=fileSystem.root;

            var musicFileEntries = await this.getMusicFileEntries(directory);          
            var musicMetadataNames = await this.getMetadataFileNames(musicFileEntries);
            
            var galleryId = playlistNameAndId.galleryId;
            var playlistSongs = musicMetadataNames.map((musicMetadataName) => {
                var mm = musicMetadataName.metadata;
                
                var path = "/" + musicMetadataName.fileName;;
                return { album: mm.album, artist: mm.artist, title: mm.title, 
                    galleryId: galleryId, track: "", id: galleryId + path, path: path }
            });
            
            playlist = { name: playlistNameAndId.playlistName, songs: playlistSongs }
            
        }
        return playlist;
    }
    description: string;
}
@injectable()
export class PlaylistElementFinder implements IPlaylistElementFinder{
    constructor( @inject(Types.PlaylistElementSelector) private selector:string){}
    find(): HTMLElement {
        return document.querySelectorAll(this.selector)[0] as HTMLElement;
    }
}
@injectable()
export class PlaylistElementCreator implements IPlaylistElementCreator{
    create(playlistElement: HTMLElement, uiNewPlaylists: UINewPlaylist[]): HTMLElement[] {
        return uiNewPlaylists.map(ppd => {
            var newPlaylistLi = playlistElement.cloneNode(true) as HTMLLIElement;
            newPlaylistLi.onclick = ppd.newPlaylist;
            newPlaylistLi.title = ppd.description;
            (newPlaylistLi.children[1] as HTMLSpanElement).innerText = ppd.description;
            return newPlaylistLi;
        });
    }
}
@injectable()
export class PlaylistElementInjector implements IPlaylistElementInjector{
    inject(playlistElement:HTMLElement,newPlaylistElements:Array<HTMLElement>):void{
        var afterNode = playlistElement;
        newPlaylistElements.forEach(npli => {
            this._insertAfter(npli, afterNode);
            afterNode = npli;
        });
    }
    _insertAfter(newNode: Node, referenceNode: Node) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }
}
@injectable()
export class UIInjector implements IUIInjector{
    private playlistElement:HTMLElement;
    constructor(@inject(Types.IPlaylistElementFinder) private playlistElementFinder:IPlaylistElementFinder,@inject(Types.IPlaylistElementCreator) private playlistElementCreator:IPlaylistElementCreator,@inject(Types.IPlaylistElementInjector) private playlistElementInjector:IPlaylistElementInjector){}
    domReady(): boolean {
        this.playlistElement=this.playlistElementFinder.find();
        return !!this.playlistElement;
    }    
    inject(playlistProviderDetails: UINewPlaylist[]) {
        this.playlistElementInjector.inject(this.playlistElement,this.playlistElementCreator.create(this.playlistElement,playlistProviderDetails));
    }
}
@injectable()
export class UIManager implements IUIManager {
    private startMs:number
    private ellapsed:number
    constructor( @inject(Types.IUIInjector) private uiInjector: IUIInjector,@inject(Types.IMessageService) private messageService: IMessageService, @inject(Types.UIInjectorInterval) private interval:number, @inject(Types.UIInjectorTimeoutDetails) private timeoutDetails:UIInjectorTimeoutDetails, @inject(Types.UIUnexpectedErrorMessage) private unexpectedErrorMessage:string){
        
    }
    private setElapsed(){
        this.ellapsed=new Date().getTime()-this.startMs;
    }
    addNewPlaylistProviders(playlistProviderDetails: Array<UINewPlaylist>) {
        this.startMs=new Date().getTime();
        return new Promise<void>((resolve, reject) => {
            var interval=setInterval(() => {
                try{
                    if(this.uiInjector.domReady()){
                        this.uiInjector.inject(playlistProviderDetails);
                        clearInterval(interval);
                        resolve();
                    }else{
                        this.setElapsed();
                        if(this.ellapsed>this.timeoutDetails.timeout){
                            this.messageService.show(false,this.timeoutDetails.timoutMessageTitle,this.timeoutDetails.timeoutMessageBody);
                            clearInterval(interval);
                            reject(this.timeoutDetails.timoutMessageTitle);
                        }
                    }
                }catch(e){
                    this.messageService.show(false,this.unexpectedErrorMessage,e);
                    clearInterval(interval);
                    reject(this.unexpectedErrorMessage);
                }
                
            },this.interval)
        });
    }
    
}
@injectable()
export class PlaylistManager implements IPlaylistManager {
    constructor( @inject(Types.IUIManager) private uiManager: IUIManager, @multiInject(Types.IPlaylistProvider) private playlistProviders: Array<IPlaylistProvider>, @inject(Types.IPlaylistStore) private playlistStore: IPlaylistStore, @inject(Types.IMessageService) private messageService: IMessageService,@inject(Types.NewPlaylistMessageTitles) private newPlaylistTitles: NewPlaylistMessageTitles) {
    }
    private addNewPlaylistCallback(playlistProvider: IPlaylistProvider) {
        return playlistProvider.newPlaylist().then((playlist)=>{
            if (playlist) {
                return this.playlistStore.savePlaylist(playlist).then(()=>{
                    this.messageService.show(true, this.newPlaylistTitles.successTitle, playlist.name);
                })
            }
        }).catch((err)=>{
            return this.messageService.show(false, this.newPlaylistTitles.errorTitle,err);
        })

    }
    setUp() {
        var ppDetails = this.playlistProviders.map(pp => {
            return {
                description: pp.description,
                newPlaylist: () => {
                    return this.addNewPlaylistCallback(pp);
                }
            }
        });
        return this.uiManager.addNewPlaylistProviders(ppDetails);
    }
}