//
//
//
//
//

(function (window, $) {
    "use strict";

    var component = function () {

        this.mutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        this.eventListenerSupported = window.addEventListener;

        // Cache the zones
        this.$msWebpartZone = $('.ms-webpart-zone');
    }

    component.prototype = function () {

        // Init all Bootstrap helpers
        //
        // Public
        //
        function init() {

            var self = this;

            _fixDropZone.call(self);
            _bindBrowserStyles.call(self);
            _bindTopNav.call(self);
            _bindBodySpans.call(self);
            _overrideTwitter.call(self);
        }

        // Fix Drop Zone Div
        //
        // Private
        //
        function _fixDropZone() {

            var self = this;

            if (self.mutationObserver) {

                self.$msWebpartZone.each(function () {
                    var observer = new MutationObserver(function (mutations, observer) {
                        _moveDropZone(mutations);
                    });

                    observer.observe(this, {
                        subtree: true,
                        childList: true,
                        attributes: false
                    });
                });
            }
            else {
                self.$msWebpartZone.on("DOMSubtreeModified", _moveDropZone);
            }
        }

        function _moveDropZone(obj) {
            var target = obj.target || obj.srcTarget || obj[0].target;

            $('#ms-dnd-dropbox').css({
                left: 0,
                top: 0
            })
        }

        // Ensure that main content is at 12 columns when there is no side navigation
        // ie: Design Manager page

        function _bindBodySpans() {
            var $sideNavBox = $('#sideNavBox'),
                $sideNavBoxMsCoreNavigation;

            if ($sideNavBox.length > 0) {
                if ($sideNavBox.css('display') == 'none') {
                    _fullWidth();
                }
                else {
                    $sideNavBoxMsCoreNavigation = $('#sideNavBox .ms-core-navigation');
                    if ($sideNavBoxMsCoreNavigation.length > 0 && $.trim($sideNavBoxMsCoreNavigation.html()).length < 10) {
                        _fullWidth();
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
                    if (p.hasClass('shown') || (a == 'o')) {
                        p.removeClass('shown');
                    }
                    else {
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
                    if ($m.css('display') == 'none')
                        _DropTopNav(l.children('.menu-item').eq(0), a);
                }
            }
        }


        // Make top navigation responsive / touch friendly
        // Replaces the hover event for element that have dynamic children
        function _bindTopNav() {

            // grab top nav SP generated list
            var u = $('[data-role=navigation] ul.root');

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
                        a.on('click', function (e) {
                            _DropTopNav($(this));
                            return false;
                        });

                        s.on('click', function (e) {
                            _DropTopNav($(this).parent());
                            return false;
                        });
                    }
                    else {
                        a.on('click', function (e) {
                            // if click occurred inside of a text span, then redirect
                            if (((e.pageX >= t.offset().left) && (e.pageX <= (t.offset().left + t.outerWidth(true)))) &&
                                ((e.pageY >= t.offset().top) && (e.pageY <= (t.offset().top + t.outerHeight(true))))) {
                                return true;
                            }
                            else
                                _DropTopNav($(this).eq(0));
                            return false;
                        });

                        // need to trap link span too for some browsers
                        s.on('click', function (e) {
                            // if click occurred inside of a text span, then redirect
                            if (((e.pageX >= t.offset().left) && (e.pageX <= (t.offset().left + t.outerWidth(true)))) &&
                                ((e.pageY >= t.offset().top) && (e.pageY <= (t.offset().top + t.outerHeight(true))))) {
                                window.location.href = $(this).parent('a').eq(0).attr('href');
                            }
                            else {
                                _DropTopNav($(this).parent('a').eq(0));
                            }
                            return false;
                        });

                    }
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

                if ($next.hasClass('active')) return this.sliding = false

                var e = $.Event('slide.bs.carousel', { relatedTarget: $next[0], direction: direction })
                this.$element.trigger(e)
                if (e.isDefaultPrevented()) return

                this.sliding = true

                isCycling && this.pause()

                if (this.$indicators.length) {
                    this.$indicators.find('.active').removeClass('active')
                    this.$element.one('slid.bs.carousel', function () {
                        var $nextIndicator = $(that.$indicators.children()[that.getActiveIndex()])
                        $nextIndicator && $nextIndicator.addClass('active')
                    })
                }

                if ($.support.transition && this.$element.hasClass('slide')) {
                    $next.addClass(type)
                    $next[0].offsetWidth // force reflow
                    $active.addClass(direction)
                    $next.addClass(direction)
                    $active
                      .one($.support.transition.end, function () {
                          $next.removeClass([type, direction].join(' ')).addClass('active')
                          $active.removeClass(['active', direction].join(' '))
                          that.sliding = false
                          setTimeout(function () { that.$element.trigger('slid.bs.carousel') }, 0)
                      })
                      .emulateTransitionEnd($active.css('transition-duration').slice(0, -1) * 1000)
                } else if (this.$element.hasClass('slide')) {
                    $active.animate({ left: (direction == 'right' ? '100%' : '-100%') }, 600, function () {
                        $active.removeClass('active')
                        that.sliding = false
                        setTimeout(function () { that.$element.trigger('slid.bs.carousel') }, 0)
                    })
                    $next.addClass(type).css({ left: (direction == 'right' ? '-100%' : '100%') }).animate({ left: 0 }, 600, function () {
                        $next.removeClass(type).addClass('active')
                    })
                } else {
                    $active.removeClass('active')
                    $next.addClass('active')
                    this.sliding = false
                    this.$element.trigger('slid.bs.carousel')
                }

                isCycling && this.cycle()

                return this
            }

        }

        return {
            init: init,
        };
    }();

    //
    // Doc Ready
    //
    $(function () {

        window.SPBS = new component();

        SPBS.init();
    });

})(window, jQuery);