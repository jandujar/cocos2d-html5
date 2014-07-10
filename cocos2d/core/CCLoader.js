/****************************************************************************
 Copyright (c) 2010-2012 cocos2d-x.org
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011      Zynga Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

/**
 * resource type
 * @constant
 * @type Object
 */
cc.RESOURCE_TYPE = {
    'IMAGE': ['png', 'jpg', 'bmp', 'jpeg', 'gif'],
    'SOUND': ['mp3', 'ogg', 'wav', 'mp4', 'm4a'],
    'XML': ['plist', 'xml', 'fnt', 'tmx', 'tsx'],
    'BINARY': ['ccbi'],
    'FONT': 'FONT',
    'TEXT': ['txt', 'vsh', 'fsh', 'json', 'ExportJson'],
    'UNKNOW': []
};

/**
 * A class to pre-load resources before engine start game main loop.
 * @class
 * @extends cc.Scene
 */
cc.Loader = cc.Class.extend(/** @lends cc.Loader# */{
    _curNumber: 0,
    _totalNumber: 0,
    _loadedNumber: 0,
    _resouces: null,
    _animationInterval: 1 / 60,
    _interval: null,
    _isAsync: false,

    /**
     * Constructor
     */
    ctor: function() {
        this._resouces = [];
    },

    /**
     * init with resources
     * @param {Array} resources
     * @param {Function|String} selector
     * @param {Object} target
     */
    initWithResources: function(resources, selector, target) {
        if (!resources) {
            console.log('resources should not null');
            return;
        }

        if (selector) {
            this._selector = selector;
            this._target = target;
        }

        if ((resources != this._resouces) || (this._curNumber == 0)) {
            this._curNumber = 0;
            this._loadedNumber = 0;
            if (resources[0] instanceof Array) {
                for (var i = 0; i < resources.length; i++) {
                    var each = resources[i];
                    this._resouces = this._resouces.concat(each);
                }
            } else
                this._resouces = resources;
            this._totalNumber = this._resouces.length;
        }

        //load resources
        this._schedulePreload();
    },

    setAsync: function(isAsync) {
        this._isAsync = isAsync;
    },

    /**
     * Callback when a resource file load failed.
     * @example
     * //example
     * cc.Loader.getInstance().onResLoaded();
     */
    onResLoadingErr: function(name) {
        this._loadedNumber++;
        cc.log('cocos2d:Failed loading resource: ' + name);
    },

    /**
     * Callback when a resource file loaded.
     * @example
     * //example
     * cc.Loader.getInstance().onResLoaded();
     */
    onResLoaded: function() {
        this._loadedNumber++;
    },

    /**
     * Get loading percentage
     * @return {Number}
     * @example
     * //example
     * cc.log(cc.Loader.getInstance().getPercentage() + "%");
     */
    getPercentage: function() {
        var percent = 0;
        if (this._totalNumber == 0) {
            percent = 100;
        } else {
            percent = (0 | (this._loadedNumber / this._totalNumber * 100));
        }
        return percent;
    },

    /**
     * release resources from a list
     * @param resources
     */
    releaseResources: function(resources) {
        if (resources && resources.length > 0) {
            var sharedTextureCache = cc.TextureCache.getInstance();
            var sharedEngine = cc.AudioEngine ? cc.AudioEngine.getInstance() : null;
            var sharedParser = cc.SAXParser.getInstance();
            var sharedFileUtils = cc.FileUtils.getInstance();

            var resInfo;
            for (var i = 0; i < resources.length; i++) {
                resInfo = resources[i];
                var type = this._getResType(resInfo);
                switch (type) {
                    case 'IMAGE':
                        sharedTextureCache.removeTextureForKey(resInfo.src);
                        break;
                    case 'SOUND':
                        if (!sharedEngine) throw 'Can not find AudioEngine! Install it, please.';
                        sharedEngine.unloadEffect(resInfo.src);
                        break;
                    case 'XML':
                        sharedParser.unloadPlist(resInfo.src);
                        break;
                    case 'BINARY':
                        sharedFileUtils.unloadBinaryFileData(resInfo.src);
                        break;
                    case 'TEXT':
                        sharedFileUtils.unloadTextFileData(resInfo.src);
                        break;
                    case 'FONT':
                        this._unregisterFaceFont(resInfo);
                        break;
                    default:
                        throw 'cocos2d:unknown filename extension: ' + type;
                        break;
                }
            }
        }
    },

    _preload: function() {
        this._updatePercent();
        if (this._isAsync) {
            var frameRate = cc.Director.getInstance()._frameRate;
            if (frameRate != null && frameRate < 20) {
                cc.log('cocos2d: frame rate less than 20 fps, skip frame.');
                return;
            }
        }

        if (this._curNumber < this._totalNumber) {
            this._loadOneResource();
            this._curNumber++;
        }
    },

    _loadOneResource: function() {
        var sharedTextureCache = cc.TextureCache.getInstance();
        var sharedEngine = cc.AudioEngine ? cc.AudioEngine.getInstance() : null;
        var sharedParser = cc.SAXParser.getInstance();
        var sharedFileUtils = cc.FileUtils.getInstance();

        var resInfo = this._resouces[this._curNumber];
        var type = this._getResType(resInfo);
        switch (type) {
            case 'IMAGE':
                sharedTextureCache.addImage(resInfo.src);
                break;
            case 'SOUND':
                if (!sharedEngine) throw 'Can not find AudioEngine! Install it, please.';
                sharedEngine.preloadSound(resInfo.src);
                break;
            case 'XML':
                sharedParser.preloadPlist(resInfo.src);
                break;
            case 'BINARY':
                sharedFileUtils.preloadBinaryFileData(resInfo.src);
                break;
            case 'TEXT' :
                sharedFileUtils.preloadTextFileData(resInfo.src);
                break;
            case 'FONT':
                this._registerFaceFont(resInfo);
                break;
            default:
                throw 'cocos2d:unknown filename extension: ' + type;
                break;
        }
    },

    _schedulePreload: function() {
        var _self = this;
        this._interval = setInterval(function() {
            _self._preload();
        }, this._animationInterval * 1000);
    },

    _unschedulePreload: function() {
        clearInterval(this._interval);
    },

    _getResType: function(resInfo) {
        var isFont = resInfo.fontName;
        if (isFont != null) {
            return cc.RESOURCE_TYPE['FONT'];
        } else {
            var src = resInfo.src;
            var ext = src.substring(src.lastIndexOf('.') + 1, src.length);

            var index = ext.indexOf('?');
            if (index > 0) ext = ext.substring(0, index);

            for (var resType in cc.RESOURCE_TYPE) {
                if (cc.RESOURCE_TYPE[resType].indexOf(ext) != -1) {
                    return resType;
                }
            }
            return ext;
        }
    },

    _updatePercent: function() {
        var percent = this.getPercentage();

        if (percent >= 100) {
            this._unschedulePreload();
            this._complete();
        }
    },

    _complete: function() {
        if (this._target && (typeof(this._selector) == 'string')) {
            this._target[this._selector](this);
        } else if (this._target && (typeof(this._selector) == 'function')) {
            this._selector.call(this._target, this);
        } else {
            this._selector(this);
        }

        this._curNumber = 0;
        this._loadedNumber = 0;
        this._totalNumber = 0;
    },

    _registerFaceFont: function(fontRes) {
        var srcArr = fontRes.src;
        var fileUtils = cc.FileUtils.getInstance();
        if (srcArr && srcArr.length > 0) {
            var fontStyle = document.createElement('style');
            fontStyle.type = 'text/css';
            document.body.appendChild(fontStyle);

            var fontStr = '@font-face { font-family:' + fontRes.fontName + '; src:';
            for (var i = 0; i < srcArr.length; i++) {
                fontStr += "url('" + fileUtils.fullPathForFilename(encodeURI(srcArr[i].src)) + "') format('" + srcArr[i].type + "')";
                fontStr += (i == (srcArr.length - 1)) ? ';' : ',';
            }
            fontStyle.textContent += fontStr + '};';

            //preload
            //<div style="font-family: PressStart;">.</div>
            var preloadDiv = document.createElement('div');
            preloadDiv.style.fontFamily = fontRes.fontName;
            preloadDiv.innerHTML = '.';
            preloadDiv.style.position = 'absolute';
            preloadDiv.style.left = '-100px';
            preloadDiv.style.top = '-100px';
            document.body.appendChild(preloadDiv);
        }
        cc.Loader.getInstance().onResLoaded();
    },

    _unregisterFaceFont: function(fontRes) {
        //todo remove style
    }
});

/**
 * Preload resources in the background
 * @param {Array} resources
 * @param {Function|String} selector
 * @param {Object} target
 * @return {cc.Loader}
 * @example
 * //example
 * var g_mainmenu = [
 *    {src:"res/hello.png"},
 *    {src:"res/hello.plist"},
 *
 *    {src:"res/logo.png"},
 *    {src:"res/btn.png"},
 *
 *    {src:"res/boom.mp3"},
 * ]
 *
 * var g_level = [
 *    {src:"res/level01.png"},
 *    {src:"res/level02.png"},
 *    {src:"res/level03.png"}
 * ]
 *
 * //load a list of resources
 * cc.Loader.preload(g_mainmenu, this.startGame, this);
 *
 * //load multi lists of resources
 * cc.Loader.preload([g_mainmenu,g_level], this.startGame, this);
 */
cc.Loader.preload = function(resources, selector, target) {
    if (!this._instance) {
        this._instance = new cc.Loader();
    }
    this._instance.initWithResources(resources, selector, target);
    return this._instance;
};

/**
 * Preload resources async
 * @param {Array} resources
 * @param {Function|String} selector
 * @param {Object} target
 * @return {cc.Loader}
 */
cc.Loader.preloadAsync = function(resources, selector, target) {
    if (!this._instance) {
        this._instance = new cc.Loader();
    }
    this._instance.setAsync(true);
    this._instance.initWithResources(resources, selector, target);
    return this._instance;
};

/**
 * Release the resources from a list
 * @param {Array} resources
 */
cc.Loader.purgeCachedData = function(resources) {
    if (this._instance) {
        this._instance.releaseResources(resources);
    }
};

/**
 * Returns a shared instance of the loader
 * @function
 * @return {cc.Loader}
 */
cc.Loader.getInstance = function() {
    if (!this._instance) {
        this._instance = new cc.Loader();
    }
    return this._instance;
};

cc.Loader._instance = null;


/**
 * Used to display the loading screen
 * @class
 * @extends cc.Scene
 */
cc.LoaderScene = cc.Scene.extend(/** @lends cc.LoaderScene# */{
    _logo: null,
    _logoTexture: null,
    _texture2d: null,
    _bgLayer: null,
    _label: null,
    _winSize: null,

    /**
     * Constructor
     */
    ctor: function() {
        cc.Scene.prototype.ctor.call(this);
        this._winSize = cc.Director.getInstance().getWinSize();
    },
    init: function() {
        cc.Scene.prototype.init.call(this);

        //logo
        var logoWidth = 760;
        var logoHeight = 680;
        var centerPos = cc.p(this._winSize.width / 2, this._winSize.height / 2);

        this._logoTexture = new Image();
        var _this = this;
        this._logoTexture.addEventListener('load', function() {
            _this._initStage(centerPos);
            this.removeEventListener('load', arguments.callee, false);
        });
        this._logoTexture.src = 'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAABaAAD/7gAOQWRvYmUAZMAAAAAB/9sAhAABAQEBAQEBAQEBAgEBAQICAgEBAgICAgICAgICAwIDAwMDAgMDBAQEBAQDBQUFBQUFBwcHBwcICAgICAgICAgIAQEBAQICAgUDAwUHBQQFBwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAj/wAARCAKoAvgDAREAAhEBAxEB/8QA/AABAAIBBAMBAAAAAAAAAAAAAAkKCwUGBwgBAwQCAQEAAAcBAQEAAAAAAAAAAAAAAgMFBgcICQQBChAAAQMDAgMDBQkHCBIMCgsAAAECAwQFBhEHEggJITETQVEiFAphkTJS1BUWlldxgaFCYiMXcjPTtJVYGRqxwdGyQ1OTJDR0JVWl1SaGphiCotJjc1RkhJSFZjjw4ZLCs0Q1tUYng6RFxVZ2tmeHOUkRAQABAgMDBQkMCAQFAwMFAAABAgMRBAUhMQZBUWESB3GBkbHRExQVCKHBIjJCUmKSstJTk/ByI2NUFhgJ4YLCM6JDc1UXwyRk8dMl4rM0lBn/2gAMAwEAAhEDEQA/AL/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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AAAAA8cKa6+UDyAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//Z';
        this._logoTexture.width = logoWidth;
        this._logoTexture.height = logoHeight;

        // bg
        this._bgLayer = cc.LayerColor.create(cc.c4(255, 255, 255, 255));
        this._bgLayer.setPosition(0, 0);
        this.addChild(this._bgLayer, 0);

        //loading percent
        this._label = cc.LabelTTF.create('Loading... 0%', 'Arial', 14);
        this._label.setColor(cc.c3(150, 0, 0));
        this._label.setOpacity(0);
        this._label.setPosition(cc.pAdd(centerPos, cc.p(0, -logoHeight / 2 - 40)));
        this._bgLayer.addChild(this._label, 10);
    },

    _initStage: function(centerPos) {
        this._texture2d = new cc.Texture2D();
        this._texture2d.initWithElement(this._logoTexture);
        this._texture2d.handleLoadedTexture();
        this._logo = cc.Sprite.createWithTexture(this._texture2d);
        this._logo.setScale(cc.CONTENT_SCALE_FACTOR());
        this._logo.setPosition(centerPos);
        this._bgLayer.addChild(this._logo, 10);
    },

    onEnter: function() {
        cc.Node.prototype.onEnter.call(this);
        this.schedule(this._startLoading, 0.3);
    },

    onExit: function() {
        cc.Node.prototype.onExit.call(this);
        var tmpStr = 'Loading... 0%';
        this._label.setString(tmpStr);
    },

    /**
     * init with resources
     * @param {Array} resources
     * @param {Function|String} selector
     * @param {Object} target
     */
    initWithResources: function(resources, selector, target) {
        this.resources = resources;
        this.selector = selector;
        this.target = target;
    },

    _startLoading: function() {
        this.unschedule(this._startLoading);
        cc.Loader.preload(this.resources, this.selector, this.target);
        this.schedule(this._updatePercent);
    },

    _updatePercent: function() {
        var percent = cc.Loader.getInstance().getPercentage();
        var tmpStr = 'Loading... ' + percent + '%';
        this._label.setString(tmpStr);

        if (percent >= 100)
            this.unschedule(this._updatePercent);
    }
});

/**
 * Preload multi scene resources.
 * @param {Array} resources
 * @param {Function|String} selector
 * @param {Object} target
 * @return {cc.LoaderScene}
 * @example
 * //example
 * var g_mainmenu = [
 *    {src:"res/hello.png"},
 *    {src:"res/hello.plist"},
 *
 *    {src:"res/logo.png"},
 *    {src:"res/btn.png"},
 *
 *    {src:"res/boom.mp3"},
 * ]
 *
 * var g_level = [
 *    {src:"res/level01.png"},
 *    {src:"res/level02.png"},
 *    {src:"res/level03.png"}
 * ]
 *
 * //load a list of resources
 * cc.LoaderScene.preload(g_mainmenu, this.startGame, this);
 *
 * //load multi lists of resources
 * cc.LoaderScene.preload([g_mainmenu,g_level], this.startGame, this);
 */
cc.LoaderScene.preload = function(resources, selector, target) {
    if (!this._instance) {
        this._instance = new cc.LoaderScene();
        this._instance.init();
    }

    this._instance.initWithResources(resources, selector, target);

    var director = cc.Director.getInstance();
    if (director.getRunningScene()) {
        director.replaceScene(this._instance);
    } else {
        director.runWithScene(this._instance);
    }

    return this._instance;
};
