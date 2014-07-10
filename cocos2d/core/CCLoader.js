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
        var logoWidth = 300;
        var logoHeight = 160;
        var centerPos = cc.p(this._winSize.width / 2, this._winSize.height / 2);

        this._logoTexture = new Image();
        var _this = this;
        this._logoTexture.addEventListener('load', function() {
            _this._initStage(centerPos);
            this.removeEventListener('load', arguments.callee, false);
        });
        this._logoTexture.src = 'data:image/jpeg;base64,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';
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
