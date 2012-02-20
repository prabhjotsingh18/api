/**
 * @fileOverview Contains JavaScript for an embedded version of Helioviewer.org
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
  bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global document, window, $, HelioviewerClient, TooltipHelper, 
  HelioviewerViewport, addIconHoverEventListener, KeyboardManager, 
  SettingsLoader, addthis, ZoomControls, assignTouchHandlers */
"use strict";
var HelioviewerWebClient = HelioviewerClient.extend(
    /** @lends HelioviewerWebClient.prototype */
    {
    /**
     * Creates a new embedded Helioviewer.org instance.
     * @constructs
     * 
     * @param {Object} urlSettings Client-specified settings to load.
     *  Includes imageLayers, date, and imageScale. May be empty.
     * @param {Object} serverSettings Server settings loaded from Config.ini
     */
    init: function (api, urlSettings, serverSettings, zoomLevels) {
        var urlDate, imageScale;
        
        this._super(api, urlSettings, serverSettings, zoomLevels);
        
        // Determine image scale to use
        imageScale = this._chooseInitialImageScale(Helioviewer.userSettings.get('state.imageScale'), zoomLevels);
        
        // Use URL date if specified
        urlDate = urlSettings.date ? Date.parseUTCDate(urlSettings.date) : false;
    }
});