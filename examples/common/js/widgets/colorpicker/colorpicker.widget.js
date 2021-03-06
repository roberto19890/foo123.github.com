/**
*
* Color Picker jQueryUI ModelView Widget
*
* @url: https://github.com/foo123/modelview-widgets
* @dependencies: jQuery, jQueryUI (widget), ModelViewWidget
*
* adapted from: http://www.eyecon.ro/colorpicker/
*      Color Picker by Stefan Petre www.eyecon.ro (MIT and GPL)
*
*/
!function($, undef) {
    "use strict";
    var Min = Math.min, Max = Math.max, Round = Math.round, 
        extend = $.extend, COMMAS = /\s*,\s*/g, __id = 0,
        ModelView = $.ModelView, TypeCast = ModelView.Type.Cast, Validate = ModelView.Validation.Validate;
    
    function getViewport( ) 
    {
        var m = document.compatMode == 'CSS1Compat';
        return {
            l : window.pageXOffset || (m ? document.documentElement.scrollLeft : document.body.scrollLeft),
            t : window.pageYOffset || (m ? document.documentElement.scrollTop : document.body.scrollTop),
            w : window.innerWidth || (m ? document.documentElement.clientWidth : document.body.clientWidth),
            h : window.innerHeight || (m ? document.documentElement.clientHeight : document.body.clientHeight)
        };
    }
    
    function isChildOf( parentEl, el, container ) 
    {
        if ( parentEl === el ) return true;
        if ( parentEl.contains ) return parentEl.contains( el );
        if ( parentEl.compareDocumentPosition ) return !!(parentEl.compareDocumentPosition(el) & 16);
        var prEl = el.parentNode;
        while ( prEl && prEl !== container ) 
        {
            if ( prEl === parentEl ) return true;
            prEl = prEl.parentNode;
        }
        return false;
    }
    
    function fixHSB( hsb ) 
    {
        return [
            Max(0, Min(360, hsb[0])),
            Max(0, Min(100, hsb[1])),
            Max(0, Min(100, hsb[2]))
        ];
    }
    function fixRGB( rgb ) 
    {
        return [
            Max(0, Min(255, rgb[0])),
            Max(0, Min(255, rgb[1])),
            Max(0, Min(255, rgb[2]))
        ];
    }
    function fixHex( hex ) 
    {
        hex = '#' === hex.charAt(0) ? hex.slice(1) : hex;
        var len = 6 - hex.length;
        if ( len > 0 ) hex = new Array(len+1).join('0') + hex;
        return hex;
    }
    function HexToRGB( hex ) 
    {
        hex = parseInt( hex, 16 );
        return [((hex >> 16) & 255), ((hex >> 8) & 255), (hex & 255)];
    }
    function RGBToHSB( rgb ) 
    {
        var h = 0, s = 0, b = 0,
            rr = rgb[0], rg = rgb[1], rb = rgb[2],
            min = Min( rr, rg, rb ), max = Max( rr, rg, rb ),
            delta = max - min
        ;
        b = max;
        if ( max != 0 ) { }
        s = max != 0 ? 255 * delta / max : 0;
        if ( s != 0 ) 
        {
            if ( rr === max ) 
                h = (rg - rb) / delta;
            else if ( rg === max ) 
                h = 2 + (rb - rr) / delta;
            else 
                h = 4 + (rr - rg) / delta;
        } 
        else 
        {
            h = -1;
        }
        h *= 60;
        if ( h < 0 ) h += 360;
        s *= 100/255;
        b *= 100/255;
        return [Round(h), Round(s), Round(b)];
    }
    function HSBToRGB( hsb ) 
    {
        var r, g, b,
            h = Round( hsb[0] ),
            s = Round( hsb[1]*255/100 ),
            v = Round( hsb[2]*255/100 )
        ;
        if ( s === 0 ) 
        {
            r = g = b = v;
        } 
        else 
        {
            var t1 = v,
                t2 = (255-s)*v/255,
                t3 = (t1-t2)*(h%60)/60
            ;
            if ( h == 360 ) h = 0;
            if ( h < 60 ) { r=t1; b=t2; g=t2+t3 }
            else if ( h < 120 ) { g=t1; b=t2; r=t1-t3 }
            else if ( h < 180 ) { g=t1; r=t2; b=t2+t3 }
            else if ( h < 240 ) { b=t1; r=t2; g=t1-t3 }
            else if ( h < 300 ) { b=t1; g=t2; r=t2+t3 }
            else if ( h < 360 ) { r=t1; g=t2; b=t1-t3 }
            else { r=0; g=0; b=0 }
        }
        return [Round(r), Round(g), Round(b)];
    }
    function RGBToHex( rgb ) 
    {
        var hex = [
            rgb[0].toString(16),
            rgb[1].toString(16),
            rgb[2].toString(16)
        ];
        if ( 1 === hex[0].length ) hex[0] = '0' + hex[0];
        if ( 1 === hex[1].length ) hex[1] = '0' + hex[1];
        if ( 1 === hex[2].length ) hex[2] = '0' + hex[2];
        return hex.join('');
    }
    function toInteger( v ) { return parseInt(v, 10); }
    function parseHSL( hsl )
    {
        return hsl.slice( 4, -1 ).split( COMMAS ).map( toInteger );
    }
    function parseRGB( rgb )
    {
        return rgb.slice( 4, -1 ).split( COMMAS ).map( toInteger );
    }
    function parseRGBA( rgba )
    {
        rgba = rgba.slice( 5, -1 ).split( COMMAS );
        return [ rgba.slice( 0, 3 ).map( toInteger ), rgba[3] ];
    }
    
    function tpl( id, model, bind ) 
    {
        return '\
        <div id="'+id+'" class="ui-colorpicker">\
        <button class="ui-colorpicker_satur_bright" '+bind+'=\'{"mousedown":"downSelector"}\'><div></div></button>\
        <button class="ui-colorpicker_hue" '+bind+'=\'{"mousedown":"downHue"}\'><div></div></button>\
        <div class="ui-colorpicker_new_color ui-colorpicker_transparent">\
        <button class="ui-colorpicker_color" style="background-color:$('+model+'.css.color.current);" '+bind+'=\'{"click":"setColor"}\'></button>\
        </div>\
        <div class="ui-colorpicker_current_color ui-colorpicker_transparent">\
        <button class="ui-colorpicker_color" style="background-color:$('+model+'.css.color);" '+bind+'=\'{"click":"restoreColor"}\'></button>\
        </div>\
        <div class="ui-colorpicker_field" data-field="hex">\
        <input name="'+model+'[hex]" type="text" maxlength="6" size="6" value=""/>\
        <div class="ui-colorpicker_field_back"></div>\
        </div>\
        <div class="ui-colorpicker_field" data-field="rgb.0">\
        <input name="'+model+'[rgb][0]" type="text" maxlength="3" size="3" value=""/><span '+bind+'=\'{"mousedown":"downIncrement"}\'></span>\
        <div class="ui-colorpicker_field_back"></div>\
        </div>\
        <div class="ui-colorpicker_field" data-field="rgb.1">\
        <input name="'+model+'[rgb][1]" type="text" maxlength="3" size="3" value=""/><span '+bind+'=\'{"mousedown":"downIncrement"}\'></span>\
        <div class="ui-colorpicker_field_back"></div>\
        </div>\
        <div class="ui-colorpicker_field" data-field="rgb.2">\
        <input name="'+model+'[rgb][2]" type="text" maxlength="3" size="3" value=""/><span '+bind+'=\'{"mousedown":"downIncrement"}\'></span>\
        <div class="ui-colorpicker_field_back"></div>\
        </div>\
        <div class="ui-colorpicker_field" data-field="hsb.0">\
        <input name="'+model+'[hsb][0]" type="text" maxlength="3" size="3" value=""/><span '+bind+'=\'{"mousedown":"downIncrement"}\'></span>\
        <div class="ui-colorpicker_field_back"></div>\
        </div>\
        <div class="ui-colorpicker_field" data-field="hsb.1">\
        <input name="'+model+'[hsb][1]" type="text" maxlength="3" size="3" value=""/><span '+bind+'=\'{"mousedown":"downIncrement"}\'></span>\
        <div class="ui-colorpicker_field_back"></div>\
        </div>\
        <div class="ui-colorpicker_field" data-field="hsb.2">\
        <input name="'+model+'[hsb][2]" type="text" maxlength="3" size="3" value=""/><span '+bind+'=\'{"mousedown":"downIncrement"}\'></span>\
        <div class="ui-colorpicker_field_back"></div>\
        </div>\
        <button class="ui-colorpicker_submit" '+bind+'=\'{"click":"setColor"}\'></button>\
        </div>\
        ';
    }
    
    function dummy( ){ }
    
    function defaults( options )
    {
        return extend({
            eventName: 'click',
            onShow: dummy,
            onBeforeShow: dummy,
            onHide: dummy,
            onSetColor: dummy,
            color: 'ff0000',
            opacity: 1.0,
            livePreview: true
        }, options || {});
    }
    
    $.widget( 'mvc.ColorPicker', $.mvc.ModelViewWidget, {
        
        options: { },
        
        $view: null,
        
        _create: function() {
            var self = this, el = self.element, 
                prevColor, ID, modelID, bindAttr, 
                $ui, hue, satur_bright_indic, hue_indic,
                show, hide, hideOnEscKey, widget,
                bindIncrement = 0, moveIncrement, upIncrement,
                bindHue = 0, moveHue, upHue,
                bindSelector = 0, moveSelector, upSelector
            ;
            
            widget = self;
            self.options = defaults( self.options );
            
            moveIncrement = function( ev ) {
                self.$view.$model.set(
                    ev.data.type, 
                    Max(0, Min(ev.data.max, parseInt(ev.data.val + ev.pageY - ev.data.y, 10)))
                );
                if ( widget.options.livePreview ) 
                    self.$view.$model.set(ev.data.key, self.$view.$model.get(ev.data.key, 1), 1);
                return false;
            };
            upIncrement = function( ev ) {
                $(document).unbind('mouseup', upIncrement).unbind('mousemove', moveIncrement);
                bindIncrement = 0;
                ev.data.el.removeClass('ui-colorpicker_slider').find('input').focus( );
                self.$view.$model.set(ev.data.key, self.$view.$model.get(ev.data.key, 1), 1);
                return false;
            };
            moveHue = function( ev ) {
                if ( widget.options.livePreview )
                {
                    var hsb = self.$view.$model.$data.hsb;
                    self.$view.$model.set('hsb', [
                        parseInt(360*(148 - Max(0,Min(148,(ev.pageY - ev.data.y))))/148, 10),
                        hsb[1],
                        hsb[2]
                    ], 1);
                }
                return false;
            };
            upHue = function( ev ) {
                $(document).unbind('mouseup', upHue).unbind('mousemove', moveHue);
                bindHue = 0;
                var hsb = self.$view.$model.$data.hsb;
                self.$view.$model.set('hsb', [
                    parseInt(360*(148 - Max(0,Min(148,(ev.pageY - ev.data.y))))/148, 10),
                    hsb[1],
                    hsb[2]
                ], 1);
                return false;
            };
            moveSelector = function( ev ) {
                if ( widget.options.livePreview )
                {
                    var hsb = self.$view.$model.$data.hsb;
                    self.$view.$model.set('hsb', [
                        hsb[0], 
                        parseInt(100*(Max(0,Min(150,(ev.pageX - ev.data.pos.left))))/150, 10),
                        parseInt(100*(150 - Max(0,Min(150,(ev.pageY - ev.data.pos.top))))/150, 10)
                    ], 1);
                }
                return false;
            };
            upSelector = function( ev ) {
                $(document).unbind('mouseup', upSelector).unbind('mousemove', moveSelector);
                bindSelector = 0;
                var hsb = self.$view.$model.$data.hsb;
                self.$view.$model.set('hsb', [
                    hsb[0], 
                    parseInt(100*(Max(0,Min(150,(ev.pageX - ev.data.pos.left))))/150, 10),
                    parseInt(100*(150 - Max(0,Min(150,(ev.pageY - ev.data.pos.top))))/150, 10)
                ], 1);
                return false;
            };
            
            $ui = $(tpl(ID='clrpkrui'+(++__id), modelID='model_'+ID, bindAttr='data-bind-'+ID));
            hue_indic = $ui.find('.ui-colorpicker_hue div')[0];
            hue = $ui.find('.ui-colorpicker_satur_bright')[0];
            satur_bright_indic = $ui.find('.ui-colorpicker_satur_bright div')[0];
            self.$view = $ui.modelview({
                id: ID
                ,autoSync: false
                ,bindAttribute: bindAttr
                ,livebind: '$(__MODEL__.__KEY__)'
                ,autobind: true
                ,isomorphic: false
                ,bindbubble: true
                ,events: ['change', 'blur', 'focus', 'mousedown', 'click']
                ,model: {
                    id: modelID
                    ,data: {
                        opacity: 1.0
                        ,hsb: [0, 0, 0]
                        ,rgb: [0, 0, 0]
                        ,hex: '000000'
                    }
                    ,types: {
                        'opacity': TypeCast.COMPOSITE(TypeCast.CLAMP(0.0, 1.0), TypeCast.FLOAT)
                        ,'hsb.0': TypeCast.COMPOSITE(TypeCast.CLAMP(0, 360), TypeCast.INT)
                        ,'hsb.1': TypeCast.COMPOSITE(TypeCast.CLAMP(0, 100), TypeCast.INT)
                        ,'hsb.2': TypeCast.COMPOSITE(TypeCast.CLAMP(0, 100), TypeCast.INT)
                        ,'rgb.*': TypeCast.COMPOSITE(TypeCast.CLAMP(0, 255), TypeCast.INT)
                        ,'hex': TypeCast.TRIM
                    }
                    ,validators: {
                        'hex': Validate.MATCH(/^[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]$/i)
                    }
                    ,getters: {
                        color: function( ) {
                            return this.$data.rgb;
                        }
                        ,'css.color': function( ) {
                            return 'rgba(' + prevColor.join(',') + ',' + this.$data.opacity + ')';
                        }
                        ,'css.color.current': function( ) {
                            return 'rgba(' + this.$data.rgb.join(',') + ',' + this.$data.opacity + ')';
                        }
                        ,'css.color.rgb': function( ) {
                            return 'rgb(' + this.$data.rgb.join(',') + ')';
                        }
                        ,'css.color.hsl': function( ) {
                            var hsb = this.$data.hsb;
                            return 'hsl(' + [hsb[0], hsb[1]+'%', hsb[2]+'%'].join(',') + ')';
                        }
                        ,'css.color.hex': function( ) {
                            return '#' + this.$data.hex;
                        }
                    }
                    ,setters: {
                        opacity: function( k, opacity, pub ) {
                            var model = this;
                            model.$data.opacity = opacity;
                            if ( pub ) 
                            {
                                model.notify('css.color');
                                widget.element[0].style.backgroundColor = model.get('css.color');
                            }
                        }
                        ,'css.color': function( k, color, pub ) {
                            var model = this, pre4, c;
                            if ( color && color.substring )
                            {
                                pre4 = color.slice( 0, 4 );
                                if ( 'rgba' === pre4 ) 
                                {
                                    c = parseRGBA( color );
                                    model.set('opacity', c[1]).set('rgb', c[0]);
                                }
                                else if ( 'rgb(' === pre4 ) 
                                {
                                    c = parseRGB(color);
                                    model.set('rgb', c);
                                }
                                else if ( 'hsl(' === pre4 ) 
                                {
                                    c = parseHSL(color);
                                    model.set('hsb', c);
                                }
                                else
                                {
                                    c = color;
                                    model.set('hex', '#' === c.charAt(0) ? c.slice(1) : c);
                                }
                                prevColor = model.$data.rgb.slice( );
                                if ( pub ) 
                                {
                                    model.notify(['hsb', 'rgb', 'hex', 'color']);
                                    widget.element[0].style.backgroundColor = model.get('css.color');
                                }
                            }
                        }
                        ,color: function( k, color, pub ) {
                            var model = this;
                            if ( color )
                            {
                                if ( color.substring ) 
                                    model.set('hex', '#' === color.charAt(0) ? color.slice(1) : color);
                                else if ( color.h !== undef && color.s !== undef && color.b !== undef ) 
                                    model.set('hsb', [color.h, color.s, color.b]);
                                else if ( color.r !== undef && color.g !== undef && color.b !== undef ) 
                                    model.set('rgb', [color.r, color.g, color.b]);
                                else
                                    model.set('rgb', [color[0]||0, color[1]||0, color[2]||0]);
                                prevColor = model.$data.rgb.slice( );
                                if ( pub ) 
                                {
                                    model.notify(['hsb', 'rgb', 'hex', 'css.color']);
                                    widget.element[0].style.backgroundColor = model.get('css.color');
                                }
                            }
                        }
                        ,hsb: function( k, v, pub ) {
                            var model = this, $data = model.$data, hsb;
                            hsb = $data.hsb = fixHSB( v );
                            $data.rgb = HSBToRGB( hsb );
                            $data.hex = RGBToHex( $data.rgb );
                            hue.style.backgroundColor = 'rgb(' + HSBToRGB( [hsb[0], 100, 100] ).join(',') + ')';
                            satur_bright_indic.style.top = (150 * (100-hsb[2])/100) + 'px';
                            satur_bright_indic.style.left = (150 * hsb[1]/100) + 'px';
                            hue_indic.style.top = (148 - 148 * hsb[0]/360) + 'px';
                            if ( pub ) 
                            {
                                model.notify(['rgb', 'hex', 'css.color.current']);
                            }
                        }
                        ,'hsb.*': function( k, v, pub ) {
                            this.$data.hsb[parseInt(k.slice(4), 10)] = v;
                            if ( pub ) this.set('hsb', this.$data.hsb, pub);
                            return false;
                        }
                        ,rgb: function( k, v, pub ) {
                            var model = this, $data = model.$data, hsb;
                            $data.rgb = fixRGB( v );
                            $data.hex = RGBToHex( $data.rgb );
                            hsb = $data.hsb = RGBToHSB( $data.rgb );
                            hue.style.backgroundColor = 'rgb(' + HSBToRGB( [hsb[0], 100, 100] ).join(',') + ')';
                            satur_bright_indic.style.top = (150 * (100-hsb[2])/100) + 'px';
                            satur_bright_indic.style.left = (150 * hsb[1]/100) + 'px';
                            hue_indic.style.top = (148 - 148 * hsb[0]/360) + 'px';
                            if ( pub ) 
                            {
                                model.notify(['hsb', 'hex', 'css.color.current']);
                            }
                        }
                        ,'rgb.*': function( k, v, pub ) {
                            this.$data.rgb[parseInt(k.slice(4), 10)] = v;
                            if ( pub ) this.set('rgb', this.$data.rgb, pub);
                            return false;
                        }
                        ,hex: function( k, v, pub ) {
                            var model = this, $data = model.$data, hsb;
                            $data.hex = fixHex( v );
                            $data.rgb = HexToRGB( $data.hex );
                            hsb = $data.hsb = RGBToHSB( $data.rgb );
                            hue.style.backgroundColor = 'rgb(' + HSBToRGB( [hsb[0], 100, 100] ).join(',') + ')';
                            satur_bright_indic.style.top = (150 * (100-hsb[2])/100) + 'px';
                            satur_bright_indic.style.left = (150 * hsb[1]/100) + 'px';
                            hue_indic.style.top = (148 - 148 * hsb[0]/360) + 'px';
                            if ( pub ) 
                            {
                                model.notify(['hsb', 'rgb', 'css.color.current']);
                            }
                        }
                    }
                }
                ,actions: {
                    setColor: function( ev, el ) {
                        this.$model.set('color', this.$model.$data.rgb, 1);
                        if ( hide ) hide( true );
                        widget.options.onSetColor( widget.element );
                    }
                    ,restoreColor: function( ev, el ) {
                        this.$model.set('color', prevColor, 1);
                    }
                    ,downIncrement: function( ev, el ) {
                        if ( !bindIncrement )
                        {
                            var wrapper = $(el.parentNode).addClass('ui-colorpicker_slider'), 
                                type = wrapper.attr('data-field'),
                                field = wrapper.find('input').focus( ),
                                current = {
                                    el: wrapper,
                                    type: type,
                                    key: type.slice(0, 3),
                                    max: type === 'hsb.0' ? 360 : (type.indexOf('hsb') === 0 ? 100 : 255),
                                    y: ev.pageY,
                                    field: field,
                                    val: parseInt(field.val(), 10)
                                }
                            ;
                            bindIncrement = 1;
                            $(document)
                                .bind('mouseup', current, upIncrement)
                                .bind('mousemove', current, moveIncrement)
                            ;
                        }
                    }
                    ,downHue: function( ev, el ) {
                        if ( !bindHue )
                        {
                            var current = {
                                y: $(el).offset().top
                            };
                            bindHue = 1;
                            $(document)
                                .bind('mouseup', current, upHue)
                                .bind('mousemove', current, moveHue)
                            ;
                        }
                    }
                    ,downSelector: function( ev, el ) {
                        if ( !bindSelector )
                        {
                            var current = {
                                pos: $(el).offset()
                            };
                            bindSelector = 1;
                            $(document)
                                .bind('mouseup', current, upSelector)
                                .bind('mousemove', current, moveSelector)
                            ;
                        }
                    }
                }
            }).modelview('view');
            self.$view.$model.set('opacity', widget.options.opacity).set('color', widget.options.color);
            
            if ( el.hasClass('ui-colorpicker-flat') ) 
            {
                $ui.addClass('ui-colorpicker-flat').appendTo( el ).show( );
            } 
            else 
            {
                hideOnEscKey = function( ev ) {
                    // ESC key pressed
                    if ( 27 === ev.keyCode ) hide( true );
                };
                hide = function hide( ev ) {
                    if ( $ui.hasClass('ui-colorpicker-visible') && 
                        ( true === ev || 
                            (ev.target !== el[0] && !isChildOf($ui[0], ev.target, $ui[0]))
                        ) 
                        ) 
                    {
                        if ( false !== widget.options.onHide($ui) ) $ui.removeClass('ui-colorpicker-visible');
                        $(document).unbind('keyup', hideOnEscKey).unbind('mousedown', hide);
                    }
                };
                show = function show( ev ) {
                    if ( !$ui.hasClass('ui-colorpicker-visible') )
                    {
                        widget.options.onBeforeShow($ui);
                        var pos = $(this).offset( ), viewPort = getViewport( ), 
                            top = pos.top + this.offsetHeight, left = pos.left
                        ;
                        if ( top + 176 > viewPort.t + viewPort.h ) top -= this.offsetHeight + 176;
                        if ( left + 356 > viewPort.l + viewPort.w ) left -= 356;
                        $ui.css({left: left+'px', top: top+'px'});
                        if ( false !== widget.options.onShow($ui) ) $ui.addClass('ui-colorpicker-visible');
                        $(document).bind('keyup', hideOnEscKey).bind('mousedown', hide);
                    }
                    return false;
                };
                $ui.appendTo( document.body );
                el.bind( self.options.eventName, show );
            }
            self.$view.sync( );
            el
                .addClass('ui-colorselector')
                .css('background-color', self.$view.$model.get('css.color'))
            ;
            if ( el.hasClass('ui-colorpicker-light') ) $ui.addClass('ui-colorpicker-light');
            if ( el.hasClass('ui-colorpicker-transition-fade') ) $ui.addClass('ui-colorpicker-transition-fade');
            if ( el.hasClass('ui-colorpicker-transition-slide') ) $ui.addClass('ui-colorpicker-transition-slide');
        },
        
        color: function( col ) {
            var self = this, argslen = arguments.length;
            if ( argslen ) 
            {
                self.$view.$model.set('color', col, 1);
                return self.element;
            }
            return self.$view.$model.get('css.color');
        },
        
        opacity: function( opacity ) {
            var self = this, argslen = arguments.length;
            if ( argslen ) 
            {
                self.$view.$model.set('opacity', opacity, 1);
                return self.element;
            }
            return self.$view.$model.get('opacity');
        }
    });

}(jQuery);