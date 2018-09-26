# EnjoyMusicPlayerWithPlaylists
Adds additional playlist support to the chrome extension Enjoy Music Player.  Can create a playlist from all playable music files* in a folder or select a wpl ( Windows Playlist file ).
THE WPL MUST HAVE ABSOLUTE PATHS - USING GROOVE MUSIC PLAYER WILL ENSURE ABSOLUTE
( Works with version 5.0.9_0)

Requirements
1) Installed gulp cli - npm install --global gulp-cli
2) Installed npx - npm install -g npx


How it works
Either
a) Adds to already installed extension
    Which can be downloaded from - https://chrome.google.com/webstore/detail/enjoy-music-player/hncfgilfeieogcpghjnnhddghgdjbekl?hl=en

    1) Add the path to the chrome extension folder in gulpfile.js - var chromeExtensionsPath
    2) gulp buildToExisting


b) Moves a local version 5.0.9_0 ( that the code is designed to work with) to the extensions folder
   The update url entry has been removed from the manifest.json so the app should not update
   ( "update_url": "https://clients2.google.com/service/update2/crx" )

   1) Add the path to the chrome extension folder in gulpfile.js - - var chromeExtensionsPath
   2) gulp buildAndInstall

Using the new functionality
    Ensure that any music in a folder or playlist is in a gallery that Enjoy Music Player has access to
        Click the Add Music button to add galleries
    In the Enjoy Music Player - click either of the two new 'New playlist from...' buttons
    Close and reopen for the Enjoy Music Player to find the new playlists

* Music file extensions are specified in inversify.config.ts ( although I have not checked if Enjoy Music Player can play them all)
myContainer.bind<Array<string>>(Types.musicFileExtensions).toConstantValue(["mp3", "wav","aiff","mp4","m4a","aif","wma","flac","m4a"]);
