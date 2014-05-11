/*
 MediaCenterJS - A NodeJS based mediacenter solution

 Copyright (C) 2013 - Jan Smolders

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
(function($){

    var ns = 'mcjsm'
    ,methods = {
        
    };

    function _init(options) {
        var opts = $.extend(true, {}, $.fn.mcjsm.defaults, options);
        return this.each(function() {
            var $that = $(this);
            var o = $.extend(true, {}, opts, $that.data(opts.datasetKey));

            // add data to the defaults (e.g. $node caches etc)
            o = $.extend(true, o, {
                $that: $that
            });

            // use extend(), so no o is used by value, not by reference
            $.data(this, ns, $.extend(true, {}, o));

            _focusedItem(o);
            _scrollBackdrop(o);

            $that.on('scroll resize', function() {
                _positionHeader(o);
            });
        });
    }

    /**** Start of custom functions ***/


    function _positionHeader(o){
        var startFromTopInit = $('#moviebrowser').offset().top > 50;
        if (startFromTopInit){
            $('#backdrop').removeClass('shrink');
        } else {
            $('#backdrop').addClass('shrink');
        }
    };

    function _focusedItem(o){
        $(o.movieListSelector+' > li').on({
            mouseenter: function() {
                var newBackground = $(this).find("img."+o.posterClass).attr(o.backdrophandler);
                $(this).addClass(o.focusedClass);
                $(o.backdropClass).attr("src", newBackground).addClass(o.fadeClass);
            },
            mouseleave: function() {
                $(o.backdropClass).removeClass(o.fadeClass);
                if ($('li.'+o.posterClass+'.'+o.focusedClass).length) {
                    $('li.'+o.posterClass+'.'+o.focusedClass).removeClass(o.focusedClass);
                }
            },
            focus: function() {
                $(this).addClass(o.focusedClass);
                var newBackground = $(this).find("img."+o.posterClass).attr(o.backdrophandler);
                $(o.backdropClass).attr("src", newBackground).addClass(o.fadeClass);
            },
            focusout: function() {
                $(o.backdropClass).removeClass(o.fadeClass);
                if ($('li.'+o.posterClass+'.'+o.focusedClass).length) {
                    $('li.'+o.posterClass+'.'+o.focusedClass).removeClass(o.focusedClass);
                }
            }
        });

        if ($(o.movieListSelector+' > li'+o.focusedClass)){
            var newBackground = $(this).find("img."+o.posterClass).attr(o.backdrophandler);
            $(o.backdropClass).attr("src", newBackground).addClass(o.fadeSlowClass);
        }
    }

    function _scrollBackdrop(o){
        var duration = 40000;
        $(o.backdropClass).animate({
                top: '-380px'
            },
            {
                easing: 'swing',
                duration: duration,
                complete: function(){
                    $(o.backdropClass).animate({
                            top: '-0px'
                        },
                        {
                            easing: 'swing',
                            duration: duration,
                            complete: function(){
                                if(o.stopScroll === false){
                                    _scrollBackdrop(o);
                                }
                            }
                        });
                }
            });
    }

    /**** End of custom functions ***/

    $.fn.mcjsm = function( method ) {
        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || !method ) {
            return _init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.fn.mcjsm' );
        }
    };

    /* default values for this plugin */
    $.fn.mcjsm.defaults = {
        datasetKey: 'mcjsmovies' //always lowercase
        , movieListSelector: '.movies'
        , backdropClass: '.backdropimg'
        , backdropSelector: 'backdropimg'
        , backdrophandler: 'title'
        , posterClass: 'movieposter'
        , backdropWrapperSelector: '#backdrop'
        , backLinkSelector: '.backlink'
        , fadeClass: 'fadein'
        , fadeSlowClass: 'fadeinslow'
        , focusedClass: 'focused'
    };

})(jQuery);