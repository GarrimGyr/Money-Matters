/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
var scrollVis = function () {
  // constants to define the size
  // and margins of the vis area.
    var visWidth = 700;
    var visHeight = 700;
    var margin = { top: 200, left: 30, bottom: 150, right: 10 };
    var spiderMargin = {top: 30, left:30, bottom: 50, right: 30};

    var chartMargin = {top: 30, left: 85, bottom: 10, right: 10};
    var chartWidth = visWidth - margin.left - margin.right - chartMargin.left - chartMargin.right;
    var chartHeight = visHeight - margin.top - margin.bottom - chartMargin.top  - chartMargin.bottom; 

    var innerRadius = 80;
    var outerRadius = Math.min(visWidth - spiderMargin.left - spiderMargin.right, visHeight - spiderMargin.top - spiderMargin.bottom) / 2;   // the outerRadius goes from the middle of the SVG area to the border

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
    var xShareBarScale = d3.scaleLinear()
        .range([0, chartWidth]);

    // The bar chart display is horizontal
    // so we can use an ordinal scale
    // to get width and y locations.
    // @v4 using new scale type
    var yBarScale = d3.scaleBand()
        .paddingInner(0.2)
        .range([0, chartHeight], 1, 0.5);
    var ySubBarScale = d3.scaleBand()
        .paddingInner(0.05);


    // You could probably get fancy and
    // use just one axis, modifying the
    // scale, but I will use two separate
    // ones to keep things easy.
    // @v4 using new axis name
    var xAxisBar = d3.axisBottom()
        .scale(xBarScale);
    var xShareAxisBar = d3.axisBottom()
        .scale(xShareBarScale);

    var yAxisBar = d3.axisLeft()
        .scale(yBarScale);

    // Scales
    var rad_x = d3.scaleBand()
        .range([0, 2 * Math.PI])    // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
        .align(0)                  // This does nothing
    var rad_y = d3.scaleRadial()
        .range([innerRadius, outerRadius])   // Domain will be define later.
        .domain([0,400]); // Domain of Y is from 0 to the max seen in the data

    //scale
    var radialScale = d3.scaleLinear()
        .domain([0,300])
        .range([innerRadius,outerRadius]);

    var ticks = [0,50,100,150,200];
    var ticks2 = [0];

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
        selection.each(function (all_data) {
        // create svg and give it a width and height
        svg = d3.select(this).selectAll('svg').data(all_data);
        var svgE = svg.enter().append('svg');
        // @v4 use merge to combine enter and existing selection
        svg = svg.merge(svgE);

        svg.attr('width', visWidth);
        svg.attr('height', visHeight);

        svg.append('g');

        // this group element will be used to contain all
        // other elements.
        g = svg.select('g')

        g.append('g').attr('class', 'spider_chart');

        spid_g = g.select('g');
        spid_g.attr("transform", `translate(${visWidth/2}, ${visHeight/2})`);

        setupVis(all_data);

        setupSections();
        });
    };


    /**
     * setupVis - creates initial elements for all
     * sections of the visualization.
     */
    var setupVis = function (all_data) {
        all_data = all_data[0].data
        var bar_dataset = all_data.filter(function (d) { return d.chartType === 'bar'; });
        bar_dataset = bar_dataset[0].data;
        var spider_dataset = all_data.filter(function (d) { return d.chartType === 'spider'; });
        spider_dataset = spider_dataset[0].data;
        console.log(spider_dataset)
        var shares_dataset = all_data.filter(function (d) { return d.chartType === 'shares'; });
        shares_dataset = shares_dataset[0].data;

        // perform some preprocessing on raw data
        var exp_data = reshapeExp(bar_dataset, 'monthly_expenditure_pc');
        var food_data = reshapeExp(bar_dataset, 'exp_monthly_food_pc');
        var save_data = reshapeExp(bar_dataset, 'exp_6months_savings_pc');
        var save_shares = reshapeExp(shares_dataset, 'exp_6months_savings_pc');
        var health_data = reshapeExp(bar_dataset, 'exp_6months_health_pc');
        var health_shares = reshapeExp(shares_dataset, 'exp_6months_health_pc');

        var yGroupValues = exp_data.map(d=>d.country);
        var ySubGroupValues = ['No Remittances', 'Remittances'];


        // set the bar scale's domain
        var countMax = d3.max(exp_data, function (d) { return d.remit;});
        xBarScale.domain([0, countMax]);
        var countMaxShares = d3.max(health_shares, function (d) { return d.remit;});

        xShareBarScale.domain([0, countMaxShares]);

        yBarScale.domain(yGroupValues);
        ySubBarScale.domain(ySubGroupValues)
                    .range([0, yBarScale.bandwidth()])

        rad_x.domain(spider_data.map(d => d.axis)); // The domain of the X axis is the list of states.


        // Color is determined just by the index of the bars
        domain_combos = [];
        for (let i = 0; i < yGroupValues.length; i++) {
            for (let k = 0; k < ySubGroupValues.length; k++) {
                domain_combos.push(ySubGroupValues[k] + yGroupValues[i])
            }
        }

        var barColors = d3.scaleOrdinal()
        .domain(domain_combos)
        .range(['#033F63','#056FB0','#6F9954','#9DD977','#2B7068', '#48BDAF']);

        // radial chart
        var circles = spid_g.selectAll('.circles').data(ticks);
        circles.enter()
            .append('circle')
            .attr('class', 'circles')
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("fill", "none")
            .attr("stroke", "gray")
            .attr("r", d=> radialScale(d))
            .attr('opacity',0)

        var circles_zero = spid_g.selectAll('.circles-zero').data(ticks2);
        circles_zero.enter()
            .append('circle')
            .attr('class', 'circles-zero')
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("r", d=> radialScale(d))
            .attr('opacity',0)

        var circle_text = spid_g.selectAll('.circleLabels').data(ticks);
        circle_text.enter()
            .append("text")
            .attr('class', 'circleLabels')
            .attr("x", 0 )
            .attr("y", d => 10 - radialScale(d) )
            .text(d => d.toString() + '%')
            // .attr("transform", function(t) { return "rotate(-20)"})
            .attr("text-anchor","middle")
            .style("font-size", "12px")
            // .attr("transform", `translate(${visWidth/2}, ${visHeight/2})`);

            ;

        var rad_bars = spid_g.selectAll('.rad-bars').data(spider_dataset);
        rad_bars.enter()
            .append('path')
            .attr('class','rad-bars')
            .attr("fill", d => d['color'])
            .attr("d", d3.arc()     // imagine your doing a part of a donut plot
                .innerRadius(innerRadius)
                .outerRadius(function(d) {return(d['value_diff']>0)?rad_y(d['value_diff']):rad_y(d['value_diff']/2)})
                .startAngle(function(d) {return rad_x(d.axis) + 0.17 })
                .endAngle(d => rad_x(d.axis) + rad_x.bandwidth() + 0.17)
                .padAngle(0.01)
                .padRadius(innerRadius))
                .on("mouseover", function(d) {
                    console.log('mouseover tip')
                    console.log(d.value_remit)
                    d3.select("#tooltip")
                        .transition()		
                        .duration(200)		
                        .style("opacity", .9)
                        .style("left", (d3.event.pageX-650) + "px" )
                        .style("top", (d3.event.pageY-900) + "px")
                        .select("#value")
                    //   .data(spider_dataset)
                        .html("<p>"  + String(d.value_diff) +  "% " + String(d.expenses) + " expenses increase per month " + "<br>" +
                        "household with remittances: " + String(d.value_remit) + " $ " + "<br>" +
                        "household without remittaces: " + String(d.value_noremit) + " $ " + "</p>")
                        .style("font-size", "11px")})
                    // d3.select("#tooltip")
                    // .classed("hidden", false);
                    // })
                .on("mouseout", function() {
                    console.log('mouseover out')
                    // d3.select("#tooltip")
                    // .classed("hidden", true);
                });

        var rad_labels = spid_g.selectAll('.rad-labels').data(spider_dataset)

        rad_labels.enter()
            .append('g')
            .attr('class', 'rad-labels')
            .attr("text-anchor", function(d) { return (rad_x(d.axis) + rad_x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "end" : "start"; })
            .attr("transform", function(d) {return "rotate(" + (10 + (rad_x(d.axis) + rad_x.bandwidth() / 2) * 180 / Math.PI -90) + ")"+"translate(" + (rad_y(d['value_diff']<0) + 160) + "," +  0 + ")"; })
            .append("text")
            .attr("transform", function(d) { return (rad_x(d.axis) + rad_x.bandwidth() / 2 + Math.PI) % (2 * Math.PI) < Math.PI ? "rotate(180)" : "rotate(0)"; })
            .text(function(d) { return (d.expenses); })
            .style("font-size", "14px")
            .attr("alignment-baseline", "middle");

        const country = [["Guatemala",'#033F63'], ["El Salvador",'#2B7068'],["Honduras",'#6F9954'] ]

        //legend
        spider_legend_rect = spid_g.selectAll('.spider-legend-rect').data(country)
        spider_legend_rect
            .enter()
            .append("rect")
                .attr('class', 'spider-legend-rect')
                .attr("y", (d, i) => (i * 25 + 250))
                .attr("x", 200)
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", d=>d[1])
                .attr('opacity', 0);

        spider_legend_text = spid_g.selectAll('.spider-legend-text').data(country)
        spider_legend_text.enter()
            .append("text")
                .attr('class', 'spider-legend-rect')
                .attr("y", (d, i) => (i * 25 +265))
                .attr("x", 230)
                .attr("text-anchor", "start")
                .text(d => d[0])
                .attr('opacity', 0);

        
        // axis
        g.append('g')
            .attr('class', 'xAxis')
            .attr('transform', 'translate(' + (margin.left + chartMargin.left) + ',' + (margin.top + chartMargin.top + chartHeight) + ')')
            .call(xAxisBar)
            .style('opacity', 0);
        g.select('.xAxis').style('opacity', 0);

        // axis
        g.append('g')
            .attr('class', 'xSharesAxis')
            .attr('transform', 'translate(' + (margin.left + chartMargin.left) + ',' + (margin.top + chartMargin.top + chartHeight) + ')')
            .call(xShareAxisBar)
            .style('opacity', 0);
        g.select('.xSharesAxis').style('opacity', 0);

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
            .text('Total Monthly Household Expenditures per capita');

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

        g.append('text')
            .attr('class', 'title health-title')
            .attr('x', margin.left)
            .attr('y', margin.top)
            .text('Monthly Spending on Healthcare per capita');
    
        g.append('text')
            .attr('class', 'sub-title health-title')
            .attr('x', margin.left)
            .attr('y', margin.top + 20)
            .text('Median by country');

        g.selectAll('.health-title')
            .attr('opacity', 0);

        g.append('text')
            .attr('class', 'title shares-health-title')
            .attr('x', margin.left)
            .attr('y', margin.top)
            .text('Share of Households Spending Money on Healthcare');
    
        g.append('text')
            .attr('class', 'sub-title shares-health-title')
            .attr('x', margin.left)
            .attr('y', margin.top + 20)
            .text('By country');

        g.selectAll('.share-health-title')
            .attr('opacity', 0);

        g.append('text')
            .attr('class', 'title save-title')
            .attr('x', margin.left)
            .attr('y', margin.top)
            .text('Monthly Savings per capita');
    
        g.append('text')
            .attr('class', 'sub-title save-title')
            .attr('x', margin.left)
            .attr('y', margin.top + 20)
            .text('Median by country');
        
        g.selectAll('.save-title')
            .attr('opacity', 0);

        g.append('text')
            .attr('class', 'title shares-save-title')
            .attr('x', margin.left)
            .attr('y', margin.top)
            .text('Share of Households Saving Money');
    
        g.append('text')
            .attr('class', 'sub-title shares-save-title')
            .attr('x', margin.left)
            .attr('y', margin.top + 20)
            .text('By country');

        g.selectAll('.shares-save-title')
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
            .data(function(d) { return Array({country: d.country, type:'No Remittances', 'value':d.no_remit},{country:d.country, type:'Remittances',value:d.remit})})
            .enter().append("rect").attr('class', 'exp-bar')
            ;

        exp_barsE
            .attr('x', 0)
            .attr('y', function (d, i) {return ySubBarScale(d.type);})
            .attr('fill', function (d) {return barColors(d.type+d.country); })
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
            .text(function (d, i) {return '$' + d.value.toFixed(1)})
            .attr('x',  xBarScale(1))
            .attr('y', function (d, i) { return (ySubBarScale(d.type) + (0.5* ySubBarScale.bandwidth()));})
            .attr('opacity', 0)
            .attr('fill', 'white')
            .attr('font-size', '14pt')
            .attr('text-anchor', 'start')
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')

        var exp_diff_text = g.selectAll('.exp-bar-diff-text').data(exp_data);
        exp_diff_text.enter()
            .append('text')
            .attr('class', 'exp-bar-diff-text')
            .text((d,i) => '+$' + (d.remit - d.no_remit).toFixed(1))
            .attr('x',0)
            .attr('dx', d=> xBarScale(d.no_remit + 1))
            .attr('y',d => yBarScale(d.country)  + 0.5 * ySubBarScale.bandwidth())
            .attr('text-anchor', 'start')
            .attr('opacity',0)
            .attr('fill', '#FA6E06')
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
            .data(function(d) { return Array({country: d.country, type:'No Remittances', 'value':d.no_remit},{country:d.country, type:'Remittances',value:d.remit})})
            .enter().append("rect").attr('class', 'food-bar')
            ;

        food_barsE
            .attr('x', 0)
            .attr('y', function (d, i) {return ySubBarScale(d.type);})
            .attr('fill', function (d) {return barColors(d.type+d.country); })
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
            .attr('x',  xBarScale(1))
            .attr('y', function (d, i) { return (ySubBarScale(d.type) + (0.5* ySubBarScale.bandwidth()));})
            .attr('opacity', 0)
            .attr('fill', 'white')
            .attr('font-size', '14pt')
            .attr('text-anchor', 'start')
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')

        var food_diff_text = g.selectAll('.food-bar-diff-text').data(food_data);
        food_diff_text.enter()
            .append('text')
            .attr('class', 'food-bar-diff-text')
            .text((d,i) => '+$' + (d.remit - d.no_remit).toFixed(1))
            .attr('x',0)
            .attr('dx', d=> xBarScale(d.no_remit + 1))
            .attr('y',d => yBarScale(d.country)  + 0.5 * ySubBarScale.bandwidth())
            .attr('text-anchor', 'start')
            .attr('opacity',0)
            .attr('fill', '#FA6E06')
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')

        // barchart
        // @v4 Using .merge here to ensure
        // new and old data have same attrs applied
        var health_bars = g.selectAll('.health-bar-group').data(health_data);
        var health_barsE = health_bars.enter()
            .append('g')
            .attr('class', 'health-bar-group')
            .attr("transform", function(d) {return "translate(0," + (yBarScale(d.country)) + ")"; })
            .selectAll("rect")
            .data(function(d) { return Array({country: d.country, type:'No Remittances', 'value':d.no_remit},{country:d.country, type:'Remittances',value:d.remit})})
            .enter().append("rect").attr('class', 'health-bar')
            ;

        health_barsE
            .attr('x', 0)
            .attr('y', function (d, i) {return ySubBarScale(d.type);})
            .attr('fill', function (d) {return barColors(d.type+d.country); })
            .attr('width', 0)
            .attr('height', ySubBarScale.bandwidth())
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')
            ;

        health_bars = health_bars.merge(health_barsE)

        var health_barNum = g.selectAll('.health-bar-num-group').data(health_data);
        health_barNum.enter()
            .append('g')
            .attr('class', 'health-bar-num-group')
            .attr("transform", function(d) {return "translate(0," + (yBarScale(d.country)) + ")"; })
            .selectAll("text")
            .data(function(d) { return Array({type:'No Remittances', 'value':d.no_remit},{type:'Remittances',value:d.remit})})
            .enter().append("text").attr('class', 'health-bar-num')
            .text((d,i) => '$' + d.value.toFixed(1))
            .attr('x',  xBarScale(1))
            .attr('y', function (d, i) { return (ySubBarScale(d.type) + (0.5* ySubBarScale.bandwidth()));})
            .attr('opacity', 0)
            .attr('fill', 'white')
            .attr('font-size', '14pt')
            .attr('text-anchor', 'start')
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')

        var health_diff_text = g.selectAll('.health-bar-diff-text').data(health_data);
        health_diff_text.enter()
            .append('text')
            .attr('class', 'health-bar-diff-text')
            .text((d,i) => '+$' + (d.remit - d.no_remit).toFixed(1))
            .attr('x',0)
            .attr('dx', d=> xBarScale(d.no_remit + 1))
            .attr('y',d => yBarScale(d.country)  + 0.5 * ySubBarScale.bandwidth())
            .attr('text-anchor', 'start')
            .attr('opacity',0)
            .attr('fill', '#FA6E06')
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')

        // barchart
        // @v4 Using .merge here to ensure
        // new and old data have same attrs applied
        var save_bars = g.selectAll('.save-bar-group').data(save_data);
        var save_barsE = save_bars.enter()
            .append('g')
            .attr('class', 'save-bar-group')
            .attr("transform", function(d) {return "translate(0," + (yBarScale(d.country)) + ")"; })
            .selectAll("rect")
            .data(function(d) { return Array({country: d.country, type:'No Remittances', 'value':d.no_remit},{country:d.country, type:'Remittances',value:d.remit})})
            .enter().append("rect").attr('class', 'save-bar')
            ;

        save_barsE
            .attr('x', 0)
            .attr('y', function (d, i) {return ySubBarScale(d.type);})
            .attr('fill', function (d) {return barColors(d.type+d.country); })
            .attr('width', 0)
            .attr('height', ySubBarScale.bandwidth())
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')
            ;

        save_bars = save_bars.merge(save_barsE)

        var save_barNum = g.selectAll('.save-bar-num-group').data(save_data);
        save_barNum.enter()
            .append('g')
            .attr('class', 'save-bar-num-group')
            .attr("transform", function(d) {return "translate(0," + (yBarScale(d.country)) + ")"; })
            .selectAll("text")
            .data(function(d) { return Array({type:'No Remittances', 'value':d.no_remit},{type:'Remittances',value:d.remit})})
            .enter().append("text").attr('class', 'save-bar-num')
            .text((d,i) => '$' + d.value.toFixed(1))
            .attr('x',  xBarScale(1))
            .attr('y', function (d, i) { return (ySubBarScale(d.type) + (0.5* ySubBarScale.bandwidth()));})
            .attr('opacity', 0)
            .attr('fill', 'white')
            .attr('font-size', '14pt')
            .attr('text-anchor', 'start')
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')

        var save_diff_text = g.selectAll('.save-bar-diff-text').data(save_data);
        save_diff_text.enter()
            .append('text')
            .attr('class', 'save-bar-diff-text')
            .text((d,i) => '+$' + (d.remit - d.no_remit).toFixed(1))
            .attr('x',0)
            .attr('dx', d=> xBarScale(d.no_remit + 1))
            .attr('y',d => yBarScale(d.country)  + 0.5 * ySubBarScale.bandwidth())
            .attr('text-anchor', 'start')
            .attr('opacity',0)
            .attr('fill', '#FA6E06')
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')

        // // Add one dot in the legend for each name.
        // legendDots = g.selectAll("legend-dots")
        // .data(ySubGroupValues);

        // legendDots.enter()
        //     .append("circle")
        //     .attr('class', 'legend-dots')
        //     .attr("cx", function(d,i){ return chartMargin.left + margin.left + i*150})
        //     .attr("cy", visHeight - margin.bottom + 25) // 100 is where the first dot appears. 25 is the distance between dots
        //     .attr("r", 7)
        //     .style("fill", function(d){ return barColors(d)})
        //     .attr('opacity',0)

        // // Add one dot in the legend for each name.
        // legendLabels = g.selectAll("legend-labels")
        // .data(ySubGroupValues);
        // legendLabels.enter()
        // .append("text")
        //     .attr('class', 'legend-labels')
        //     .attr("x", function(d,i){ return 15 + chartMargin.left + margin.left + i*150})
        //     .attr("y", visHeight - margin.bottom + 25)
        //     .style("fill", 'black')
        //     .text(function(d){ return d})
        //     .attr("text-anchor", "left")
        //     .style("alignment-baseline", "middle")
        //     .attr('opacity',0)

        // barchart
        // @v4 Using .merge here to ensure
        // new and old data have same attrs applied
        var health_share_bars = g.selectAll('.health-bar-shares-group').data(health_shares);
        var health_share_barsE = health_share_bars.enter()
            .append('g')
            .attr('class', 'health-shares-bar-group')
            .attr("transform", function(d) {return "translate(0," + (yBarScale(d.country)) + ")"; })
            .selectAll("rect")
            .data(function(d) { return Array({country: d.country, type:'No Remittances', 'value':d.no_remit},{country:d.country, type:'Remittances',value:d.remit})})
            .enter().append("rect").attr('class', 'health-share-bar')
            ;

        health_share_barsE
            .attr('x', 0)
            .attr('y', function (d, i) {return ySubBarScale(d.type);})
            .attr('fill', function (d) {return barColors(d.type+d.country); })
            .attr('width', 0)
            .attr('height', ySubBarScale.bandwidth())
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')
            ;

        health_share_bars = health_share_bars.merge(health_share_barsE)

        var health_share_barNum = g.selectAll('.health-share-bar-num-group').data(health_shares);
        health_share_barNum.enter()
            .append('g')
            .attr('class', 'health-share-bar-num-group')
            .attr("transform", function(d) {return "translate(0," + (yBarScale(d.country)) + ")"; })
            .selectAll("text")
            .data(function(d) { return Array({type:'No Remittances', 'value':d.no_remit},{type:'Remittances',value:d.remit})})
            .enter().append("text").attr('class', 'health-share-bar-num')
            .text((d,i) => d.value.toFixed(2))
            .attr('x',  xShareBarScale(1))
            .attr('y', function (d, i) { return (ySubBarScale(d.type) + (0.5* ySubBarScale.bandwidth()));})
            .attr('opacity', 0)
            .attr('fill', 'white')
            .attr('font-size', '14pt')
            .attr('text-anchor', 'start')
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')

        var health_share_diff_text = g.selectAll('.health-share-bar-diff-text').data(health_shares);
        health_share_diff_text.enter()
            .append('text')
            .attr('class', 'health-share-bar-diff-text')
            .text((d,i) => (d.remit - d.no_remit).toFixed(0) + '%')
            .attr('x',0)
            .attr('dx', d=> xShareBarScale(d.no_remit + 1))
            .attr('y',d => yBarScale(d.country)  + 0.5 * ySubBarScale.bandwidth())
            .attr('text-anchor', 'start')
            .attr('opacity',0)
            .attr('fill', '#FA6E06')
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')


        // barchart
        // @v4 Using .merge here to ensure
        // new and old data have same attrs applied
        var save_share_bars = g.selectAll('.save-bar-shares-group').data(save_shares);
        var save_share_barsE = save_share_bars.enter()
            .append('g')
            .attr('class', 'save-shares-bar-group')
            .attr("transform", function(d) {return "translate(0," + (yBarScale(d.country)) + ")"; })
            .selectAll("rect")
            .data(function(d) { return Array({country: d.country, type:'No Remittances', 'value':d.no_remit},{country:d.country, type:'Remittances',value:d.remit})})
            .enter().append("rect").attr('class', 'save-share-bar')
            ;

        save_share_barsE
            .attr('x', 0)
            .attr('y', function (d, i) {return ySubBarScale(d.type);})
            .attr('fill', function (d) {return barColors(d.type+d.country); })
            .attr('width', 0)
            .attr('height', ySubBarScale.bandwidth())
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')
            ;

        save_share_bars = save_share_bars.merge(save_share_barsE)

        var save_share_barNum = g.selectAll('.save-share-bar-num-group').data(save_shares);
        save_share_barNum.enter()
            .append('g')
            .attr('class', 'save-share-bar-num-group')
            .attr("transform", function(d) {return "translate(0," + (yBarScale(d.country)) + ")"; })
            .selectAll("text")
            .data(function(d) { return Array({type:'No Remittances', 'value':d.no_remit},{type:'Remittances',value:d.remit})})
            .enter().append("text").attr('class', 'save-share-bar-num')
            .text((d,i) => d.value.toFixed(2))
            .attr('x',  xShareBarScale(1))
            .attr('y', function (d, i) { return (ySubBarScale(d.type) + (0.5* ySubBarScale.bandwidth()));})
            .attr('opacity', 0)
            .attr('fill', 'white')
            .attr('font-size', '14pt')
            .attr('text-anchor', 'start')
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')

        var save_share_diff_text = g.selectAll('.save-share-bar-diff-text').data(save_shares);
        save_share_diff_text.enter()
            .append('text')
            .attr('class', 'save-share-bar-diff-text')
            .text((d,i) => (d.remit - d.no_remit).toFixed(0) + '%')
            .attr('x',0)
            .attr('dx', d=> xShareBarScale(d.no_remit + 1))
            .attr('y',d => yBarScale(d.country)  + 0.5 * ySubBarScale.bandwidth())
            .attr('text-anchor', 'start')
            .attr('opacity',0)
            .attr('fill', '#FA6E06')
            .attr('transform', 'translate(' + (chartMargin.left + margin.left) + ',' + (chartMargin.top + margin.top) + ')')

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
        activateFunctions[2] = showExpPointer;
        activateFunctions[3] = showFoodBarChart;
        activateFunctions[4] = showHealthSharesBarChart;
        activateFunctions[5] = showHealthBarChart;
        activateFunctions[6] = showSaveSharesBarChart;
        activateFunctions[7] = showSaveBarChart;
        activateFunctions[8] = showSpiderChart;

        // updateFunctions are called while
        // in a particular section to update
        // the scroll progress in that section.
        // Most sections do not need to be updated
        // for all scrolling and so are set to
        // no-op functions.
        updateFunctions[0] = function () {};
        // updateFunctions[1] = addRemitExp;
        updateFunctions[1] = function () {};

        updateFunctions[2] = function () {};
        updateFunctions[3] = function () {};
        updateFunctions[4] = function () {};
        updateFunctions[5] = function () {};
        updateFunctions[6] = function () {};
        updateFunctions[7] = function () {};
        updateFunctions[8] = function () {};

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
        if (chartType !== "isExpBar" & chartType !== 'isExpPointer') {
            hideXAxis()
            hideYAxis()
            svg.selectAll('.exp-title').transition().duration(0).attr('opacity', 0);
            svg.selectAll('.exp-bar').transition().duration(300).attr('width', 0);
            svg.selectAll('.exp-bar-num').transition().duration(300).attr('opacity', 0);
            svg.selectAll('.exp-bar-diff-text').transition().duration(300).attr('opacity', 0);

        }
        if (chartType !== "isFoodBar") {
            hideXAxis()
            hideYAxis()
            svg.selectAll('.food-title').transition().duration(0).attr('opacity', 0);
            svg.selectAll('.food-bar').transition().duration(300).attr('width', 0);
            svg.selectAll('.food-bar-num').transition().duration(300).attr('opacity', 0);
            svg.selectAll('.food-bar-diff-text').transition().duration(300).attr('opacity', 0);

        }

        if (chartType !== "isHealthBar") {
            hideXAxis()
            hideYAxis()
            svg.selectAll('.health-title').transition().duration(0).attr('opacity', 0);
            svg.selectAll('.health-bar').transition().duration(300).attr('width', 0);
            svg.selectAll('.health-bar-num').transition().duration(300).attr('opacity', 0);
            svg.selectAll('.health-bar-diff-text').transition().duration(300).attr('opacity', 0);

        }

        if (chartType !== "isHealthShareBar") {
            hideSharesXAxis()
            hideYAxis()
            svg.selectAll('.shares-health-title').transition().duration(0).attr('opacity', 0);
            svg.selectAll('.health-share-bar').transition().duration(300).attr('width', 0);
            svg.selectAll('.health-share-bar-num').transition().duration(300).attr('opacity', 0);
            svg.selectAll('.health-share-bar-diff-text').transition().duration(300).attr('opacity', 0);

        }

        if (chartType !== "isSaveBar") {
            hideXAxis()
            hideYAxis()
            svg.selectAll('.save-title').transition().duration(0).attr('opacity', 0);
            svg.selectAll('.save-bar').transition().duration(300).attr('width', 0);
            svg.selectAll('.save-bar-num').transition().duration(300).attr('opacity', 0);
            svg.selectAll('.save-bar-diff-text').transition().duration(300).attr('opacity', 0);

        }

        if (chartType !== "isSaveShareBar") {
            hideSharesXAxis()
            hideYAxis()
            svg.selectAll('.shares-save-title').transition().duration(0).attr('opacity', 0);
            svg.selectAll('.save-share-bar').transition().duration(300).attr('width', 0);
            svg.selectAll('.save-share-bar-num').transition().duration(300).attr('opacity', 0);
            svg.selectAll('.save-share-bar-diff-text').transition().duration(300).attr('opacity', 0);

        }

        if (chartType !== "isSpiderChart") {
            svg.selectAll('.circles').transition().duration(0).attr('opacity', 0);
            svg.selectAll('.circles-zero').transition().duration(0).attr('opacity', 0);
            svg.selectAll('.circleLabels').transition().duration(0).attr('opacity', 0);
            svg.selectAll('.rad-bars').transition().duration(0).attr('opacity', 0);
            svg.selectAll('.rad-labels').transition().duration(0).attr('opacity', 0);
            svg.selectAll('.spider-legend-text').transition().duration(0).attr('opacity', 0);
            svg.selectAll('.spider-legend-rect').transition().duration(0).attr('opacity', 0);

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
        showXAxis(xBarScale);
        showYAxis(yBarScale);
        g.selectAll('.exp-title')
            .transition()
            .duration(300)
            .attr('opacity', 1.0);

        g.selectAll('.exp-bar')
          .transition()
          .delay(function (d, i) { if (i%2==0) {return 200 * (i + 1)} else {return 600 + 300 * (i+1)};})
          .duration(function (d, i) { if (i%2==0) {return 300} else {return 1000};})
          .attr('width', function(d) {return xBarScale(d.value);});
 
        // g.selectAll('.exp-bar-num')
        //   .transition()
        //   .delay(function (d, i) { return 400 + 300 * (i + 1);})
        //   .duration(300)
        //   .attr('opacity', 1);

        g.selectAll('.exp-bar-diff-text')
          .transition()
          .delay(function (d, i) { return 900 + 400 * (i + 1);})
          .duration(1000)
          .attr('opacity', 1);

    }

    function showExpPointer() {
        showExpBarChart();

    }

    function showFoodBarChart() {
        clean('isFoodBar');
        showXAxis(xBarScale);

        showYAxis(yBarScale);

        g.selectAll('.food-title')
        .transition()
        .duration(300)
        .attr('opacity', 1.0);

        g.selectAll('.food-bar')
          .transition()
          .delay(function (d, i) { if (i%2==0) {return 200 * (i + 1)} else {return 600 + 300 * (i+1)};})
          .duration(function (d, i) { if (i%2==0) {return 300} else {return 1000};})
          .attr('width', function(d) {return xBarScale(d.value);});
 
        // g.selectAll('.food-bar-num')
        //   .transition()
        //   .delay(function (d, i) { return 400 + 300 * (i + 1);})
        //   .duration(300)
        //   .attr('opacity', 1);

        g.selectAll('.food-bar-diff-text')
          .transition()
          .delay(function (d, i) { return 900 + 400 * (i + 1);})
          .duration(1000)
          .attr('opacity', 1);


    }

    function showHealthBarChart() {
        clean('isHealthBar');
        showXAxis(xBarScale);

        showYAxis(yBarScale);

        g.selectAll('.health-title')
        .transition()
        .duration(300)
        .attr('opacity', 1.0);

        g.selectAll('.health-bar')
          .transition()
          .delay(function (d, i) { if (i%2==0) {return 200 * (i + 1)} else {return 600 + 300 * (i+1)};})
          .duration(function (d, i) { if (i%2==0) {return 300} else {return 1000};})
          .attr('width', function(d) {return xBarScale(d.value);});
 
        // g.selectAll('.health-bar-num')
        //   .transition()
        //   .delay(function (d, i) { return 400 + 300 * (i + 1);})
        //   .duration(300)
        //   .attr('opacity', 1);

        g.selectAll('.health-bar-diff-text')
          .transition()
          .delay(function (d, i) { return 900 + 400 * (i + 1);})
          .duration(1000)
          .attr('opacity', 1);


    }

    function showHealthSharesBarChart() {
        clean('isHealthSharesBar');
        showSharesXAxis(xShareBarScale);

        showYAxis(yBarScale);

        g.selectAll('.shares-health-title')
        .transition()
        .duration(300)
        .attr('opacity', 1.0);

        g.selectAll('.health-share-bar')
          .transition()
          .delay(function (d, i) { if (i%2==0) {return 200 * (i + 1)} else {return 600 + 300 * (i+1)};})
          .duration(function (d, i) { if (i%2==0) {return 300} else {return 1000};})
          .attr('width', function(d) {return xShareBarScale(d.value);});
 
        // g.selectAll('.health-bar-num')
        //   .transition()
        //   .delay(function (d, i) { return 400 + 300 * (i + 1);})
        //   .duration(300)
        //   .attr('opacity', 1);

        g.selectAll('.health-share-bar-diff-text')
          .transition()
          .delay(function (d, i) { return 900 + 400 * (i + 1);})
          .duration(1000)
          .attr('opacity', 1);


    }

    function showSaveBarChart() {
        clean('isSaveBar');
        showXAxis(xBarScale);

        showYAxis(yBarScale);

        g.selectAll('.save-title')
        .transition()
        .duration(300)
        .attr('opacity', 1.0);

        g.selectAll('.save-bar')
          .transition()
          .delay(function (d, i) { if (i%2==0) {return 200 * (i + 1)} else {return 600 + 300 * (i+1)};})
          .duration(function (d, i) { if (i%2==0) {return 300} else {return 1000};})
          .attr('width', function(d) {return xBarScale(d.value);});
 
        // g.selectAll('.save-bar-num')
        //   .transition()
        //   .delay(function (d, i) { return 400 + 300 * (i + 1);})
        //   .duration(300)
        //   .attr('opacity', 1);

        g.selectAll('.save-bar-diff-text')
          .transition()
          .delay(function (d, i) { return 900 + 400 * (i + 1);})
          .duration(1000)
          .attr('opacity', 1);

    }

    function showSaveSharesBarChart() {
        clean('isSaveSharesBar');
        showSharesXAxis(xShareBarScale);

        showYAxis(yBarScale);

        g.selectAll('.shares-save-title')
        .transition()
        .duration(300)
        .attr('opacity', 1.0);

        g.selectAll('.save-share-bar')
          .transition()
          .delay(function (d, i) { if (i%2==0) {return 200 * (i + 1)} else {return 600 + 300 * (i+1)};})
          .duration(function (d, i) { if (i%2==0) {return 300} else {return 1000};})
          .attr('width', function(d) {return xShareBarScale(d.value);});
 
        // g.selectAll('.save-bar-num')
        //   .transition()
        //   .delay(function (d, i) { return 400 + 300 * (i + 1);})
        //   .duration(300)
        //   .attr('opacity', 1);

        g.selectAll('.save-share-bar-diff-text')
          .transition()
          .delay(function (d, i) { return 900 + 400 * (i + 1);})
          .duration(1000)
          .attr('opacity', 1);


    }

    function showSpiderChart() {
        clean('isSpiderChart');

        g.selectAll('.circles')
            .transition()
            .duration(300)
            .attr('opacity',1);

        // g.selectAll('.circles-zero')
        //     .transition()
        //     .duration(300)
        //     .attr('opacity',1);

        g.selectAll('.circleLabels')
            .transition()
            .duration(300)
            .attr('opacity',1);

        g.selectAll('.rad-bars')
            .transition()
            .ease(d3.easeBounce)
            .duration(600)
            .delay(100)          
            .attr('opacity',1);

        g.selectAll('.rad-labels')
            .transition()
            .duration(300)
            .attr('opacity',1);

        g.selectAll('.spider-legend-rect')
            .transition()
            .duration(300)
            .attr('opacity',1);  

        g.selectAll('.spider-legend-text')
            .transition()
            .duration(300)
            .attr('opacity',1);

        // spider_g.selectAll('path')
        //     .transition()
        //     .ease(d3.easeBounce)
        //     .duration(600)
        //     .delay(1200);
        // add Spider chart elements to appear
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
    function showSharesXAxis(axis) {
        g.select('.xSharesAxis')
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
    
    function hideSharesXAxis() {
        svg.select('.xSharesAxis')
        .transition().duration(300)
        .style('opacity', 0);
    }

    function hideYAxis() {
        svg.select('.yAxis')
        .transition().duration(300)
        .style('opacity', 0);
    }

      /**
     * addRemitExp - adds remittance numbers to monthly expenditure chart
     *
     * @param progress - 0.0 - 1.0 -
     *  how far user has scrolled in section
     */
    function addRemitExp(progress) {

        g.selectAll('.exp-bar-remit')
            .transition()
            .delay(function (d, i) { return 200 * (i + 1);})
            .duration(0)
            .attr('width', function(d) {console.log(xBarScale(d.no_remit) + (progress * (xBarScale(d.remit) - xBarScale(d.no_remit)))); 
                return (progress * (xBarScale(d.remit) - xBarScale(d.no_remit)));});
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

    // function expDiff(data) {
    //     let temp_data = data.filter(function(d) {return d.expense_type != 'monthly_expenditure_pc'} )
    //     let GT = Array();
    //     let HND = Array();
    //     let SLV = Array();
    //     for (let i = 0; i < temp_data.length; i++) {
    //         GT.push({'expense_type':temp_data[i].expense_type, 'No Remittances': temp_data[i].gt_noremit, 'Remittances': temp_data[i].gt_remit, 'diff': temp_data[i].gt_remit - temp_data[i].gt_noremit, 'percDiff': (temp_data[i].gt_remit - temp_data[i].gt_noremit) / temp_data[i].gt_noremit})
    //         HND.push({'expense_type':temp_data[i].expense_type, 'No Remittances': temp_data[i].hnd_noremit, 'Remittances': temp_data[i].hnd_remit, 'diff': temp_data[i].gt_remit - temp_data[i].gt_noremit, 'percDiff': (temp_data[i].hnd_remit - temp_data[i].hnd_noremit) / temp_data[i].hnd_noremit})
    //         SLV.push({'expense_type':temp_data[i].expense_type, 'No Remittances': temp_data[i].slv_noremit, 'Remittances': temp_data[i].slv_remit, 'diff': temp_data[i].gt_remit - temp_data[i].gt_noremit, 'percDiff': (temp_data[i].slv_remit - temp_data[i].slv_noremit) / temp_data[i].slv_noremit})
    //     }
    //     return Array({'country': 'Guatemala', 'values': GT}, {'country': 'Honduras', 'values': HND}, {'country': 'El Salvador', 'values': SLV})
    // }

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
    function display(all_data) {
        // create a new plot and
        // display it
        var plot = scrollVis();
        d3.select('#vis')
            .datum(all_data)
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
Promise.all([
    d3.csv('website_data/expenditures.csv', function(d){
            return {
                expense_type: d.variable,
                gt_noremit: +d.GT_noremit,
                gt_remit: +d.GT_remit,
                hnd_noremit: +d.HND_noremit,
                hnd_remit: +d.HND_remit,        
                slv_noremit: +d.SLV_noremit,
                slv_remit: +d.SLV_remit
            }}),
    d3.csv('website_data/aggregate_expenditures.csv', function(d) {
        return {
            axis: d.axis,
            color: d.color,
            country: d.country,
            expenses: d.expenses,
            value_diff: +d.value_diff,
            value_noremit: +d.value_noremit,
            value_remit: +d.value_remit
        }
    }),
    d3.csv('website_data/spending_shares.csv', function(d) {
        return {
            expense_type: d.variable,
            gt_noremit: +d.GT_noremit *100,
            gt_remit: +d.GT_remit*100,
            hnd_noremit: +d.HND_noremit*100,
            hnd_remit: +d.HND_remit*100,        
            slv_noremit: +d.SLV_noremit*100,
            slv_remit: +d.SLV_remit*100
        }
    }),
]).then(function(files) {
    bar_data = files[0]
    spider_data = files[1]
    shares_data = files[2]
    all_data = Array({data: Array({chartType: 'bar', data:bar_data}, {chartType: 'spider',data:spider_data}, {chartType: 'shares',data:shares_data})});

    display(all_data)
})
