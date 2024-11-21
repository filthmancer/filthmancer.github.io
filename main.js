var j_m = './m.json';
var json;

var pageCallback =
{
    "game": init_game,
    "about": init_about,
}

var puzzle;
var questions;
var question_index = 0;
var question_state = () => questions[question_index][1];
var answers = []
function epoch() { return moment(json.s.epoch); }

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
        fetch(j_m, { cache: "reload" })
            .then((response) => response.json())
            .then((_json) => 
            {
                json = _json;
                init_data(json);
                waitFor(_ => puzzle != null)
                    .then(() =>
                    {
                        init_home();
                    });
            });
    }
});

function init_data(json)
{
    Object.keys(json.s.vars).forEach(v => 
    {
        old = getComputedStyle(document.body).getPropertyValue(v)
        if (old != json.s.vars[v])
        {
            console.log("updating", v, json.s.vars[v], document.documentElement.style.getPropertyValue(v))
            document.documentElement.style.setProperty(v, json.s.vars[v]);
        }
    });

    $("#button-play").click(() => move_to_page("game"));
    $("#button-real").click(() => answerQuestion(true));
    $("#button-fake").click(() => answerQuestion(false));
    $("#button-new-puzzle").click(() => getnewpuzzle());
    $("#button-share").click(() => share());

    var today = moment();
    json.p.forEach(pi =>
    {
        var index = moment(pi[0], json.s.moment_format_epoch);
        if (index.isAfter(today))
        {
            fetch(pi[1], { cache: "reload" })
                .then((response) => response.json())
                .then((_json) => 
                {
                    puzzle = _json.find(p => p.id == moment().format(json.s.moment_format_epoch));

                    var target = url_param("target");
                    if (target != null)
                    {
                        if (target == "random")
                        {
                            var index = irand(_json.length);
                            puzzle = _json[index];
                        }
                        else
                        {
                            _override = _json.find(p => p.id == target);
                            if (_override != null) puzzle = _override;
                        }
                    }
                });
        }
    });
}

function init_home()
{
    if (puzzle)
    {
        var l = json.l.home;
        var today = moment(puzzle.id);
        var today_backup = json.s.days[today.day()];

        var baseColor = puzzle.color ?? today_backup[2];
        document.documentElement.style.setProperty('--color-day', baseColor);

        var num = moment.duration(today.diff(epoch())).asDays() + 1;
        num = num.toString().padStart(3, '0')
        var category = (puzzle.category ?? today_backup[1]);
        var text = l.header_text_format.format(num,
            today.format(json.s.moment_format_front),
            category
        );
        $("#header-index").text(text.toUpperCase());

        var link = puzzle.editor.link(puzzle.editor_link);
        text = l.footer_text_format.format(link, puzzle.editor_blurb);
        $("#footer-text").html(text);

        logo_loaded = false;
        fetch(l.category_anim_format.format(category.toLowerCase()))
            .then(img => 
            {
                logo_loaded = true;
                if (img.ok)
                    $(".anim").attr("data", json.l.category_anim_format.format(category.toLowerCase()));
            })
            .catch((error) =>
            {
                logo_loaded = true;
            });


        waitFor(_ => logo_loaded == true)
            .then(() =>
            {
                $(".header").toggleClass("hidden");
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

    Object.keys(json.s[pageID]).forEach(css =>
    {
        $("body").css(css, json.s[pageID][css]);
        $("header").css(css, json.s[pageID][css]);
    })

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
    questions = puzzle.questions;
    shuffleArray(questions);
    question_index = 0;

    answers = [];
    $("#pretopic").text(json.l.game.blurb);
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
        $("#topic").text(puzzle.topic + "?");
        var count = puzzle.topic.length;
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


    $("#topic-container #topic").text(puzzle.topic);

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
    json.s.days.forEach(b =>
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

function waitFor(condition, timeout = 2000)
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

function url_param(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
}