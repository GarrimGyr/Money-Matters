/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function () {
  // constants to define the size
  // and margins of the vis area.
    var width = 600;
    var height = 700;
    var margin = { top: 0, left: 20, bottom: 40, right: 10 };

    // Keep track of which visualization
    // we are on and which was the last
    // index activated. When user scrolls
    // quickly, we want to call all the
    // activate functions that they pass.
    var lastIndex = -1;
    var activeIndex = 0;


    // main svg used for visualization
    var svg = null;

    // d3 selection that will be used
    // for displaying visualizations
    var g = null;

    // We will set the domain when the
    // data is processed.
    // @v4 using new scale names
    var xBarScale = d3.scaleLinear()
        .range([0, width]);

    // The bar chart display is horizontal
    // so we can use an ordinal scale
    // to get width and y locations.
    // @v4 using new scale type
    var yBarScale = d3.scaleBand()
        .paddingInner(0.08)
        .domain([0, 1])
        .range([0, height - 50], 0.1, 0.1);

    // Color is determined just by the index of the bars
    var barColors = { 0: '#1E3E39', 1: '#385941', 2: '#658C4D' };

    // You could probably get fancy and
    // use just one axis, modifying the
    // scale, but I will use two separate
    // ones to keep things easy.
    // @v4 using new axis name
    var xAxisBar = d3.axisBottom()
        .scale(xBarScale);

    // When scrolling to a new section
    // the activation function for that
    // section is called.
    var activateFunctions = [];
    // If a section has an update function
    // then it is called while scrolling
    // through the section with the current
    // progress through the section.
    var updateFunctions = [];

    /**
     * chart
     *
     * @param selection - the current d3 selection(s)
     *  to draw the visualization in. For this
     *  example, we will be drawing it in #vis
     */
    var chart = function (selection) {
        selection.each(function (dataset) {
        // create svg and give it a width and height
        svg = d3.select(this).selectAll('svg').data([dataset]);
        var svgE = svg.enter().append('svg');
        // @v4 use merge to combine enter and existing selection
        svg = svg.merge(svgE);

        svg.attr('width', width + margin.left + margin.right);
        svg.attr('height', height + margin.top + margin.bottom);

        svg.append('g');


        // this group element will be used to contain all
        // other elements.
        g = svg.select('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // perform some preprocessing on raw data
        exp_data = reshapeExp(dataset, 'total_expenditure')

        // set the bar scale's domain
        var countMax = d3.max(exp_data, function (d) { return d.value;});
        xBarScale.domain([0, countMax]);

        setupVis(exp_data);

        setupSections();
        });
    };


    /**
     * setupVis - creates initial elements for all
     * sections of the visualization.
     */
    var setupVis = function (exp_data) {
        // axis
        g.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxisBar);
        g.select('.x.axis').style('opacity', 0);


        // count filler word count title
        g.append('text')
        .attr('class', 'title count-title highlight')
        .attr('x', width / 2)
        .attr('y', height / 3)
        .text('Median Family Expenditures per Capita');

        g.append('text')
        .attr('class', 'sub-title count-title')
        .attr('x', width / 2)
        .attr('y', (height / 3) + (height / 5))
        .text('Weighted average by country');

        g.selectAll('.count-title')
        .attr('opacity', 0);



        // barchart
        // @v4 Using .merge here to ensure
        // new and old data have same attrs applied
        var bars = g.selectAll('.bar').data(exp_data);
        var barsE = bars.enter()
        .append('rect')
        .attr('class', 'bar');
        bars = bars.merge(barsE)
        .attr('x', 0)
        .attr('y', function (d, i) { return yBarScale(i);})
        .attr('fill', function (d, i) { return barColors[i]; })
        .attr('width', 0)
        .attr('height', yBarScale.bandwidth());

        var barText = g.selectAll('.bar-text').data(exp_data);
        barText.enter()
        .append('text')
        .attr('class', 'bar-text')
        .text(function (d) { return d.value; })
        .attr('x', 0)
        .attr('dx', 15)
        .attr('y', function (d, i) { return yBarScale(i);})
        .attr('dy', yBarScale.bandwidth() / 1.2)
        .style('font-size', '110px')
        .attr('fill', 'white')
        .attr('opacity', 0);

    };

    /**
     * setupSections - each section is activated
     * by a separate function. Here we associate
     * these functions to the sections based on
     * the section's index.
     *
     */
    var setupSections = function () {
        // activateFunctions are called each
        // time the active section changes
        activateFunctions[0] = showTitle;
        activateFunctions[1] = showFillerTitle;

        // updateFunctions are called while
        // in a particular section to update
        // the scroll progress in that section.
        // Most sections do not need to be updated
        // for all scrolling and so are set to
        // no-op functions.
        for (var i = 0; i < 2; i++) {
        updateFunctions[i] = function () {};
        }
    };

    /**
     * ACTIVATE FUNCTIONS
     *
     * These will be called their
     * section is scrolled to.
     *
     * General pattern is to ensure
     * all content for the current section
     * is transitioned in, while hiding
     * the content for the previous section
     * as well as the next section (as the
     * user may be scrolling up or down).
     *
     */

    /**
     * showTitle - initial title
     *
     * hides: count title
     * (no previous step to hide)
     * shows: intro title
     *
     */
    function showTitle() {
        g.selectAll('.count-title')
        .transition()
        .duration(0)
        .attr('opacity', 0);

        g.selectAll('.openvis-title')
        .transition()
        .duration(600)
        .attr('opacity', 1.0);
    }

    /**
     * showFillerTitle - filler counts
     *
     * hides: intro title
     * shows: filler count title
     *
     */
    function showFillerTitle() {

        g.selectAll('.count-title')
        .transition()
        .duration(600)
        .attr('opacity', 1.0);
    }
    function showBar() {
        // ensure bar axis is set
        g.selectAll('.count-title')
        .transition()
        .duration(600)
        .attr('opacity', 0);

        showAxis(xAxisBar);
    
        g.selectAll('.bar')
          .transition()
          .delay(function (d, i) { return 300 * (i + 1);})
          .duration(600)
          .attr('width', function (d) { return xBarScale(d.value); });
    
        g.selectAll('.bar-text')
          .transition()
          .duration(600)
          .delay(1200)
          .attr('opacity', 1);
      }

    /**
     * showAxis - helper function to
     * display particular xAxis
     *
     * @param axis - the axis to show
     *  (xAxisHist or xAxisBar)
     */
    function showAxis(axis) {
        g.select('.x.axis')
        .call(axis)
        .transition().duration(500)
        .style('opacity', 1);
    }

    /**
     * hideAxis - helper function
     * to hide the axis
     *
     */
    function hideAxis() {
        g.select('.x.axis')
        .transition().duration(500)
        .style('opacity', 0);
    }


    /**
     * DATA FUNCTIONS
     *
     * Used to coerce the data into the
     * formats we need to visualize
     *
     */
    /**
     * reshapeExp - maps expense row to new dataset with one column
     *
     * @param data, exp_type expense variable name
     */
    function reshapeExp(data, exp_type) {
            let exp_row = data.filter(function (d) { return d.expense_type === exp_type; });
            console.log(exp_row);
            return Array(exp_row[0].no_remit, exp_row[0].remit);
        };

    /**
     * activate -
     *
     * @param index - index of the activated section
     */
    chart.activate = function (index) {
        activeIndex = index;
        var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
        var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
        scrolledSections.forEach(function (i) {
        activateFunctions[i]();
        });
        lastIndex = activeIndex;
    };

    /**
     * update
     *
     * @param index
     * @param progress
     */
    chart.update = function (index, progress) {
        updateFunctions[index](progress);
    };

    // return chart function
    return chart;
    };


    /**
     * display - called once data
     * has been loaded.
     * sets up the scroller and
     * displays the visualization.
     *
     * @param data - loaded tsv data
     */
    function display(data) {
    // create a new plot and
    // display it
    var plot = scrollVis();
    d3.select('#vis')
        .datum(data)
        .call(plot);

    // setup scroll functionality
    var scroll = scroller()
        .container(d3.select('#graphic'));

    // pass in .step selection as the steps
    scroll(d3.selectAll('.step'));

    // setup event handling
    scroll.on('active', function (index) {
        // highlight current step text
        d3.selectAll('.step')
        .style('opacity', function (d, i) { return i === index ? 1 : 0.1; });

        // activate current section
        plot.activate(index);
    });

    scroll.on('progress', function (index, progress) {
        plot.update(index, progress);
    });
    }

// load data and display
d3.csv('website_data/monthly_expenditures.csv', function(d){
    return {
        expense_type: d.var_name,
        no_remit: +d.no_remit,
        remit: +d.remit,
    };
}).then(data => {
    dataset = data
    console.log(data)
    display(dataset)
})