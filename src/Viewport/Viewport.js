/**
 * @fileOverview Contains the class definition for an Viewport class.
 * @author <a href="mailto:keith.hughitt@nasa.gov">Keith Hughitt</a>
 * @author <a href="mailto:patrick.schmiedel@gmx.net">Patrick Schmiedel</a>
 * @author <a href="mailto:jaclyn.r.beck@gmail.com">Jaclyn Beck</a>
 */
/*jslint browser: true, white: true, onevar: true, undef: true, nomen: false, eqeqeq: true, plusplus: true, 
bitwise: true, regexp: true, strict: true, newcap: true, immed: true, maxlen: 120, sub: true */
/*global Class, $, document, window, TileLayerManager, MouseCoordinates, ViewportMovementHelper */
"use strict";
var Viewport = Class.extend(
    /** @lends Viewport.prototype */
    {
    /**
     * @description Default Viewport settings
     * 
     * @param {Int} prefetch Prefetch any tiles that fall within this many pixels outside the physical viewport
     */ 
    defaultOptions: {
        imageScale : 1,
        tileSize   : 512,
        minHeight  : 450,
        prefetch   : 0
    },
    dimensions              : { width: 0, height: 0 },
    maxLayerDimensions      : { width: 0, height: 0 },
    tileVisibilityRange     : {xStart: 0, xEnd: 0, yStart: 0, yEnd: 0},

    /**
     * @constructs
     * @description Creates a new Viewport
     * @param {Object} options Custom Viewport settings
     * <br>
     * <br><div style='font-size:16px'>Options:</div><br>
     * <div style='margin-left:15px'>
     *       <b>imageScale</b> - The default image scale to display tiles at (should be passed in from Helioviewer).<br>
     *       <b>tileSize</b>   - Size of tiles.<br> 
     *       <b>prefetch</b>   - The radius outside of the visible viewport to prefetch.<br>
     * </div>
     */
    init: function (options, loadDefaults) {
        $.extend(this, this.defaultOptions);
        $.extend(this, options);
                        
        this.domNode   = $(this.id);
        this.innerNode = $(this.id + '-container-inner');
        this.outerNode = $(this.id + '-container-outer');

        // If Viewport.js is not subclassed, do default setup. Otherwise handle these functions in the subclass.
        if (loadDefaults) {
            this._tileLayerManager = new TileLayerManager(this.api, this.requestDate, this.dataSources, this.tileSize, 
                            this.imageScale, this.maxTileLayers, this.tileServers, this.tileLayers, 
                            this.urlStringLayers, loadDefaults);
            var mouseCoords     = new MouseCoordinates(this.imageScale, this.warnMouseCoords);
            this.movementHelper = new ViewportMovementHelper(this.domNode, mouseCoords);
    
            this.resize();
            this._initEventHandlers();
        }
    },
    
    /**
     * @description Algorithm for determining which tiles should be displayed at
     *              a given time. Uses the Heliocentric coordinates of the viewport's
     *              TOP-LEFT and BOTTOM-RIGHT corners to determine range to display.
     */
    checkTileVisibility: function () {
        var oldTileVisibilityRange = this.tileVisibilityRange;
        
        this._updateTileVisibilityRange();
        
        if (!this._checkVisibilityRangeEquality(oldTileVisibilityRange, this.tileVisibilityRange)) {
            this._tileLayerManager.updateTileVisibilityRange(this.tileVisibilityRange);
        }
    },
    
    /**
     * Compares two sets of indices indicating the current scope or range of tile visibility
     */
    _checkVisibilityRangeEquality: function (r1, r2) {
        return ((r1.xStart === r2.xStart) && (r1.xEnd === r2.xEnd) && 
                (r1.yStart === r2.yStart) && (r1.yEnd === r2.yEnd));         
    },    
    
    /**
     * Adjust saved layer dimensions by a specified scale factor
     */
    scaleLayerDimensions: function (sf) {
        this.maxLayerDimensions.width       = this.maxLayerDimensions.width  * sf;
        this.maxLayerDimensions.height      = this.maxLayerDimensions.height * sf;
    },
    
    /**
     * @description Returns the current image scale (in arc-seconds/px) for which the tiles should be matched to.
     */
    getImageScale: function () {
        return parseFloat(this.imageScale.toPrecision(8));
    },

    /**
     * @description Updates the viewport dimensions
     */
    _updateDimensions: function () {
        this.dimensions = {
            width : this.domNode.width(),
            height: this.domNode.height()
        };
    },
    
    getDimensions: function () {
        return this.dimensions;
    },

    /**
     * @description Handles double-clicks
     * @param {Event} e Event class
     */
    doubleClick: function (e) {
        //check to make sure that you are not already at the minimum/maximum image scale
        if (!(e.shiftKey || (this.imageScale > this.minImageScale)) ||
             (this.imageScale >= this.maxImageScale)) {
            return;
        }
        
        this.movementHelper.doubleClick(e);
    },
     
    /**
     * Updates the stored values for the maximum layer dimensions. This is used in computing the optimal
     * sandbox size in movementHelper. Assumes there is only one kind of layer (aka tileLayers). To
     * account for multiple layer types, like eventLayers, override this method in a subclass. 
     */
    updateMaxLayerDimensions: function (event, type, dimensions) {
        var old = this.maxLayerDimensions;

        this.maxLayerDimensions = dimensions;
        
        if ((this.maxLayerDimensions.width !== old.width) || (this.maxLayerDimensions.height !== old.height)) {
            this.movementHelper.updateMaxLayerDimensions(this.maxLayerDimensions);
        }
    },
    
    resize: function () {
        var oldDimensions, h, padHeight;
    
        // Get dimensions
        oldDimensions = this.dimensions;
    
        // Make room for footer and header if not in fullscreen mode
        if (this.domNode.hasClass("fullscreen-mode")) {
            padHeight = 0;
        }
        else {
            padHeight = this.headerAndFooterHeight;
        }
    
        // Ensure minimum height
        h = Math.max(this.minHeight, $(window).height() - padHeight);

        //Update viewport height
        this.outerNode.height(h);

        // Update viewport dimensions
        this._updateDimensions();
    
        this.dimensions.width  += this.prefetch;
        this.dimensions.height += this.prefetch;
    
        if (this.dimensions.width !== oldDimensions.width || this.dimensions.height !== oldDimensions.height) {
            this.movementHelper.resize();
            this.checkTileVisibility();
        }
    },
    
    /**
     * _onObservationTimeChange
     */
    _onObservationTimeChange: function (event, date) {
        this._tileLayerManager.updateRequestTime(date);
    },
    
    /**
     * @description
     */
    _initEventHandlers: function () {
        $(window).resize($.proxy(this.resize, this));
        $(document).bind("set-image-scale", $.proxy(this.setImageScale, this))
                   .bind("layer-max-dimensions-changed", $.proxy(this.updateMaxLayerDimensions, this))
                   .bind("observation-time-changed", $.proxy(this._onObservationTimeChange, this))
                   .bind("recompute-tile-visibility", $.proxy(this.checkTileVisibility, this));
        
        this.domNode.dblclick($.proxy(this.doubleClick, this));
    },
    
    /**
     * @description Returns the range of indices for the tiles to be displayed.
     * @returns {Object} The range of tiles which should be displayed
     */
    _updateTileVisibilityRange: function () {
        var vp, ts;
        
        // Get viewport coordinates with respect to the center of the image
        vp = this.movementHelper.getViewportCoords();

        // Expand to fit tile increment
        ts = this.tileSize;
        vp = {
            top:    vp.top    - ts - (vp.top  % ts),
            left:   vp.left   - ts - (vp.left % ts),
            bottom: vp.bottom + ts - (vp.bottom % ts),
            right:  vp.right  + ts - (vp.right % ts)
        };

        // Indices to display (one subtracted from ends to account for "0th" tiles).
        this.tileVisibilityRange = {
            xStart : vp.left / ts,
            yStart : vp.top  / ts,
            xEnd   : (vp.right  / ts) - 1,
            yEnd   : (vp.bottom / ts) - 1
        };
    },
    
    setImageScale: function (event, imageScale) {
        var originalScale = this.imageScale;
        this.imageScale   = imageScale;   
    
        // scale layer dimensions
        this.scaleLayerDimensions(originalScale / imageScale);
        
        // Moves the viewport to the correct position after zooming
        this.movementHelper.zoomTo(imageScale);
    
        this._updateTileVisibilityRange();
        // reset the layers
        this._tileLayerManager.adjustImageScale(imageScale, this.tileVisibilityRange);
    
        // store new value
        $(document).trigger("save-setting", ["imageScale", imageScale]);
    },
    
    // 2009/07/06 TODO: Return image scale, x & y offset, fullscreen status?
    toString: function () {
    },    
    toJSON: function () {
    }
});