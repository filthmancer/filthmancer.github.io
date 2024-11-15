var json_add = 'https://filthmancer.github.io/puzzles.json';
var backup;
var settings;

var footer_text_format = "Edited by {0},<br>{1}.";
var moment_format = "ddd DD MMM"

var puzzles;
var puzzle_today;
var questions;
var question_index = 0;
var question_state = () => questions[question_index][1];
var answers = []

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
        fetch(json_add, { cache: "reload" })
            .then((response) => response.json())
            .then((json) => 
            {
                init_data(json);
                init_home();
            });
    }
});

function init_data(json)
{
    puzzles = json.puzzles;

    var index = irand(puzzles.length);
    puzzle_today = puzzles[index];
    backup = json.backup;
    settings = json.settings;
    //puzzle_today = puzzles.find(p => p.id == now);
}

function init_home()
{
    if (puzzle_today)
    {
        var today = moment(puzzle_today.id);
        var today_backup = backup[today.day()];

        var baseColor = puzzle_today.color ?? today_backup[2];
        document.documentElement.style.setProperty('--color-base', baseColor);

        $("body").attr("class", "bgColorOn");

        var num = today.subtract(settings).days();
        var text = "#" + num.toString().padStart(3, '0')
        text += " - " + today.format("ddd DD MMM");
        //moment().format("ddd DD MMM");
        text += " - " + (puzzle_today.category ?? today_backup[1]);
        $("#header-index").text(text.toUpperCase());

        var link = puzzle_today.editor.link(puzzle_today.editor_link);

        text = footer_text_format.format(link, puzzle_today.editor_blurb);
        $("#footer-text").html(text);

        $('#home').fadeTo('slow', 1, function ()
        {
            $("#button-play").bind('click', e =>
            {
                init_game();
                $("body").attr("class", "bgColorOff");
                $('#home').fadeTo('fast', 0, () =>
                {
                    $("#home").addClass("ignore-input");
                    $('#game').fadeTo('fast', 1, () =>
                    {
                        $("#game").removeClass("ignore-input");
                    });
                })
            });
        });
    }
}
function init_game()
{
    $("#button-real").click(function ()
    {
        answerQuestion(true)
    });
    $("#button-fake").click(function ()
    {
        answerQuestion(false)
    });
    $("#button-new-puzzle").click(() =>
    {
        getnewpuzzle();
    });
    $("#button-share").click(() =>
        {
            share();
        });

    $("header").addClass("ingame");
    getnewpuzzle();
}
function getnewpuzzle()
{
    var puzzle_index = irand(puzzles.length)
    puzzle_today = puzzles[puzzle_index];

    questions = puzzle_today.questions;
    shuffleArray(questions);
    question_index = 0;

    answers = [];
    $("#topic-container #pretext").attr("class", "pretext shown");
    $("#pretext").text("is this a real");
    set_button_state(true);
    updateQuestion();
    updateList();

}

function share()
{

}

function updateQuestion()
{
    if (question_index < questions.length)
    {
        $("#topic").text(puzzle_today.topic + "?");
        $("#question").text(questions[question_index][0]);
        $("#box .box-overlay").hide();
        $("#question").attr("class", "box-text")
    }
    else
    {
        endGame();
    }

}

function updateList()
{
    for (let index = 0; index < questions.length; index++)
    {
        let e = questions[index];
        let answered = answers.length > index;
        let name = '#q' + index;

        $(name).attr("class", answered ? "shown":"hidden");
        $(name + " #title h2").text(e[0]);
        $(name + " #correct img").css("visibility", answered  && answers[index] == e[1]?"visible":"hidden" )
        $(name + " #fake img").css("visibility",answered && !e[1]?"visible":"hidden" )
        /* 
        title.attr("class", answered ? "title shown" : "title hidden");

        var fake = $(name + " #fake");
        fake.text(answered && !e[1] ? "FAKE" : "");
        fake.attr("class", "fake " + (answered ? "shown" : "hidden"));

        var correct = $(name + " #correct");
        correct.text(answered ? (answers[index] == e[1]) : "");
        correct.attr("class", (answered ? "shown" : "hidden")); */
    }
}
function answerQuestion(answer)
{
    var isReal = question_state();
    answers.push(answer);
    question_index++;
    var box = $("#box")
    var c = "box box-answer-" + (isReal ? "real" : "fake");
    box.attr("class", c)
    if (!isReal)
        $("#question").attr("class", "box-text box-answer-text")

    $("#button-fake").attr("disabled", "disabled")
    $("#button-real").attr("disabled", "disabled")
    setTimeout(() =>
    {
        document.documentElement.style.setProperty('--overlay-sign', isReal ? -1:1);
        // document.documentElement.style.setProperty('--overlay-rotation', isReal ? "-9deg" : "9deg");
        // document.documentElement.style.setProperty('--overlay-offset-x', isReal ? "50px" : "-50px");
        $("#box .box-overlay").show();
        $("#box .box-overlay").text(isReal ? "real" : "fake");
        setTimeout(() =>
        {
            box.attr("class", c + "-exit")
            setTimeout(() =>
            {
                box.attr("class", "box box-arrive");
                $("#button-fake").removeAttr("disabled")
                $("#button-real").removeAttr("disabled")

                updateQuestion();
                updateList();
            }, 1000);
        }, 1000);
    }, 500);
}

function endGame()
{
    $("#topic-container #pretext").attr("class", "pretext hidden");
    $("#box .box-overlay").hide();
    $("#question").attr("class", "box-text")
    $("#pretext").text("nice work finding the real");
    $("#topic-container #topic").text(puzzle_today.topic + "s");
    
    var correct = 0;
    answers.forEach((a, index) =>
    {
        if (a == questions[index][1])
            correct++;
    });
    $("#question").text(correct + "/" + questions.length)
    set_button_state(false);


}
function set_button_state(active)
{
    if (active)
    {
        $("#button-new-puzzle").addClass("hidden-button")
        $("#button-share").addClass("hidden-button")
        $("#button-fake").removeClass("hidden-button")
        $("#button-real").removeClass("hidden-button")
    }
    else
    {
        // $("#button-new-puzzle").removeClass("hidden-button")
        $("#button-share").removeClass("hidden-button")
        $("#button-fake").addClass("hidden-button")
        $("#button-real").addClass("hidden-button")
    }

}

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