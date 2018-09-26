///<reference types="filesystem"/>
///<reference path='./node_modules/@types/chrome/chrome-app.d.ts'/>

export interface IPlaylistManager {
    setUp():Promise<void>;
}
export interface NewPlaylistMessageTitles{
    successTitle:string,
    errorTitle:string
}
export interface UINewPlaylist{
    description:string,
    newPlaylist:()=>void
}
export interface IUIManager {
    addNewPlaylistProviders(playlistProviderDetails: Array<UINewPlaylist>):Promise<void>
}
export interface IUIInjector{
    domReady():boolean;
    inject(playlistProviderDetails: Array<UINewPlaylist>);
}
export interface UIInjectorTimeoutDetails{
    timeout:number,
    timoutMessageTitle:string,
    timeoutMessageBody:string
}
export interface IPlaylistElementFinder{
    find():HTMLElement
}
export interface IPlaylistElementCreator{
    create(playlistElement:HTMLElement,uiNewPlaylists:Array<UINewPlaylist>):Array<HTMLElement>
}
export interface IPlaylistElementInjector{
    inject(playlistElement:HTMLElement,newPlaylistElements:Array<HTMLElement>):void
}
export interface IPlaylistProvider {
    newPlaylist(): Promise<Playlist>
    description: string;
}
export interface Playlist {
    name: string,
    songs: Array<PlaylistSong>

}
export interface PlaylistSong {
    album: string,
    artist: string,
    galleryId: string,
    path: string,
    track: string,
    title: string,
    id:string
}
export interface IPlaylistStore {
    savePlaylist(playlist:Playlist):Promise<void>
}
export interface IMessageService {
    show(success: boolean, titleText: string, body: any):Promise<void>
}
export interface MessageOptions {
    timeout:number
}
export interface IIOAsyncHelper {
    fileEntryTextAsync(fileEntry:FileEntry):Promise<string>
    fileEntryFileAsync(fileEntry: FileEntry): Promise<File>
    fileReaderReadAsTextAsync(file: File): Promise<string>
    chooseEntryAsync(options: chrome.fileSystem.ChooseEntryOptions): Promise<Entry|FileEntry[]>
    readDirectoryAsync(directoryEntry: DirectoryEntry): Promise<Array<Entry>>
    readDirectoryFilesAsync(directoryEntry: DirectoryEntry): Promise<Array<FileEntry>>
}
export interface IWPLParser {
    parsePlaylist(playlistString: string): WPLPlaylist
}
export interface WPLPlaylist {
    title: string,
    seq: Array<WPLMedia>
}
export interface WPLMedia {
    src: string,
    albumTitle: string,
    albumArtist: string,
    trackTitle: string,
    trackArtist:string

}
export interface GalleryDetail {
    path: string,
    id:string
}

export interface IMediaGalleryManager {
    getGalleriesAsync(): Promise<Array<GalleryDetail>>
    addUserSelectedFolderAsync(): Promise<FileSystem|null>
    getMediaFileSystemMetadata(fileSystem: FileSystem): chrome.mediaGalleries.MediaFileSystemMetadata 
    getMetadataAsync(mediaFile: Blob): Promise<chrome.mediaGalleries.Metadata>

}
export interface MessageIcons{
    successPath:string,
    errorPath:string,
}
