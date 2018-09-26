import { Container } from "inversify";
import "reflect-metadata";
import { Types } from "./types";
import { IPlaylistManager, IUIManager, IPlaylistProvider, IMessageService, IPlaylistStore, Playlist, MessageOptions, IIOAsyncHelper, IWPLParser, IMediaGalleryManager, MessageIcons, IUIInjector, UIInjectorTimeoutDetails, IPlaylistElementFinder, IPlaylistElementCreator, IPlaylistElementInjector, NewPlaylistMessageTitles } from "./interfaces";
import { PlaylistManager, IndexedDbStore, UIManager, WPLPlaylistProvider, MessageService, IOAsyncHelper, WPLParser, MediaGalleryManager, FolderPlaylistProvider, UIInjector, PlaylistElementFinder, PlaylistElementCreator, PlaylistElementInjector } from "./entities"


var myContainer = new Container();
myContainer.bind<IPlaylistManager>(Types.IPlaylistManager).to(PlaylistManager).inSingletonScope();
myContainer.bind<NewPlaylistMessageTitles>(Types.NewPlaylistMessageTitles).toConstantValue({errorTitle:"Error creating playlist",successTitle:"Created playlist !"})
myContainer.bind<IUIManager>(Types.IUIManager).to(UIManager).inSingletonScope();
myContainer.bind<string>(Types.UIUnexpectedErrorMessage).toConstantValue("Error preparing the ui");
myContainer.bind<IUIInjector>(Types.IUIInjector).to(UIInjector).inSingletonScope();
myContainer.bind<number>(Types.UIInjectorInterval).toConstantValue(100);
myContainer.bind<UIInjectorTimeoutDetails>(Types.UIInjectorTimeoutDetails).toConstantValue({timeout:2000,timoutMessageTitle:"Load timeout",timeoutMessageBody:"Expected DOM not loaded within timeout interval"} );
myContainer.bind<IPlaylistElementFinder>(Types.IPlaylistElementFinder).to(PlaylistElementFinder);
myContainer.bind<string>(Types.PlaylistElementSelector).toConstantValue('#app > div.s1.main > div > div.side-bar.flex.vert > ul.nav-list.s1> li');
myContainer.bind<IPlaylistElementCreator>(Types.IPlaylistElementCreator).to(PlaylistElementCreator);
myContainer.bind<IPlaylistElementInjector>(Types.IPlaylistElementInjector).to(PlaylistElementInjector);
myContainer.bind<IPlaylistProvider>(Types.IPlaylistProvider).to(WPLPlaylistProvider).inSingletonScope();
myContainer.bind<IPlaylistProvider>(Types.IPlaylistProvider).to(FolderPlaylistProvider).inSingletonScope();
myContainer.bind<IIOAsyncHelper>(Types.IIOAsyncHelper).to(IOAsyncHelper).inSingletonScope();
myContainer.bind<IWPLParser>(Types.IWPLParser).to(WPLParser).inSingletonScope();
myContainer.bind<IMediaGalleryManager>(Types.IMediaGalleryManager).to(MediaGalleryManager).inSingletonScope();
myContainer.bind<IMessageService>(Types.IMessageService).to(MessageService).inSingletonScope();
myContainer.bind<IPlaylistStore>(Types.IPlaylistStore).to(IndexedDbStore).inSingletonScope();
myContainer.bind<MessageOptions>(Types.MessageOptions).toConstantValue({ timeout: 3000 });
myContainer.bind<MessageIcons>(Types.MessageIcons).toConstantValue({errorPath:"img/symbol_error.png",successPath:"img/symbol_check.png"});
myContainer.bind<Array<string>>(Types.musicFileExtensions).toConstantValue(["mp3", "wav","aiff","mp4","m4a","aif","wma","flac","m4a"]);
export { myContainer}

