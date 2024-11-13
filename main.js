var json = 'https://filthmancer.github.io/puzzles.json';
var puzzles;

var footer_text_format = "Edited by {0},<br>{1}";
var moment_format = "ddd DD MMM"

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
        fetch(json, { cache: "reload" })
            .then((response) => response.json())
            .then((json) => 
            {
                puzzles = json.puzzles;

                var index = irand(puzzles.length);
                var puzzle = puzzles[index];//puzzles.find(p => p.id == now);

                if (puzzle)
                {
                    var today = moment(puzzle.id);
                    var backup = json.backup[today.day()];

                    var baseColor = puzzle.color ?? backup[2];
                    document.documentElement.style.setProperty('--base', baseColor);

                    var text = "#" + puzzle.num;
                    text += " - " + today.format("ddd DD MMM");
                    //moment().format("ddd DD MMM");
                    text += " - " + (puzzle.category ?? backup[1]);
                    $("#header-index").text(text.toUpperCase());

                    var link = puzzle.editor.link(puzzle.editor_link);

                    text = footer_text_format.format(link, puzzle.editor_blurb);
                    $("#footer-text").html(text);
                }



                $("#button-play").bind('click', e =>
                {
                    window.location.href = "./pages/game.html";
                });
            });
    }
});

String.prototype.format = String.prototype.format ||
    function ()
    {
        "use strict";
        var str = this.toString();
        if (arguments.length)
        {
            var t = typeof arguments[0];
            var key;
            var args = ("string" === t || "number" === t) ?
                Array.prototype.slice.call(arguments)
                : arguments[0];

            for (key in args)
            {
                str = str.replace(new RegExp("\\{" + key + "\\}", "gi"), args[key]);
            }
        }

        return str;
    };

function irand(max)
{
    return Math.floor(Math.random() * max);
}

function shuffleArray(array)
{
    for (var i = array.length - 1; i >= 0; i--)
    {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}