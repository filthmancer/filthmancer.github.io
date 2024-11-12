// var json = 'https://freight.cargo.site/m/L2062450860408978361645502134319/puzzles.json';
var json = 'puzzles.json';

var puzzles;
var puzzle;
var questions;
var question_index = 0;
var question_state = () => questions[question_index][1];
var answers = []


$(document).ready(function ()
{
    function defer(method) {
        if (window.jQuery)
            method();
        else
            setTimeout(function() { defer(method) }, 50);
    }

    defer(init)
    
    function init()
    {
        fetch(json)
        .then((response) => response.json())
        .then((json) => 
        {
            puzzles = json.puzzles;

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
            getnewpuzzle();
        });
    }

    function getnewpuzzle()
    {
        var puzzle_index = irand(puzzles.length)
        puzzle = puzzles[puzzle_index];

        var baseColor = puzzle.color;
        document.documentElement.style.setProperty('--base', baseColor);

        questions = puzzle.questions;
        shuffleArray(questions);
        question_index = 0;

        answers = [];
        $("#topic-container #pretext").attr("class", "pretext shown");
        set_button_state(true);
        updateQuestion();
        updateList();

    }

    function updateQuestion()
    {
        if (question_index < questions.length)
        {
            $("#topic").text(puzzle.topic + "?");
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
            var title = $(name + " #title");
            title.text(e[0]);
            title.attr("class", answered ? "title shown" : "title hidden");

            var fake = $(name + " #fake");
            fake.text(answered && !e[1] ? "FAKE" : "");
            fake.attr("class", "fake " + (answered ? "shown" : "hidden"));

            var correct = $(name + " #correct");
            correct.text(answered ? (answers[index] == e[1]) : "");
            correct.attr("class", (answered ? "shown" : "hidden"));
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
        if(!isReal)
            $("#question").attr("class", "box-text box-answer-text")

        setTimeout(() =>
        {
            document.documentElement.style.setProperty('--overlay-rotation', isReal?"-25deg":"25deg");
            document.documentElement.style.setProperty('--overlay-offset-x', isReal?"50px":"-50px");
            $("#box .box-overlay").show();
            $("#box .box-overlay").text(isReal ? "real" : "fake");
            setTimeout(() =>
            {
                box.attr("class", c + "-exit")
                setTimeout(() =>
                {
                    box.attr("class", "box box-arrive");
                    updateQuestion();
                    updateList();
                }, 1000);
            }, 1000);
        }, 500);
    }

    function endGame()
    {
        $("#topic-container #pretext").attr("class", "pretext hidden");
        $("#topic-container #topic").text("Great!")
        $("#box .box-overlay").hide();
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
            $("#button-fake").removeClass("hidden-button")
            $("#button-real").removeClass("hidden-button")
        }
        else
        {
            $("#button-new-puzzle").removeClass("hidden-button")
            $("#button-fake").addClass("hidden-button")
            $("#button-real").addClass("hidden-button")
        }

    }
});

function irand(max)
{
    return Math.floor(Math.random() * max);
}

function shuffleArray(array) {
    for (var i = array.length - 1; i >= 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}