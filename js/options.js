
function init() {
    $("#saveOptions")
        .on("click", function() {
            localStorage["cacLogin"] = $("#cacLogin").val();
            localStorage["apiKey"] = $("#apiKey").val();
        });

    if (localStorage["cacLogin"]) {
        $("#cacLogin").val(localStorage["cacLogin"]);
    }

    if (localStorage["apiKey"]) {
        $("#apiKey").val(localStorage["apiKey"]);
    }
}

document.addEventListener('DOMContentLoaded', init);
