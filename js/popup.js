var c = console,
    cac;

document.addEventListener('DOMContentLoaded', init);
function init() {
    cac = new CAC(localStorage["cacLogin"], localStorage["apiKey"]);
    cac.servers();
    c.log("cac", cac);
}


function CAC(login, key) {
    c.group("CAC()");

    this.version = 'v1';
    this.url = 'https://panel.cloudatcost.com/api/v1/';

    this.serverList = new Object();

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

    // sets this.pro to account resources
    this.resources();

    c.groupEnd();
}

CAC.prototype.request = function(action, params) {
    c.group("CAC.request()");

    actions = {
        servers: "listservers.php",
        templates: "listtemplates.php",
        tasks: "listtasks.php",
        power: "powerop.php",
        rename: "renameserver.php",
        rdns: "rdns.php",
        console: "console.php",
        runMode: "runmode.php",

        build: "cloudpro/build.php",
        delete: "cloudpro/delete.php",
        resources: "cloudpro/resources.php"
    };

    var auth = "key=" + this.key + "&login=" + this.login;
    var defaults = {
        method: "GET",
        url: this.url + actions[action],
        success: function(data) { c.info(data); },
        fail: function(data) { c.warn(data); }
    };

    var ajaxParams = $.extend({}, defaults, params);

    if (ajaxParams.method == "GET") { ajaxParams.url += "?" + auth; }
    if (ajaxParams.method == "POST") { ajaxParams.data = auth + "&" + params.data; }

    c.log("ajaxParams", ajaxParams);

    $.ajax(ajaxParams);

    c.groupEnd();
};

CAC.prototype.servers = function(cb, err) {
    c.group("CAC.servers()");

    var $this = this;

    params = {
        success: function(data) {
            data = JSON.parse(data);
            c.info("data", data.data);

            for (item in data.data) {
                $this.serverList[data.data[item].sid] = new Server(data.data[item]);
                $this.serverList[data.data[item].sid].add();
                // $this.addBox(data.data[item]);
            }

            c.log("$this.serverList", $this.serverList);
        }
    };

    this.request('servers', params);

    c.groupEnd();
};

CAC.prototype.resources = function() {
    c.group("CAC.resources()");

    var $this = this,
        params = {
            success: function(data) {
                $this.pro = JSON.parse(data).data;

                var $cpu = $("#cac-pro-cpu"),
                    $ram = $("#cac-pro-ram"),
                    $hdd = $("#cac-pro-hdd");

                var cpu = Math.round(($this.pro.used.cpu_used / $this.pro.total.cpu_total) *100),
                    ram = Math.round(($this.pro.used.ram_used / $this.pro.total.ram_total) *100),
                    hdd = Math.round(($this.pro.used.storage_used / $this.pro.total.storage_total) *100);

                $cpu
                    .attr("aria-valuenow", cpu)
                    .css({width: cpu + "%" })
                    .text("CPU: " + $this.pro.used.cpu_used);
                $ram
                    .attr("aria-valuenow", ram)
                    .css({width: ram + "%" })
                    .text("RAM: " + $this.pro.used.ram_used);
                $hdd
                    .attr("aria-valuenow", hdd)
                    .css({width: hdd + "%" })
                    .text("HDD: " + $this.pro.used.storage_used + "GB");

                c.info("data", data);
            }
        };

    this.request('resources', params);

    c.groupEnd();
}

function Server(params) {
    c.group("Server()");

    this.params = params;

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

            "sid",
            "id",
            "packageid",
            "servername",
            "lable",
            "vmname",
            "portgroup",
            "servertype",
            "templatescpu",
            "cpuusage",
            "ram",
            "ramusage",
            "storage",
            "hdusage",
            "status",
            "panel_note",
            "uid",
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
    };

    c.groupEnd();
}

Server.prototype.add = function() {
    c.group("Server.add()");
    c.log("this.params", this.params);

    var $this = this;

    var status = {
        "Powered On": {
            style: "success",
            icon: "cac-cloud-play"
        },
        "Powered Off": {
            style: "danger",
            icon: "cac-cloud-pause"
        },
        "Pending On": {
            style: "warning",
            icon: "cac-refresh"
        }
    };


    // Define the elements
    var $serverList = $("#serverList"),
        $wrapper = $("<div/>", {
                class: "panel panel-" + status[$this.params.status].style,
            }),
        $header = $("<div/>", {
                class: "panel-heading",
                "data-box-sid": $this.params.sid
            }),
        $headerTitle = $("<span/>", {
                role: "button",
                "data-toggle": "collapse",
                href: "#cac-" + $this.params.id,
                "aria-expanded": false,
                text: ($this.params.label === null ? $this.params.servername : $this.params.label)
            }),
        $headerTools = $("<div/>", {
                class: "btn-group box-tools",
                html: $("<i/>", {
                    class: status[$this.params.status].icon,
                    type: "button",
                    "data-toggle": "dropdown",
                    "aria-haspopup": true,
                    "aria-expanded": false
                })
            }),
        $headerToolsMenu = $("<ul/>", {
                class: "dropdown-menu dropdown-menu-right",
            }),
        $headerToolsPowerOn = $("<li/>", {
                html: $("<a/>", {
                    href: "#",
                    "data-box-power": "poweron",
                    text: "Power On"
                })
            }),
        $headerToolsPowerOff = $("<li/>", {
                html: $("<a/>", {
                    href: "#",
                    "data-box-power": "poweroff",
                    text: "Power Off"
                })
            }),
        $headerToolsPowerReset = $("<li/>", {
                html: $("<a/>", {
                    href: "#",
                    "data-box-power": "reset",
                    text: "Reset"
                })
            }),
        $content = $("<div/>", {
                id: 'cac-' + $this.params.id,
                class: "panel-collapse collapse server-details",
                "aria-expanded": false
            }),
        $contentItems = $("<ul/>", {
                class: "list-group"
            }),

        $stats = $("<li/>", {
                class: "list-group-item",
                html: $this.stats($this.params)
            });

    // Build the objects
    $wrapper
        .append($header);

    $header
        .append($headerTitle)
        .append($headerTools);

    $headerTools
        .append($headerToolsMenu);

    $headerToolsMenu
        .append($headerToolsPowerOn)
        .append($headerToolsPowerOff)
        .append($headerToolsPowerReset);

    $wrapper
        .append($content);

    $content
        .append($stats)
        .append($contentItems)

    c.log("$this.serverDetails.show", $this.serverDetails.show);

    for (item in $this.serverDetails.show) {
        var itm = $this.serverDetails.show[item];
        if (itm in $this.params) {
            $content.append($("<li/>", {
                class: "list-group-item",
                html: "<strong>" + $this.serverDetails.pretty[itm] + ":</strong> " + $this.params[itm]
            }));
        }
    }

    $serverList.append($wrapper);

    // UI Actions
    $(function() { $("[data-toggle='tooltip']").tooltip(); });

    $headerTools
        .on("click", "[data-box-power]", function() {
            c.log($(this).data("boxPower"));
            $this.power($(this).data("boxPower"));
        });

    c.groupEnd();
};

Server.prototype.stats = function(params) {
    c.group("Server.stats()");

    var $this = this;

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

Server.prototype.power = function(action, sid) {
    // action = poweron || poweroff || reset
    c.group('Server.power()');

    params = {
        method: "POST",
        data: "sid=" + this.params.sid + "&action=" + action
    }

    cac.request("power", params);

    c.groupEnd();
}

