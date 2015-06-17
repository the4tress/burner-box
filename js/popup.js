var c = console;

document.addEventListener('DOMContentLoaded', init);
function init() {
    var cac = new CAC(localStorage["cacLogin"], localStorage["apiKey"]);
    cac.servers();
    c.log("cac", cac);
}


function CAC(login, key) {
    this.version = 'v1';
    this.url = 'https://panel.cloudatcost.com/api/v1/';

    // c.log(key);
    // c.log(login);

    if (!key) {
        notify('Missing API key.', 'error');
        return;
    }
    this.key = key;

    if (!login) {
        notify('Missing login.', 'error');
        return;
    }
    this.login = login;

    this.serverDetails = {
        show: [
            // "hostname",
            "label",
            "ip",
            "netmask",
            "gateway",
            "rootpass",
            "vncport",
            "vncpass",
            "sdate",
            "mode",
            "rdns",
            "rdnsdefault",

            // "sid",
            // "id",
            // "packageid",
            // "servername",
            // "lable",
            // "vmname",
            // "portgroup",
            // "servertype",
            // "templatescpu",
            // "cpuusage",
            // "ram",
            // "ramusage",
            // "storage",
            // "hdusage",
            // "status",
            // "panel_note",
            // "uid",
        ],
        pretty: {
            sid: "SID",
            id: "ID",
            packageid: "Package ID",
            servername: "Server Name",
            lable: "Lable",
            label: "Label",
            vmname: "VM Name",
            ip: "IP",
            netmask: "Netmask",
            gateway: "Gateway",
            portgroup: "Port Group",
            hostname: "Hostname",
            rootpass: "Root Pass",
            vncport: "VNC Port",
            vncpass: "VNC Pass",
            servertype: "Server Type",
            templatescpu: "Templates CPU",
            cpuusage: "CPU Usage",
            ram: "RAM",
            ramusage: "RAM Usage",
            storage: "Storage",
            hdusage: "HDD Usage",
            sdate: "Created",
            status: "Status",
            panel_note: "Panel Note",
            mode: "Mode",
            uid: "UID",
            rdns: "RDNS",
            rdnsdefault: "RDNS Default",
        }
    }
}

CAC.prototype.makeStats = function(params) {
    c.group("makeStats()");

    function progBar(style, stat) {
        return $("<div/>", {
            class: "progress-bar progress-bar-" + styles[style],
            style: "width: " + stat + "%",
            "data-toggle": "tooltip",
            title: style.toUpperCase() + ": " + stats[style] + "%",
            text: stats[style] + "%"
        });
    }

    var stats = {
            cpu: parseInt(params.cpuusage),
            ram: Math.round((params.ramusage / params.ram) *100),
            hdd: Math.round((params.hdusage / params.storage) *100)
        },
        styles = {
            cpu: "info",
            ram: "warning",
            hdd: "danger"
        },

        sm = (stats.cpu < stats.ram
            ? (stats.cpu < stats.hdd
                ? "cpu"
                : "hdd")
            : (stats.ram < stats.hdd
                ? "ram"
                : "hdd")),

        md = (stats.cpu > stats.ram
            ? (stats.cpu < stats.hdd
                ? "cpu"
                : (stats.hdd > stats.ram
                    ? "hdd"
                    : "ram"))
            : (stats.cpu > stats.hdd
                ? "cpu"
                : "hdd")),

        lg = (stats.cpu > stats.ram
            ? (stats.cpu > stats.hdd
                ? "cpu"
                : "hdd")
            : (stats.ram > stats.hdd
                ? "ram"
                : "hdd"));

    $small = progBar(sm, stats[sm]);
    $medium = progBar(md, (stats[md] - stats[sm]));
    $large = progBar(lg, (stats[lg] - stats[md]));

    var $progress = $("<div/>", { class: "progress" })
        .append($small).append($medium).append($large);

    c.groupEnd();

    c.log("stats", stats);

    return $progress;
};

CAC.prototype.addBox = function(params) {
        c.group("ui.addBox()");
        c.log(params);

        var $this = this;

        var status = {
            "Powered On": "success",
            "Powered Off": "danger"
        };

        var $serverList = $("#serverList"),
            boxTools = [
                '<span role="button" data-toggle="collapse" href="#cac-' + params.id + '" aria-expanded="false">',
                    (params.label === null ? params.servername : params.label),
                '</span>',
                '<div class="btn-group box-tools">',
                    '<i class="cac-cloud" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></i>',
                    '<ul class="dropdown-menu dropdown-menu-right">',
                        '<li><a href="#">Action</a></li>',
                        '<li><a href="#">Another action</a></li>',
                        '<li><a href="#">Something else here</a></li>',
                        '<li role="separator" class="divider"></li>',
                        '<li><a href="#">Separated link</a></li>',
                    '</ul>',
                '</div>'
                // '<span class="box-tools">',
                //     '<i class="cac-cloud"></i>',
                // '</span>'
            ].join(''),

            $wrapper = $("<div/>", {
                class: "panel panel-" + status[params.status],
                html: $("<div/>", {
                    class: "panel-heading",
                    html: boxTools
                })
            }),

            $content = $("<div/>", {
                id: 'cac-' + params.id,
                class: "panel-collapse collapse server-details",
                "aria-expanded": false
            }).appendTo($wrapper),

            $contentItems = $("<ul/>", { class: "list-group" }).appendTo($content);

        var $stats = $("<li/>", {
            class: "list-group-item",
            html: $this.makeStats(params)
        }).appendTo($content);


        for (item in this.serverDetails.show) {
            var itm = this.serverDetails.show[item];
            if (itm in params) {
                $content.append($("<li/>", {
                    class: "list-group-item",
                    html: "<strong>" + this.serverDetails.pretty[itm] + ":</strong> " + params[itm]
                }));
            }
        }

        $(function() { $("[data-toggle='tooltip']").tooltip(); });


        $serverList.append($wrapper);

        c.groupEnd();
};

CAC.prototype.makeRequest = function(action, params) {
    c.group("makeRequest()");

    actions = {
        servers: "listservers.php",
        templates: "listtemplates.php",
        tasks: "listtasks.php",
        power: "powerop.php",
        rename: "renameserver.php",
        rdns: "rdns.php",
        console: "console.php",
        runMode: "runmode.php",

        build: "build.php",
        delete: "delete.php",
        resources: "resources.php"
    };

    var defaults = {
        method: "GET",
        url: this.url + actions[action] + "?key=" + this.key + "&login=" + this.login,
        success: function(data) { c.info(data); },
        fail: function(data) { c.warn(data); }
    };

    $.ajax($.extend({}, defaults, params));

    c.groupEnd();
};

CAC.prototype.servers = function(cb, err) {
    c.group("servers()");

    var $this = this;

    params = {
        success: function(data) {
            data = JSON.parse(data);
            c.info("data", data.data);

            for (item in data.data) {
                $this.addBox(data.data[item]);
            }
        }
    };

    this.makeRequest('servers', params);

    c.groupEnd();
};
