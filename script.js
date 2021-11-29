var w = 500,
	h = 500;

var colorscale = d3.scale.category20b();

//Legend titles
var LegendOptions = ['GT_diff','HND_diff','SLV_diff'];

//Data
var d =[[
 {
   axis: "exp_monthly_communication_pc",
   value: 0.6
 },
 {
   axis: "exp_monthly_drinking_water_pc",
   value: 0.108333333
 },
 {
   axis: "exp_monthly_electric_power_pc",
   value: 0.5
 },
 {
   axis: "exp_monthly_food_pc",
   value: 0.333333333
 },
 {
   axis: "exp_monthly_fuel_pc",
   value: -0.031055901
 },
 {
   axis: "exp_monthly_hygiene_pc",
   value: 0.632653061
 },
 {
   axis: "exp_monthly_transport_pc",
   value: 0.166666667
 },
 {
   axis: "exp_monthly_water_pc",
   value: 0.577464789
 }
],
[
 {
   axis: "exp_monthly_communication_pc",
   value: 0.828571429
 },
 {
   axis: "exp_monthly_drinking_water_pc",
   value: 1.18
 },
 {
   axis: "exp_monthly_electric_power_pc",
   value: 0.5625
 },
 {
   axis: "exp_monthly_food_pc",
   value: 0.229166667
 },
 {
   axis: "exp_monthly_fuel_pc",
   value: 2.712820513
 },
 {
   axis: "exp_monthly_hygiene_pc",
   value: 0.125
 },
 {
   axis: "exp_monthly_transport_pc",
   value: 1
 },
 {
   axis: "exp_monthly_water_pc",
   value: 0.25
 }
],
[
 {
   axis: "exp_monthly_communication_pc",
   value: 0.12
 },
 {
   axis: "exp_monthly_drinking_water_pc",
   value: 0.666666667
 },
 {
   axis: "exp_monthly_electric_power_pc",
   value: -0.08
 },
 {
   axis: "exp_monthly_food_pc",
   value: 0.25
 },
 {
   axis: "exp_monthly_fuel_pc",
   value: -0.071428571
 },
 {
   axis: "exp_monthly_hygiene_pc",
   value: 0.2
 },
 {
   axis: "exp_monthly_transport_pc",
   value: 0.2
 },
 {
   axis: "exp_monthly_water_pc",
   value: 0
 }
]

		];

//Options for the Radar chart, other than default
var mycfg = {
  w: w,
  h: h,
  maxValue: 0.6,
  levels: 6,
  ExtraWidthX: 300
}

//Call function to draw the Radar chart
//Will expect that data is in %'s
RadarChart.draw("#chart", d, mycfg);

////////////////////////////////////////////
/////////// Initiate legend ////////////////
////////////////////////////////////////////

var svg = d3.select('#body')
	.selectAll('svg')
	.append('svg')
	.attr("width", w+300)
	.attr("height", h)

//Create the title for the legend
var text = svg.append("text")
	.attr("class", "title")
	.attr('transform', 'translate(90,0)')
	.attr("x", w - 70)
	.attr("y", 10)
	.attr("font-size", "12px")
	.attr("fill", "#404040")
	.text("Percent change per category");

//Initiate Legend
var legend = svg.append("g")
	.attr("class", "legend")
	.attr("height", 100)
	.attr("width", 200)
	.attr('transform', 'translate(90,20)')
	;
	//Create colour squares
	legend.selectAll('rect')
	  .data(LegendOptions)
	  .enter()
	  .append("rect")
	  .attr("x", w - 65)
	  .attr("y", function(d, i){ return i * 20;})
	  .attr("width", 10)
	  .attr("height", 10)
	  .style("fill", function(d, i){ return colorscale(i);})
	  ;
	//Create text next to squares
	legend.selectAll('text')
	  .data(LegendOptions)
	  .enter()
	  .append("text")
	  .attr("x", w - 52)
	  .attr("y", function(d, i){ return i * 20 + 9;})
	  .attr("font-size", "11px")
	  .attr("fill", "#737373")
	  .text(function(d) { return d; })
	  ;
