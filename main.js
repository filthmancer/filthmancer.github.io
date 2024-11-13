var json = 'https://filthmancer.github.io/puzzles.json';
var puzzles;

$(document).ready(function ()
{
    function defer(method)
    {
        if (window.jQuery)
            method();
        else
            setTimeout(function () { defer(method) }, 50);
    }

    defer(init)

    function init()
    {
        fetch(json)
            .then((response) => response.json())
            .then((json) => 
            {
                puzzles = json.puzzles;

                var now = moment().format("YYYYMMDD");
                console.log(now);

                var today = puzzles.find(p => p.date == now);
                console.log(today);
                if (today)
                {
                    var text = "#" + today.num;
                    text += " - " + moment().day() + " " + moment().date() + " " + moment().month();
                    $("header-index").text(text);
                }




                $("#button-play").bind('click', e =>
                {
                    window.location.href = "./pages/game.html";
                });
            });
    }
});