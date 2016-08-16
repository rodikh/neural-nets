/**
 * Created by RODIK on 16/08/2016.
 */
var synaptic = require('synaptic'); // this line is not needed in the browser
var Neuron = synaptic.Neuron,
    Layer = synaptic.Layer,
    Network = synaptic.Network,
    Trainer = synaptic.Trainer,
    Architect = synaptic.Architect;

var location = require('./location');
location.commute(location.history);
function createTrainingSet() {
    var days = require('./data/days.json');
    var commute = location.commute(location.history);
    // console.log('commute', commute);

    return commute.allEvents.filter(function(item) {
        return item.dayProg < 0.5;
    }).map(function (item) {
        var late = false;
        var time = days[item.date].morning.time;
        if (time) {
            if (parseInt(time.replace(":",""), 10) > 940) {
                late = true;
            }
        }

        return {
            input: [item.dayProg, item.prog],
            output: [late]
        }
    });
}

function testForDate(event, network) {
    var prob = network.activate([event.dayProg, event.prog]);
    console.log("Testing for",  event.date, ":", prob);
}

function saveNetwork(path, network) {
    require('fs').writeFile(path, JSON.stringify(network.toJSON(), null, 4));
}

function loadNetwork(path) {
    return Network.fromJSON(require(path));
}

var trainingOptions = {
    rate: .1,
    iterations: 10000,
    error: .005
};

// var perceptron = new Architect.Perceptron(2, 6, 1);
// perceptron.trainer.train(createTrainingSet(), trainingOptions);
var perceptron = loadNetwork('./data/networks/1.json');

// saveNetwork('./data/networks/1.json',perceptron);

testForDate({
    "prog": "0.02316",
    "dayProg": "0.39444",
    "time": "9:28",
    "date": "13/11/2015"
}, perceptron);
