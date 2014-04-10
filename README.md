sharepoint-bootstrap
====================

Twitter Bootstrap 3.1.1 adapted to work in SharePoint 2013/ Office 365



## Table of contents

 - [Quick start](#quick-start)
 - [Features](#features)
 - [Acknowledgement](#acknowledgement)


## Quick start

- [Download the latest release of Twitter Bootstrap](http://getbootstrap.com/).
- Add Bootstrap to your masterpage.
- Download this project and add bootstrap-custom.css and bootstrap-custom.js to your masterpage.
- Use Bootstrap's grid system in your masterpage and layouts.
- Use Bootstrap components anywhere you like in your pages.


## Features

Carousel - Supports animation in IE9. Bootstrap has dropped support for animation in older browsers like IE9.  
Affix - Bootstraps version does not work in SharePoint. We fixed it.  
Type: `Boolean`
Default: true

Whether to spawn task runs in a child process. Setting this option to `false` speeds up the reaction time of the watch (usually 500ms faster for most) and allows subsequent task runs to share the same context. Not spawning task runs can make the watch more prone to failing so please use as needed.

Example:
```js
var $affixNav = $('[data-spy=affix]'),
    $msDesignerRibbon = $('#ms-designer-ribbon');

if ($affixNav.length) {
    $affixNav.affix({
        offset: {
            top: function () {
                return (this.top = $('[role=heading]').outerHeight(true) + $('[role=menubar]').outerHeight(true));
            },
            bottom: function () {
                return (this.bottom = $('footer').outerHeight() - parseInt($('footer').css('margin-top'), 10));
            }
        }
    });

    $affixNav.on('affix.bs.affix', function (e) {
        $affixNav.addClass('col-md-2')
            .css({
                'top': 17 + ($msDesignerRibbon.height() + parseInt($msDesignerRibbon.css('margin-top'), 10)),
                'position': ''
            });
    });
    $affixNav.on('affix-top.bs.affix', function (e) {
        $affixNav.removeClass('col-md-2')
            .css({
                'top': 0,
                'position': ''
            });
    });
    $affixNav.on('affix-bottom.bs.affix', function (e) {
        $affixNav.removeClass('col-md-2');
    });

    $(document).on('FixRibbonAndWorkspaceDimensions', function (e) {
        if ($affixNav.hasClass('col-md-2')) {
            $affixNav.css({
                'top': 17 + ($msDesignerRibbon.height() + parseInt($msDesignerRibbon.css('margin-top'), 10))
            });
        }
    });
}
```

## Acknowledgement

Inspired by and based on the wonderful work by Eric Overfield and all the contributors
at the [Responsive SharePoint Codeplex project](https://responsivesharepoint.codeplex.com/).


