/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function () {
  // constants to define the size
  // and margins of the vis area.
    var visWidth = 600;
    var visHeight = 500;
    var margin = { top: 200, left: 30, bottom: 50, right: 10 };

    var chartMargin = {top: 30, left: 85, bottom: 10, right: 10};
    var chartWidth = visWidth - margin.left - margin.right - chartMargin.left - chartMargin.right;
    var chartHeight = visHeight - margin.top - margin.bottom - chartMargin.top  - chartMargin.bottom; 

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
        .range([0, chartWidth]);

    // The bar chart display is horizontal
    // so we can use an ordinal scale
    // to get width and y locations.
    // @v4 using new scale type
    var yBarScale = d3.scaleBand()
        .paddingInner(0.1)
        .range([0, chartHeight], 0.5, 0.1);
    var ySubBarScale = d3.scaleBand()
        .paddingInner(0.05);



    // You could probably get fancy and
    // use just one axis, modifying the
    // scale, but I will use two separate
    // ones to keep things easy.
    // @v4 using new axis name
    var xAxisBar = d3.axisBottom()
        .scale(xBarScale);

    var yAxisBar = d3.axisLeft()
        .scale(yBarScale);

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

        svg.attr('width', visWidth);
        svg.attr('height', visHeight);

        svg.append('g');


        // this group element will be used to contain all
        // other elements.
        g = svg.select('g')
            // .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        setupVis(dataset);

        setupSections();
        });
    };


    /**
     * setupVis - creates initial elements for all
     * sections of the visualization.
     */
    var setupVis = function (dataset) {

        // perform some preprocessing on raw data
        var exp_data = reshapeExp(dataset, 'monthly_expenditure_pc');
        var food_data = reshapeExp(dataset, 'exp_monthly_food_pc')

        var yGroupValues = exp_data.map(d=>d.country);
        var ySubGroupValues = ['No Remittances', 'Remittances'];


        // set the bar scale's domain
        var countMax = d3.max(exp_data, function (d) { return d.remit;});
        xBarScale.domain([0, countMax + 5]);
        yBarScale.domain(yGroupValues);
        ySubBarScale.domain(ySubGroupValues)
                    .range([0, yBarScale.bandwidth()])

        // Color is determined just by the index of the bars
        var barColors = d3.scaleOrdinal()
        .domain(ySubGroupValues)
        .range(['#1E3E39','#658C4D']);
        console.log(barColors('Remittances'))

        var exp_data = reshapeExp(dataset, 'monthly_expenditure_pc')
        var food_data = reshapeExp(dataset, 'exp_monthly_food_pc')

        // axis
        g.append('g')
            .attr('class', 'xAxis')
            .attr('transform', 'translate(' + (margin.left + chartMargin.left) + ',' + (margin.top + chartMargin.top + chartHeight) + ')')
            .call(xAxisBar)
            .style('opacity', 0);
        g.select('.xAxis').style('opacity', 0);

        g.append('g')
            .attr('class', 'yAxis')
            .attr('transform', 'translate(' + (margin.left + chartMargin.left) + ',' + (chartMargin.top + margin.top) + ')')
            .call(yAxisBar)
            .style('opacity', 0);
        g.select('.yAxis').style('opacity', 0);

        // count filler word count title
        g.append('text')
            .attr('class', 'title exp-title')
            .attr('x', margin.left)
            .attr('y', margin.top)
            .text('Total Monthly Expenditures per capita');

        g.append('text')
            .attr('class', 'sub-title exp-title')
            .attr('x', margin.left)
            .attr('y', margin.top + 20)
            .text('Median by country');
    
        g.selectAll('.exp-title')
            .attr('opacity', 0);

        g.append('text')
            .attr('class', 'title food-title')
            .attr('x', margin.left)
            .attr('y', margin.top)
            .text('Monthly Spending on Food per capita');
    
        g.append('text')
            .attr('class', 'sub-title food-title')
            .attr('x', margin.left)
            .attr('y', margin.top + 20)
            .text('Median by country');

        g.selectAll('.food-title')
            .attr('opacity', 0);


        // barchart
        // @v4 Using .merge here to ensure
        // new and old data have same attrs applied
        var exp_bars = g.selectAll('.exp-bar-group').data(exp_data);
        var exp_barsE = exp_bars.enter()
            .append('g')
            .attr('class', 'exp-bar-group')
            .attr("transform", function(d) {return "translate(0," + (yBarScale(d.country)) + ")"; })
            .selectAll("rect")
            .data(function(d) { return Array({type:'No Remittances', 'value':d.no_remit},{type:'Remittances',value:d.remit})})
            .enter().append("rect").attr('class', 'exp-bar')
            ;

        exp_barsE
            .attr('x', 0)
            .attr('y', function (d, i) {return ySubBarScale(d.type);})
            .attr('fill', function (d) {return barColors(d.type); })
            .attr('width', 0)
            .attr('height', ySubBarScale.bandwidth())
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')
            ;

        exp_bars = exp_bars.merge(exp_barsE)

        var exp_barNum = g.selectAll('.exp-bar-num-group').data(exp_data);
        exp_barNum.enter()
            .append('g')
            .attr('class', 'exp-bar-num-group')
            .attr("transform", function(d) {return "translate(0," + (yBarScale(d.country)) + ")"; })
            .selectAll("text")
            .data(function(d) { return Array({type:'No Remittances', 'value':d.no_remit},{type:'Remittances',value:d.remit})})
            .enter().append("text").attr('class', 'exp-bar-num')
            .text((d,i) => '$' + d.value.toFixed(1))
            .attr('x',  0)
            .attr('dx', d => xBarScale(d.value) - 10)
            .attr('y', function (d, i) { return (ySubBarScale(d.type) + (0.5* ySubBarScale.bandwidth()));})
            .attr('text-anchor','end')
            .attr('opacity', 0)
            .attr('fill', '#cbcbce')
            .attr('font-size', '14pt')
            .attr('text-anchor', 'end')
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')



        // barchart
        // @v4 Using .merge here to ensure
        // new and old data have same attrs applied
        var food_bars = g.selectAll('.food-bar-group').data(food_data);
        var food_barsE = food_bars.enter()
            .append('g')
            .attr('class', 'food-bar-group')
            .attr("transform", function(d) {return "translate(0," + (yBarScale(d.country)) + ")"; })
            .selectAll("rect")
            .data(function(d) { return Array({type:'No Remittances', 'value':d.no_remit},{type:'Remittances',value:d.remit})})
            .enter().append("rect").attr('class', 'food-bar')
            ;

        food_barsE
            .attr('x', 0)
            .attr('y', function (d, i) {return ySubBarScale(d.type);})
            .attr('fill', function (d) {return barColors(d.type); })
            .attr('width', 0)
            .attr('height', ySubBarScale.bandwidth())
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')
            ;

        food_bars = food_bars.merge(food_barsE)

        var food_barNum = g.selectAll('.food-bar-num-group').data(food_data);
        food_barNum.enter()
            .append('g')
            .attr('class', 'food-bar-num-group')
            .attr("transform", function(d) {return "translate(0," + (yBarScale(d.country)) + ")"; })
            .selectAll("text")
            .data(function(d) { return Array({type:'No Remittances', 'value':d.no_remit},{type:'Remittances',value:d.remit})})
            .enter().append("text").attr('class', 'food-bar-num')
            .text((d,i) => '$' + d.value.toFixed(1))
            .attr('x',  0)
            .attr('dx', d => xBarScale(d.value) - 10)
            .attr('y', function (d, i) { return (ySubBarScale(d.type) + (0.5* ySubBarScale.bandwidth()));})
            .attr('text-anchor','end')
            .attr('opacity', 0)
            .attr('fill', '#cbcbce')
            .attr('font-size', '14pt')
            .attr('text-anchor', 'end')
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')

        // Add one dot in the legend for each name.
        legendDots = g.selectAll("legend-dots")
        .data(ySubGroupValues);

        legendDots.enter()
            .append("circle")
            .attr('class', 'legend-dots')
            .attr("cx", function(d,i){ return chartMargin.left + margin.left + i*150})
            .attr("cy", visHeight - margin.bottom + 10) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("r", 7)
            .style("fill", function(d){ return barColors(d)})
            .attr('opacity',0)

        // Add one dot in the legend for each name.
        legendLabels = g.selectAll("legend-labels")
        .data(ySubGroupValues);
        legendLabels.enter()
        .append("text")
            .attr('class', 'legend-labels')
            .attr("x", function(d,i){ return 15 + chartMargin.left + margin.left + i*150})
            .attr("y", visHeight - margin.bottom + 10)
            .style("fill", 'black')
            .text(function(d){ return d})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")
            .attr('opacity',0)


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
        activateFunctions[1] = showExpBarChart;
        activateFunctions[2] = showFoodBarChart;

        // updateFunctions are called while
        // in a particular section to update
        // the scroll progress in that section.
        // Most sections do not need to be updated
        // for all scrolling and so are set to
        // no-op functions.
        for (var i = 0; i < 3; i++) {
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

     function clean(chartType){
        let svg = d3.select('#vis').select('svg')
        if (chartType !== "isExpBar") {
            hideXAxis()
            hideYAxis()
            svg.selectAll('.exp-title').transition().duration(0).attr('opacity', 0);
            svg.selectAll('.exp-bar').transition().duration(300).attr('width', 0);
            svg.selectAll('.exp-bar-text').transition().duration(300).attr('opacity', 0);
            svg.selectAll('.exp-bar-num').transition().duration(300).attr('opacity', 0);
            svg.selectAll('.legend-dots').transition().duration(300).attr('opacity', 0);
            svg.selectAll('.legend-labels').transition().duration(300).attr('opacity', 0);

        }
        if (chartType !== "isFoodBar") {
            hideXAxis()
            hideYAxis()
            svg.selectAll('.food-title').transition().duration(0).attr('opacity', 0);
            svg.selectAll('.food-bar').transition().duration(300).attr('width', 0);
            svg.selectAll('.food-bar-text').transition().duration(300).attr('opacity', 0);
            svg.selectAll('.food-bar-num').transition().duration(300).attr('opacity', 0);
            svg.selectAll('.legend-dots').transition().duration(300).attr('opacity', 0);
            svg.selectAll('.legend-labels').transition().duration(300).attr('opacity', 0);
        }

    }

    /**
     * showTitle - initial title
     *
     * hides: count title
     * (no previous step to hide)
     * shows: intro title
     *
     */
    function showTitle() {
        clean('none');
    }

    /**
     * showFillerTitle - filler counts
     *
     * hides: intro title
     * shows: filler count title
     *
     */
    function showExpBarChart() {
        clean('isExpBar');
        // showXAxis(xBarScale);
        showYAxis(yBarScale);
        g.selectAll('.exp-title')
            .transition()
            .duration(300)
            .attr('opacity', 1.0);

        g.selectAll('.exp-bar')
          .transition()
          .delay(function (d, i) { return 200 * (i + 1);})
          .duration(300)
          .attr('width', function(d) {return xBarScale(d.value);});
    

        g.selectAll('.exp-bar-num')
          .transition()
          .duration(2000)
          .attr('opacity', 1);

        g.selectAll('.legend-dots')
          .transition()
          .duration(300)
          .attr('opacity', 1);

        g.selectAll('.legend-labels')
          .transition()
          .duration(300)
          .attr('opacity', 1);
    }

    function showFoodBarChart() {
        clean('isFoodBar');
 
        showYAxis(yBarScale);

        g.selectAll('.food-title')
        .transition()
        .duration(300)
        .attr('opacity', 1.0);

        g.selectAll('.food-bar')
          .transition()
          .delay(function (d, i) {return 300 * (i + 1);})
          .duration(300)
          .attr('width', d => xBarScale(d.value));

        g.selectAll('.food-bar-num')
          .transition()
          .duration(300)
          .attr('opacity', 1);

        g.selectAll('.legend-dots')
          .transition()
          .duration(300)
          .attr('opacity', 1);

        g.selectAll('.legend-labels')
          .transition()
          .duration(300)
          .attr('opacity', 1);
    }


    /**
     * showAxis - helper function to
     * display particular xAxis
     *
     * @param axis - the axis to show
     *  (xAxisHist or xAxisBar)
     */

    function showXAxis(axis) {
        g.select('.xAxis')
        .call(axis)
        .transition().duration(500)
        .style('opacity', 1);
    }
    /**
     * showAxis - helper function to
     * display particular xAxis
     *
     * @param axis - the axis to show
     *  (xAxisHist or xAxisBar)
     */
    function showYAxis(axis) {
        g.select('.yAxis')
        .call(axis)
        .transition().duration(500)
        .style('opacity', 1);
    }

    /**
     * hideAxis - helper function
     * to hide the axis
     *
     */
    function hideXAxis() {
        svg.select('.xAxis')
        .transition().duration(300)
        .style('opacity', 0);
    }

    function hideYAxis() {
        svg.select('.yAxis')
        .transition().duration(300)
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
            const exp_data = Array({country:'Guatemala', no_remit:exp_row[0].gt_noremit, remit:exp_row[0].gt_remit},
                                    {country:'Honduras', no_remit:exp_row[0].hnd_noremit, remit:exp_row[0].hnd_remit},
                                    {country:'El Salvador', no_remit:exp_row[0].slv_noremit, remit:exp_row[0].slv_remit});

            return exp_data;
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
        expense_type: d.variable,
        gt_noremit: +d.GT_noremit,
        gt_remit: +d.GT_remit,
        hnd_noremit: +d.HND_noremit,
        hnd_remit: +d.HND_remit,        
        slv_noremit: +d.SLV_noremit,
        slv_remit: +d.SLV_remit
    };
}).then(data => {
    dataset = data
    console.log(data)
    display(dataset)
})