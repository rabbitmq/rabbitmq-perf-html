var results;

// TODO
var plot_key = 'send-rate';

$(document).ready(function() {
    $.ajax({
        url: 'results.js',
        success: function(data) {
            results = JSON.parse(data);
            $('.chart').map(function() {
                plot($(this));
            });
        },
        fail: function() { alert('error loading results.js'); }
    });
});

function plot(div) {
    var type     = div.attr('type');
    var scenario = div.attr('scenario');

    if (type == 'time') {
        var data = results[scenario];
        plot_time(div, data);
    }
    else {
        var dimensions       = results[scenario]['dimensions'];
        var dimension_values = results[scenario]['dimension-values'];
        var data             = results[scenario]['data'];

        if (type == 'series') {
            plot_series(div, dimensions, dimension_values, data);
        }
        else if (type == 'r-l') {
            plot_r_l(div, dimensions, dimension_values, data);
        }
    }
}

function plot_time(div, data) {
    function wrap(n, v) {
        return '<div><span class="n">' + n + '</span><span class="v">' + v +
            '</span></div>';
    }

    div.after('<div class="time-summary">' +
              wrap('Avg send-rate', Math.round(data['send-rate']) + ' msg/s') +
              wrap('Avg latency', Math.round(data['avg-latency']) + ' us') +
              '</div>');
    plot_time0(div, data);
}

function plot_time0(div, data) {
    var chart_data = [];
    $.each(['send-rate', 'recv-rate',
            'min-latency', 'avg-latency', 'max-latency'],
           function(i, plot_key) {
        var d = [];
        var secs = 0;
        $.each(data['samples'], function(j, sample) {
            d.push([++secs, sample[plot_key]]);
        });
        var yaxis = (plot_key.indexOf('latency') == -1 ? 1 : 2);
        chart_data.push({label: plot_key, data: d, yaxis: yaxis});
    });

    plot_data(div, chart_data, {yaxes: axes_rate_and_latency});
}

function plot_series(div, dimensions, dimension_values, data) {
    var x_key         = div.attr('x-key');
    var series_key    = div.attr('series-key');
    var series_first  = dimensions[0] == series_key;
    var series_values = dimension_values[series_key];
    var x_values      = dimension_values[x_key];

    var chart_data = [];
    $.each(series_values, function(i, s_val) {
        var d = [];
        $.each(x_values, function(j, x_val) {
            var val = series_first ? data[s_val][x_val] :
                                     data[x_val][s_val];
            d.push([x_val, val[plot_key]]);
        });
        chart_data.push({label: series_key + ' = ' + s_val, data: d});
    });

    plot_data(div, chart_data);
}

function plot_r_l(div, dimensions, dimension_values, data) {
    var x_values = dimension_values['rateLimit'];

    var chart_data = [];
    var d = [];
    $.each(x_values, function(i, x_val) {
        d.push([x_val, data[x_val]['send-rate']]);
    });
    chart_data.push({label: 'rate achieved', data: d, yaxis: 1});

    d = [];
    $.each(x_values, function(i, x_val) {
        d.push([x_val, data[x_val]['avg-latency']]);
    });
    chart_data.push({label: 'latency (us)', data: d, yaxis: 2});

    plot_data(div, chart_data, {yaxes: axes_rate_and_latency});
}

function plot_data(div, chart_data, extra) {
    var chrome = {
        series: {
            lines: { show: true },
            points: { show: true }
        },
        grid: {
            backgroundColor: { colors: ["#fff", "#eee"] }
        }
    };

    if (extra != undefined) {
        for (var k in extra) {
            chrome[k] = extra[k];
        }
    }

    div.addClass('chart-style');
    $.plot(div, chart_data, chrome);
}

function log_transform(v) {
    return Math.log(v);
}

function log_ticks(axis) {
    var val = axis.min;
    var res = [val];
    while (val < axis.max) {
        val *= 10;
        res.push(val);
    }
    return res;
}

var axes_rate_and_latency = [{min:       0},
                             {min:       100,
                              transform: log_transform,
                              ticks:     log_ticks,
                              position:  "right"}];
