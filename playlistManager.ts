import { myContainer } from "./inversify.config"
import { IPlaylistManager } from "./interfaces"
import { Types } from "./types"
var playlistManager = myContainer.get<IPlaylistManager>(Types.IPlaylistManager);
playlistManager.setUp();
