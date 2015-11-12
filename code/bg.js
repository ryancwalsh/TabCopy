chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    chrome.pageAction.show(tabId);
});

var allowClickProcessing = true;
var clickCount = 0;
var tabCount = 0;

var clickTimer = null;
var tooltipTimer = null;
var iconTimer = null;

var b = document.getElementById('b');

chrome.contextMenus.create({
    title: 'Copy',
    contexts: ['link', 'page'],
    onclick: function(info, t) {
        allowClickProcessing = false;
        copyWots(info.linkUrl ? [{
            url: info.linkUrl,
            highlighted: true
        }] : [t], 1, t)
    }
});

chrome.pageAction.onClicked.addListener(function(t) {
    if (allowClickProcessing) {
        //        notifyRunning(t);

        clearTimeout(clickTimer);

        clickCount++;

        clickTimer = setTimeout(doCopy, (clickCount > 2 ? 0 : 300), t, clickCount);
    }
});

function doCopy(t, clicks) {
    allowClickProcessing = false;

    //chrome.pageAction.hide(t.id);

    //console.log(clickCount);

    if (t) {
        try {
            if (clicks > 2) {
                chrome.windows.getAll({
                    populate: true
                }, function(wots) {
                    copyWots(wots, clicks, t);
                });
            } else {
                chrome.tabs.getAllInWindow(null, function(wots) {
                    copyWots(wots, clicks, t);
                });
            }
        } catch (err) {
            notifyError(t);
        }
    } else {
        notifyError(t);
    }
}

function copyWots(wots, clicks, t) {
    buffer_clear();

    var wot;
    for (var i = 0; i < wots.length; i++) {
        wot = wots[i];
        if (wot.tabs) { // window
            for (var j = 0; j < wot.tabs.length; j++) {
                buffer_appendTabInfo(wot.tabs[j]);
            }
        } else { // tab
            if (wot.highlighted && clicks === 1 || clicks === 2) {
                buffer_appendTabInfo(wot);
            }
        }
    }

    if (localStorage.getItem('tab-format') === 'json') {
        b.value = '[' + b.value + ']';
    }

    if (buffer_copyToClipboard()) {
        notifyOK(t, clicks);
    } else {
        notifyError(t);
    }
}

function buffer_clear() {
    b.value = '';
    tabCount = 0;
}

function buffer_copyToClipboard() {
    if (b.value.length > 0) {
        b.select();
        document.execCommand('copy');
        return true;
    }

    return false;
}

function buffer_appendTabInfo(t) {
    if (b.value.length) {
        b.value += tabDelim();
    }

    b.value += tabText(t);
    tabCount++;
}

function tabDelim() {
    switch (localStorage.getItem('tab-format')) {

        case 'txt1Line':
        case 'txtUrlOnly':
        case 'markdown':
        case 'bbcode':
        case 'html':

            return '\n';

        case 'json':

            return ',\n';

    }

    // txt2Lines
    return '\n\n';
}

function tabText(t) {
    switch (localStorage.getItem('tab-format')) {

        case 'txt1Line':

            return (t.title && t.title.trim() ? t.title + (localStorage.getItem('tab-format-delimiter') || ':  ') : '') + t.url;

        case 'txtUrlOnly':

            return t.url;

        case 'json':

            return '{' + (t.hasOwnProperty('title') ? '\n   "title": "' + t.title + '",' : '') + '\n   "url": "' + t.url + '" \n}';

        case 'markdown':

            return '[' + (t.title && t.title.trim() ? t.title : t.url) + '](' + t.url + ')';

        case 'bbcode':

            if (t.title && t.title.trim()) {
                return '[url=' + t.url + ']' + t.title + '[/url]';
            }

            return '[url]' + t.url + '[/url]';

        case 'html':

            return '<a href="' + t.url + '" target="_blank">' + (t.title && t.title.trim() ? t.title : t.url) + '</a>';

    }

    // txt2Lines
    return (t.title && t.title.trim() ? t.title + '\n' : '') + t.url;
}

// function notifyRunning(t) {
//     chrome.pageAction.setIcon({
//         tabId: t.id,
//         path: 'img/icon19.png'
//     });
// }

function notifyOK(t, inType) {
    if (!t.id) {
        return;
    }

    clearTimeout(tooltipTimer);
    clearTimeout(iconTimer);

    clickCount = 0;
    allowClickProcessing = true;

    chrome.pageAction.setTitle({
        tabId: t.id,
        title: (inType === 1 ? 'Copied ' + tabCount + ' selected ' + (tabCount === 1 ? 'tab' : 'tabs') : (inType === 2 ? 'Copied ' + tabCount + ' window ' + (tabCount === 1 ? 'tab' : 'tabs') : 'Copied ' + tabCount + ' session ' + (tabCount === 1 ? 'tab' : 'tabs')))
    });
    tooltipTimer = setTimeout(chrome.pageAction.setTitle, 1000, {
        tabId: t.id,
        title: ''
    });

    chrome.pageAction.setIcon({
        tabId: t.id,
        path: 'img/icon19ok.png'
    });
    //chrome.pageAction.show(t.id);
    iconTimer = setTimeout(chrome.pageAction.setIcon, 1000, {
        tabId: t.id,
        path: "img/icon19.png"
    });
}

function notifyError(t) {
    if (!t.id) {
        return;
    }

    clickCount = 0;
    allowClickProcessing = true;

    chrome.pageAction.setIcon({
        tabId: t.id,
        path: 'img/icon19error.png'
    });
}
