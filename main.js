var json_add = 'https://filthmancer.github.io/puzzles.json';
var backup;
var json;
var settings;

var strings =
{
    footer_text_format: "Edited by {0},<br>{1}.",
    moment_format: "ddd DD MMM",
    header_text_format: "#{0} — {1} — {2}",
    category_anim_format: "https://filthmancer.github.io/assets/anims/{0}.svg",
    blurb: "are these real",
}

var bg_settings = {
    "home": "--color-base",
    "game": "--color-cream",
    "about": "--color-cream"
};

var pageCallback =
{
    "game": init_game,
    "about": init_about,
}

var puzzles;
var puzzle_today;
var questions;
var question_index = 0;
var question_state = () => questions[question_index][1];
var answers = []

var puzzle_override;
var page_active, page_active_last;

jQuery(document).ready(function ()
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
            .then((_json) => 
            {
                json = _json;
                init_data(json);
                init_home();
            });
    }
});

function init_data(json)
{
    puzzles = json.puzzles;

    backup = json.backup;
    settings = json.settings;

    puzzle_today = puzzles.find(p => p.id == moment().format(strings.moment_format));
    if (puzzle_today == null)
    {
        var index = irand(puzzles.length);
        puzzle_today = puzzles[index];
    }

    if (puzzle_override)
        puzzle_today = puzzles.find(p => p.id == puzzle_override);

    $("#button-play").bind('click', e =>
    {
        move_to_page("game");
    });

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
}

function init_home()
{
    if (puzzle_today)
    {
        var today = moment(puzzle_today.id);
        var today_backup = backup[today.day()];

        var baseColor = puzzle_today.color ?? today_backup[2];
        document.documentElement.style.setProperty('--color-base', baseColor);

        var epoch = moment(settings.epoch);
        var num = moment.duration(today.diff(epoch)).asDays() + 1;
        num = num.toString().padStart(3, '0')
        var category = (puzzle_today.category ?? today_backup[1]);
        var text = strings.header_text_format.format(num,
            today.format(strings.moment_format),
            category
        );
        $("#header-index").text(text.toUpperCase());

        var link = puzzle_today.editor.link(puzzle_today.editor_link);
        text = strings.footer_text_format.format(link, puzzle_today.editor_blurb);
        $("#footer-text").html(text);

        logo_loaded = false;
        fetch(strings.category_anim_format.format(category.toLowerCase()))
            .then(img => 
            {
                logo_loaded = true;
                if (img.ok)
                    $(".anim").attr("data", strings.category_anim_format.format(category.toLowerCase()));
            })
            .catch((error) =>
            {
                logo_loaded = true;
                console.log("logo loaded - catch")
            });


        promiseWhen(_ => logo_loaded == true)
            .then(() =>
            {
                move_to_page("home")
            });
    }
}

function toggle_pages(a, b)
{
    var _a = $("#" + a);
    if (page_active[0] != _a[0])
        move_to_page(a);
    else
    {
        if (b == null)
            b = page_active_last.attr("id");
        move_to_page(b);
    }
}

function move_to_page(pageID)
{
    console.log("moving to " + pageID);
    var p = $("#" + pageID)[0];
    if (p == null)
    {
        console.log("error finding page " + pageID);
        return;
    }
    if (page_active)
        page_active.toggleClass("shown hidden");

    page_active_last = page_active;
    page_active = $("#" + pageID);

    page_active.toggleClass("hidden shown");

    var color = bg_settings[pageID] ?? "color-cream";
    $("body").css("background-color", "var(" + color + ")");
    $("header").css("background-color", "var(" + color + ")");

    if (pageCallback[pageID])
        pageCallback[pageID]();

    $(window).scrollTop(0);
}

function move_to_last_page()
{
    move_to_page(page_active_last.attr("id"));
}

function init_game()
{
    getnewpuzzle();
}


function getnewpuzzle()
{
    questions = puzzle_today.questions;
    shuffleArray(questions);
    question_index = 0;

    answers = [];
    $("#pretopic").text(strings.blurb);
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
        var count = puzzle_today.topic.length;
        if (count > 20)
        {
            $("#topic").addClass("mini");
        }
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

        $(name).attr("class", "questions-grid " + (answered ? "shown" : "hidden"));
        $(name + " #title h2").text(e[0]);
        $(name + " #correct img").css("visibility", answered && answers[index] == e[1] ? "visible" : "hidden")
        $(name + " #fake img").css("visibility", answered && !e[1] ? "visible" : "hidden")
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

    $("#button-fake").addClass("disabled")
    $("#button-real").addClass("disabled")
    setTimeout(() =>
    {
        document.documentElement.style.setProperty('--overlay-sign', isReal ? -1 : 1);
        $("#box .box-overlay").show();
        $("#box .box-overlay").text(isReal ? "real" : "fake");
        setTimeout(() =>
        {
            box.attr("class", c + "-exit")
            setTimeout(() =>
            {
                box.attr("class", "box box-arrive");
                $("#button-fake").removeClass("disabled")
                $("#button-real").removeClass("disabled")

                updateQuestion();
                updateList();
            }, 1000);
        }, 1000);
    }, 500);
}

function endGame()
{
    $("#box .box-overlay").hide();
    $("#question").attr("class", "box-text")
    $("#pretopic").text("nice work finding the real");


    $("#topic-container #topic").text(puzzle_today.topic);

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
        $("#button-new-puzzle").addClass("hidden")
        $("#button-share").addClass("hidden")
        $("#button-fake").removeClass("hidden")
        $("#button-real").removeClass("hidden")
    }
    else
    {
        // $("#button-new-puzzle").removeClass("hidden")
        $("#button-share").removeClass("hidden")
        $("#button-fake").addClass("hidden")
        $("#button-real").addClass("hidden")
    }

}

function init_about()
{
    var gridchild = `<div class="about-grid-item" id="about-grid-item-{0}"><h2>{1} — {2}</h2></div>`;
    var i = 0;
    // for(var i = 0; i < Object.keys(backup).length; i++)
    // {
    backup.forEach(b =>
    {
        var id = "#about-grid-item-{0}".format(i);
        var format = $(id);
        if (format[0] == null)
        {
            format = $(gridchild.format(i, b[1], b[0]));
            $(".about-grid").append(format);
        }

        format.css("background-color", b[2]);
        i++;
    });


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

customElements.define("rbfb-button", class extends HTMLElement
{

    connectedCallback()
    {
        var shape = `<svg [ID] width="100%" height="100% " stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 27C1 12.6406 12.6406 1 27 1H105C119.359 1 131 12.6406 131 27V27C131 41.3594 119.359 53 105 53H27C12.6406 53 1 41.3594 1 27V27Z" />
        </svg>`;

        this.innerHTML = shape.replace("[ID]", "class=bottom") +
            shape.replace("[ID]", "class=top") +
            this.innerHTML;
    }
});

customElements.define("rbfb-list-item", class extends HTMLElement
{

    connectedCallback()
    {
        var shape = `<div class="fake" id="fake"><img src="./assets/button_text_fake.svg"></div>
					<div class="title hidden" id="title"><h2></h2></div>
					<div id="correct"><img src="./assets/tick.svg">`;
        var end = `</div>`;
        this.innerHTML = shape.replace("[ID]", this.id) + this.innerHTML + end;
    }
});

function promiseWhen(condition, timeout = 2000)
{
    return new Promise((resolve, reject) =>
    {
        setTimeout(() =>
        {
            reject();
        }, timeout);

        const loop = () =>
        {
            if (condition())
            {
                return resolve();
            }
            setTimeout(loop, 0);
        };

        setTimeout(loop, 0);
    });
}