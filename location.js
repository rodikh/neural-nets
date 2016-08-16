/**
 * Created by RODIK on 16/08/2016.
 */
var history = require('./data/location/Location History/LocationHistory.json').locations;

module.exports = {
    commute,
    eachActivityType,
    getActivityTypes,
    history
};

function eachActivityType(hist, fitlerType, iter) {
    if (typeof fitlerType === "function") {
        iter = fitlerType;
        fitlerType = false;
    }

    for (var i = 0; i < hist.length; i++) {
        var event = hist[i];
        if (event.activitys && event.activitys.length) {
            for (var j = 0; j < event.activitys.length; j++) {
                var predictions = event.activitys[j];
                if (predictions.activities && predictions.activities.length) {
                    for (var k = 0; k < predictions.activities.length; k++) {
                        var type = predictions.activities[k].type;
                        if (typeof iter === "function" && (!fitlerType || type === fitlerType)) {
                            iter(predictions.activities[k], event, predictions);
                        }
                    }
                }
            }
        }
    }
}

var homeWorkLatRange = [320199880, 319082720];
//114521
function commute(hist) {
    var vehicleEvts = [];
    var days = {};
    eachActivityType(hist, "inVehicle", function (activity, event, predictions) {
        if (activity.confidence > 40) {
            var prog = (homeWorkLatRange[0] - event.latitudeE7) / (homeWorkLatRange[0] - homeWorkLatRange[1]);
            if (prog > 1 || prog < 0) {
                return;
            }

            var time = new Date(parseInt(predictions.timestampMs, 10));
            var date = time.getDate() +"/"+(1+time.getMonth()) +"/"+time.getFullYear();
            var dayProgress = (time.getMinutes() + (time.getHours() * 60)) / 1440;

            var formattedEvent = {
                prog: (prog).toFixed(5),
                dayProg: (dayProgress).toFixed(5),
                time: toHour(time),
                date
            };

            if (!days[date]) {
                days[date] = {
                    "morning": {},
                    "evening": {}
                };
            }
            if (prog > 0.5 && (dayProgress > 0.5 && dayProgress < 0.8)) {
                if (prog > days[date].evening.prog || !days[date].evening.prog) {
                    days[date].evening = formattedEvent;
                }
            }
            if (prog < 0.5 && (dayProgress > 0.2 && dayProgress < 0.5)) {
                if (prog < days[date].morning.prog || !days[date].morning.prog) {
                    days[date].morning = formattedEvent;
                }
            }
            vehicleEvts.push(formattedEvent);
        }
    });

    // createFile('./data/days.json', days);

    return {
        allEvents: vehicleEvts,
        classifiedEvents: Object.keys(days).map(function (key) {
            return days[key];
        })
    };
}

function getActivityTypes(hist) {
    var types = {};

    eachActivityType(hist, function (activity) {
        var type = activity.type;
        if (!types[type]) {
            types[type] = 0;
        }
        types[type]++;
    });
    return types;
}

function toHour(time) {
    return time.getHours() + ":" + ('0' + time.getMinutes()).slice(-2);
}

function createFile(path, data) {
    require('fs').writeFile(path, JSON.stringify(data, null, 4));
}