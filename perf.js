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
    var show_latency = div.attr('latency') == 'true';
    var chart_data = [];
    var keys = show_latency
       ? ['send-rate', 'recv-rate', 'avg-latency']
        : ['send-rate', 'recv-rate'];
    $.each(keys, function(i, plot_key) {
        var d = [];
        $.each(data['samples'], function(j, sample) {
            d.push([sample['elapsed'] / 1000, sample[plot_key]]);
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

    var cell = div.wrap('<td class="foo"/>').parent();;
    var row = cell.wrap('<tr/>').parent();
    row.wrap('<table class="test"/>');

    cell.before('<td class="yaxis">' + div.attr('y-axis') + '</td>');
    if (div.attr('y-axis2')) {
        cell.after('<td class="yaxis">' + div.attr('y-axis2') + '</td>');
    }
    row.after('<tr><td></td><td class="xaxis">' + div.attr('x-axis') +
              '</td><td></td></tr>');

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
