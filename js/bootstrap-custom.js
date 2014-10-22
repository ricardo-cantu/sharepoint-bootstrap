//
//
//
//
//
/* global FixRibbonAndWorkspaceDimensions,SPBS */
(function (window, $) {

    var component = function () {

        this._mutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        this.eventListenerSupported = window.addEventListener;

        // Cache jquery objects
        this.$msWebpartZone = $('.ms-webpart-zone');
        this.$sideNavBox = $('#sideNavBox');
        this.$sideNavBoxMsCoreNavigation = $('#sideNavBox .ms-core-navigation');
    };

    component.prototype = function () {

        // Init all Bootstrap helpers
        //
        // Public
        //
        function init() {

            var self = this,
                $window = $(window);

            _triggerSpecialEvents.call(self);
            _fixDropZone.call(self);
            _bindBrowserStyles.call(self);
            _bindTopNav.call(self);
            _fixLeftNav.call(self);
            _fixImg.call(self);

            $window.on('debouncedresize', function () {
                _bindBodySpans.call(self);
            });
            $window.trigger('debouncedresize');

            _overrideTwitter.call(self);
        }

        function _triggerSpecialEvents() {
            // Hook into SP window resize event
            if (typeof window.oldFixRibbonAndWorkspaceDimensions === 'undefined' && typeof FixRibbonAndWorkspaceDimensions !== 'undefined') {

                window.oldFixRibbonAndWorkspaceDimensions = FixRibbonAndWorkspaceDimensions;

                FixRibbonAndWorkspaceDimensions = function () {

                    var rtn = window.oldFixRibbonAndWorkspaceDimensions.apply(arguments);

                    // Trigger custom event we will listen for
                    jQuery(document).trigger('FixRibbonAndWorkspaceDimensions');

                    return rtn;
                };
            }

            // Create a special event to debounce those nasty resize events
            if (!$.event.special.debouncedresize) {
                (function () {

                    var $event = $.event,
                        $special,
                        resizeTimeout;

                    $special = $event.special.debouncedresize = {
                        setup: function () {
                            $(this).on("resize", $special.handler);
                        },
                        teardown: function () {
                            $(this).off("resize", $special.handler);
                        },
                        handler: function (event, execAsap) {
                            // Save the context
                            var context = this,
                                args = arguments,
                                dispatch = function () {
                                    // set correct event type
                                    event.type = "debouncedresize";
                                    $event.dispatch.apply(context, args);
                                };

                            if (resizeTimeout) {
                                clearTimeout(resizeTimeout);
                            }

                            execAsap ?
                                    dispatch() :
                                    resizeTimeout = setTimeout(dispatch, $special.threshold);
                        },
                        threshold: 150
                    };
                })();
            }
        }

        // Fix Drop Zone Div
        //
        // Private
        //
        function _fixDropZone() {

            var self = this;

            if (self._mutationObserver) {

                self.$msWebpartZone.each(function () {
                    var observer = new MutationObserver(function (mutations) {
                        _moveDropZone(mutations);
                    });

                    observer.observe(this, {
                        subtree: true,
                        childList: true,
                        attributes: false
                    });
                });
            } else {
                self.$msWebpartZone.on("DOMSubtreeModified", _moveDropZone);
            }
        }

        function _moveDropZone(obj) {
            var target = obj.target || obj.srcTarget || obj[0].target,
                $msDndDropbox = $('#ms-dnd-dropbox');

            if ($msDndDropbox.length > 0) {

                $msDndDropbox.css({
                    left: 0,
                    top: 0
                });

                /*
                if ($msDndDropbox.get(0) != target) {

                    console.log("mutation: ", SPBS.mutationObserver);

                    if (SPBS.mutationObserver) {

                        var observer = new MutationObserver(function (mutations, observer) {
                            _moveDropZone(mutations);
                        });

                        observer.observe($msDndDropbox.get(0), {
                            subtree: false,
                            childList: false,
                            attributes: true
                        });
                    }
                    else {
                        $msDndDropbox.on("DOMAttrModified", _moveDropZone);
                    }
                }
                */
            }

        }

        // Ensure that main content is at 12 columns when there is no side navigation
        // ie: Design Manager page

        function _bindBodySpans() {

            if (this.$sideNavBox.length > 0) {
                if (!this.$sideNavBox.is(':visible')) {
                    _fullWidth.call(this);
                } else {
                    if (this.$sideNavBoxMsCoreNavigation.length > 0 && $.trim(this.$sideNavBoxMsCoreNavigation.html()).length < 10) {
                        this.$sideNavBox.hide();
                        _fullWidth.call(this);
                    } else {
                        $('#DeltaPlaceHolderMain').parent('[class*="col-"]').css({
                            'width': ''
                        });
                    }
                }
            }
        }
        // end body spans

        function _fullWidth() {

            $('#DeltaPlaceHolderMain').parent('[class*="col-"]').css({
                'width': '100%'
            });
        }

        // triggered when a nav link is clicked
        // l = the .menu-item, either an anchor or span(header)
        function _DropTopNav(l, a) {

            var u, p;

            if (l.length > 0) {
                u = l.siblings('ul').eq(0);
                p = l.parent();
                if (u.length > 0) {
                    // if the sub menu is hidden, then show or visa-versa
                    if (p.hasClass('shown') || (a === 'o')) {
                        p.removeClass('shown');
                    } else {
                        p.addClass('shown');
                    }
                }
            }
        }
        // end top nav

        // triggered when a nav link is hovered
        // l = the li that has been hovered
        function _HoverTopNav(l, a) {

            var $m;

            if (l.length > 0) {
                $m = $('.navbar-toggle');
                if ($m.length > 0) {
                    // only down dropdown on hover if not mobile nav view
                    if ($m.css('display') === 'none') {
                        _DropTopNav(l.children('.menu-item').eq(0), a);
                    }
                }
            }
        }

        // Make top navigation responsive / touch friendly
        // Replaces the hover event for element that have dynamic children
        function _bindTopNav() {

            // grab top nav SP generated list
            var u = $('[role=navigation] ul.root');

            if (u.length > 0) {
                // loop through every nav item that has dynamic children
                u.find('li.dynamic-children').each(function () {

                    // get li's menu item, either a or span
                    var $this = $(this),
                        a = $this.children('.menu-item'),
                        s = a.children('span').eq(0),
                        t = s.children('span.menu-item-text').eq(0);

                    // override parent li hover event to show dropdown 
                    $this.hover(
                        function () { _HoverTopNav($(this), ''); },
                        function () { _HoverTopNav($(this), 'o'); }
                    );

                    if (a.is('span')) {
                        a.on('click', function () {
                            _DropTopNav($(this));
                            return false;
                        });

                        s.on('click', function () {
                            _DropTopNav($(this).parent());
                            return false;
                        });
                    } else {
                        a.on('click', function (e) {
                            // if click occurred inside of a text span, then redirect
                            if (((e.pageX >= t.offset().left) && (e.pageX <= (t.offset().left + t.outerWidth(true)))) &&
                                ((e.pageY >= t.offset().top) && (e.pageY <= (t.offset().top + t.outerHeight(true))))) {
                                return true;
                            } else {
                                _DropTopNav($(this).eq(0));
                            }
                            return false;
                        });

                        // need to trap link span too for some browsers
                        s.on('click', function (e) {
                            // if click occurred inside of a text span, then redirect
                            if (((e.pageX >= t.offset().left) && (e.pageX <= (t.offset().left + t.outerWidth(true)))) &&
                                ((e.pageY >= t.offset().top) && (e.pageY <= (t.offset().top + t.outerHeight(true))))) {
                                window.location.href = $(this).parent('a').eq(0).attr('href');
                            } else {
                                _DropTopNav($(this).parent('a').eq(0));
                            }
                            return false;
                        });
                    }
                });
            }
        }

        // Couple of fixes for overflow that don't in grid
        //
        function _fixLeftNav() {

            if (this.$sideNavBox.length > 0) {
                $('#sideNavBox').hover(function () {
                    $(this).css('overflow-x', '');
                });

                $('[data-toggle=offcanvas]').click(function () {
                    $('.row-offcanvas').toggleClass('active');
                });
            }
        }

        // specific browsers may require specific fixes
        function _bindBrowserStyles() {

            // IE 10 mobile issue with -ms-viewport (Thanks to starnell (https://www.codeplex.com/site/users/view/starnell) for the fix)
            if (("-ms-user-select" in document.documentElement.style) && (navigator.userAgent.match(/IEMobile\/10\.0/))) {
                var msViewportStyle = document.createElement("style");
                msViewportStyle.appendChild(document.createTextNode("@-ms-viewport{width:auto!important}"));
                document.getElementsByTagName("head")[0].appendChild(msViewportStyle);
            }
        }

        function _overrideTwitter() {

            var $s4workspace = $('#s4-workspace'),
                $s4bodyContainer = $('#s4-bodyContainer'),
                $msDesignerRibbon = $('#ms-designer-ribbon'),
                Affix = {};

            $.fn.carousel.Constructor.prototype.slide = function (type, next) {
                var $active = this.$element.find('.item.active')
                var $next = next || $active[type]()
                var isCycling = this.interval
                var direction = type == 'next' ? 'left' : 'right'
                var fallback = type == 'next' ? 'first' : 'last'
                var that = this

                if (!$next.length) {
                    if (!this.options.wrap) return
                    $next = this.$element.find('.item')[fallback]()
                }

                if ($next.hasClass('active')) return (this.sliding = false)

                var relatedTarget = $next[0]
                var slideEvent = $.Event('slide.bs.carousel', {
                    relatedTarget: relatedTarget,
                    direction: direction
                })
                this.$element.trigger(slideEvent)
                if (slideEvent.isDefaultPrevented()) return

                this.sliding = true

                isCycling && this.pause()

                if (this.$indicators.length) {
                    this.$indicators.find('.active').removeClass('active')
                    var $nextIndicator = $(this.$indicators.children()[this.getItemIndex($next)])
                    $nextIndicator && $nextIndicator.addClass('active')
                }

                var slidEvent = $.Event('slid.bs.carousel', { relatedTarget: relatedTarget, direction: direction }) // yes, "slid"
                if ($.support.transition && this.$element.hasClass('slide')) {
                    $next.addClass(type)
                    $next[0].offsetWidth // force reflow
                    $active.addClass(direction)
                    $next.addClass(direction)
                    $active
                      .one('bsTransitionEnd', function () {
                          $next.removeClass([type, direction].join(' ')).addClass('active')
                          $active.removeClass(['active', direction].join(' '))
                          that.sliding = false
                          setTimeout(function () {
                              that.$element.trigger(slidEvent)
                          }, 0)
                      })
                      .emulateTransitionEnd($active.css('transition-duration').slice(0, -1) * 1000)
                } else if (this.$element.hasClass('slide')) {
                    $active.animate({ left: (direction == 'right' ? '100%' : '-100%') }, 600, function () {
                        $active.removeClass('active');
                        that.sliding = false;
                        setTimeout(function () { that.$element.trigger(slidEvent); }, 0);
                    });
                    $next.addClass(type).css({ left: (direction == 'right' ? '-100%' : '100%') }).animate({ left: 0 }, 600, function () {
                        $next.removeClass(type).addClass('active');
                    });
                } else {
                    $active.removeClass('active')
                    $next.addClass('active')
                    this.sliding = false
                    this.$element.trigger(slidEvent)
                }

                isCycling && this.cycle()

                return this
            }

            //
            // Override the checkpostion/getPinnedOffset method for the affix plugin.
            // SharePoint uses a custom scroll bar that is not part
            // of the native scrolling ui. This adds support for
            // checking the position of the custom scroll bar.
            //
            // This is Twitter BS Code modified

            Affix.RESET = 'affix affix-top affix-bottom';
            $.fn.affix.Constructor.prototype.getPinnedOffset = function (orgEvent) {
                if (this.pinnedOffset) { return this.pinnedOffset; }

                var e = $.Event('affix.bs.affix'); // SharePoint
                this.$element.removeClass(Affix.RESET).addClass('affix').trigger(e); // SharePoint

                // SharePoint
                var scrollTop, position;
                if (typeof $s4workspace !== 'undefined') {
                    scrollTop = $s4workspace.scrollTop();
                    position = { top: this.$element.offset().top + scrollTop };
                } else {
                    scrollTop = $(window).scrollTop();
                    position = this.$element.offset();
                }

                this.$element.trigger(orgEvent);

                return (this.pinnedOffset = position.top - scrollTop);
            };
            $.fn.affix.Constructor.prototype.checkPosition = function () {

                //console.log("checkPosition");

                if (!this.$element.is(':visible') || this.checkingPosition)
                {
                    return;
                }

                var scrollHeight = $(document).height();
                var scrollTop = $(window).scrollTop();
                var position = this.$element.offset();
                var offset = this.options.offset;
                var offsetTop = offset.top;
                var offsetBottom = offset.bottom;
                var fixedHeader = 0;

                if (!this.elementHeight) {
                    this.elementHeight = this.$element.outerHeight();
                } else {
                    if (this.$element.outerHeight() > this.elementHeight) {
                        this.elementHeight = this.$element.outerHeight();
                    }
                }

                if (!this.scrollOffset) {
                    this.scrollOffset = 0;
                }

                // SharePoint
                if (typeof $s4workspace !== 'undefined') {
                    fixedHeader = $msDesignerRibbon.height() + parseInt($msDesignerRibbon.css('margin-top'), 10);
                    scrollTop = $s4workspace.scrollTop();
                    scrollHeight = $s4bodyContainer.height();
                    position.top += scrollTop;
                }

                if (typeof offset != 'object') { offsetBottom = offsetTop = offset; }

                if (typeof offsetTop == 'function') {
                    offsetTop = offset.top(this.$element);
                }
                if (typeof offsetBottom == 'function') {
                    offsetBottom = offset.bottom(this.$element);
                }

                //console.log('parent: ', this.$element.parent().offset().left);
                //console.log('position.left: ', position.left);
                //console.log("scrollTop: ", scrollTop, " this.unpin", this.unpin, " <= position.top: ", position.top);
                //console.log("scrollTop + this.unpin: ", scrollTop + this.unpin, " position.top: ", position.top);

                //console.log("position.top: ", position.top, " this.elementHeight", this.elementHeight, " this.unpin: ", this.unpin, " fixedHeader: ", fixedHeader, " this.scrollOffset: ", this.scrollOffset);
                //console.log("(position.top + this.elementHeight + this.unpin + fixedHeader) - this.scrollOffset: ", (position.top + this.elementHeight + this.unpin + fixedHeader) - this.scrollOffset, " >= scrollHeight - offsetBottom: ", scrollHeight - offsetBottom, ' = ', ((position.top + this.elementHeight + this.unpin) - this.scrollOffset >= scrollHeight - offsetBottom));

                //console.log("scrollTop: ", scrollTop,  " offsetTop: ", offsetTop);
                //console.log("scrollTop: ", scrollTop, " <= offsetTop: ", offsetTop, ' = ', (scrollTop <= offsetTop));

                var affix = (this.$element.parent().offset().left < -10 || this.$element.closest('.row-offcanvas.active').length > 0 || this.elementHeight + 95 > $('[data-name=ContentPlaceHolderMain]').height()) ? 'top' :
                            this.unpin != null && (scrollTop + this.unpin <= position.top) ? false :
                            offsetBottom != null && ((position.top + this.elementHeight + this.unpin) - this.scrollOffset >= scrollHeight - offsetBottom) ? 'bottom' :
                            offsetTop != null && (scrollTop <= offsetTop) ? 'top' : false;

                //console.log("affix: ", affix);

                if (this.affixed === affix) { return; }
                if (this.unpin != null) { this.$element.css('top', ''); }

                var affixType = 'affix' + (affix ? '-' + affix : '');
                var e = $.Event(affixType + '.bs.affix');

                this.$element.trigger(e);

                if (e.isDefaultPrevented()) { return; }

                this.affixed = affix;
                this.unpin = affix == 'bottom' ? this.getPinnedOffset(e) : null;

                this.$element
                  .removeClass(Affix.RESET)
                  .addClass(affixType)
                  .trigger($.Event(affixType.replace('affix', 'affixed')));

                if (affix == 'bottom') {
                    this.checkingPosition = true;
                    this.scrollOffset = ((scrollHeight - offsetBottom) - (position.top + this.elementHeight + this.unpin)) + (fixedHeader * 2);
                    this.$element.offset({ top: this.scrollOffset });
                } else {
                    this.scrollOffset = 0;
                }

                this.checkingPosition = false;
            };

            // Trigger a window scroll event on the workspace scroll
            $s4workspace.on('scroll', function () {
                $(window).triggerHandler("scroll.bs.affix.data-api");
            });
            $(document).on('FixRibbonAndWorkspaceDimensions', function () {
                $(window).triggerHandler("scroll.bs.affix.data-api");
            });

        }

        // Fix images in the blog if IE
        //
        function _fixImg() {

            var ua = window.navigator.userAgent,
                msie = ua.indexOf("MSIE ");

            if (msie > 0 || !!navigator.userAgent.match(/Trident\//)) {
                $('.ms-blog-postBody img').each(function () {
                    $(this).load(function () {
                        $(this).css('max-width', this.naturalWidth);
                    });
                });
            }
        }

        return {
            init: init,
        };
    }();

    Object.defineProperty(component.prototype, "mutationObserver", {
        get: function () {
            return this._mutationObserver;
        }
    });

    //
    // Doc Ready
    //
    $(function () {

        window.SPBS = new component();

        SPBS.init();
    });

})(window, jQuery);