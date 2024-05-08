document.addEventListener("DOMContentLoaded", function () {
  d3.json("/countries", function (data) {
    var countryDropdown = d3.select("#country");

    data.countries.forEach(function (country) {
      countryDropdown.append("option").text(country);
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  d3.json("/regions", function (data) {
    var regionDropdown = d3.select("#region");

    data.regions.forEach(function (region) {
      regionDropdown.append("option").text(region);
    });
  });
});
document.addEventListener("DOMContentLoaded", function () {
  d3.json("/years", function (data) {
    var yearDropdown = d3.select("#year");

    data.years.forEach(function (year) {
      yearDropdown.append("option").text(year);
    });
  });
});


// Load the map data
d3.json(
  "https://unpkg.com/world-atlas@2.0.2/countries-50m.json",
  function (error, data) {
    if (error) throw error;
    mapData = data;

    // Load the country data from the Flask backend
    d3.json("/data", function (error, data) {
      if (error) throw error;
      countryData = data;
      initializeMap(countryData);
    });
  }
);
var projection;
let selectedContinent; // Define selectedContinent as a global variable

function initializeMap(countryData) {
  const width = 800;
  const height = 300;

  const svg = d3
    .select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

   projection = d3
    .geoMercator()
    .scale(120)
    .translate([width / 2, height / 1.5]);

  const path = d3.geoPath().projection(projection);

  // Set a single color for all countries
  const color = "#67c3a5";

  // Draw the map with the single color
  const countries = svg
    .selectAll(".country")
    .data(topojson.feature(mapData, mapData.objects.countries).features)
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("d", path)
    .style("fill", color);

  // Add emoji markers
  const markers = svg
    .append("g")
    .attr("class", "markers")
    .selectAll(".marker")
    .data(countryData)
    .enter()
    .append("text")
    .attr("class", "marker")
    .attr("x", (d) => projection([d.Longitude, d.Latitude])[0])
    .attr("y", (d) => projection([d.Longitude, d.Latitude])[1])
    .style("font-size", "20px") // Set initial font size
    .text((d) => d.Emoji);

  // Add tooltips
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  markers
    .on("mouseover", function (d) {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip
        .html(
          `
                    <strong>${d.Country}</strong><br>
                    Happiness Rank: ${d["Happiness Rank"]}<br>
                    Ladder Score: ${d["Ladder score"]}<br>
                    Population: ${d.Population.toLocaleString()}
                `
        )
        .style("left", d3.event.pageX + 10 + "px")
        .style("top", d3.event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Define zoom behavior
  var zoom = d3
    .zoom()
    .scaleExtent([0.5, 8]) // Set zoom scale limits
    .on("zoom", function () {
      svg.selectAll("path").attr("transform", d3.event.transform); // Apply transform to the map paths
      svg
        .selectAll("text")
        .attr("x", function (d) {
          return d3.event.transform.apply(
            projection([d.Longitude, d.Latitude])
          )[0];
        })
        .attr("y", function (d) {
          return d3.event.transform.apply(
            projection([d.Longitude, d.Latitude])
          )[1];
        });
    });

  // Apply zoom behavior to SVG element
  svg.call(zoom);

  // Reset zoom transform when no zoom is applied
  svg.call(zoom.transform, d3.zoomIdentity);

  // Event listeners for dropdown menus
document.getElementById("country").addEventListener("change", function () {
  const selectedCountry = this.value;
  updateCountry(selectedCountry, width, height, color);
});

document.getElementById("region").addEventListener("change", function () {
  const selectedRegion = this.value;
  updateRegion(selectedRegion, width, height, color,countryData,selectedContinent);
});

document.getElementById("year").addEventListener("change", function () {
  const selectedYear = this.value;
  updateYear(selectedYear, width, height, color);
});
}

let continentData; // Declare continentData outside of any function

d3.json(
  "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json",
  function (error, data) {
    if (error) throw error;
    // Store the continent GeoJSON data in the globally accessible variable
    continentData = data;
  }
);

function updateRegion(selectedRegion, width, height, color, countryData, selectedContinent) {
  // Clear existing markers
  d3.selectAll(".marker").remove();

  // Define projection
  var projection = d3
    .geoMercator()
    .scale(120)
    .translate([width / 2, height / 1.5]);

  const svg = d3.select("#map").select("svg");

  // Update the map based on the selected region
  d3.selectAll(".country")
    .style("fill", function(d) {
      return d.properties.region === selectedRegion ? color(selectedRegion) : "#ccc";
    });

  // Add markers for countries in the selected region
  const markers = svg.selectAll(".marker")
    .data(countryData.filter(d => d.Region === selectedRegion))
    .enter()
    .append("text")
    .attr("class", "marker")
    .attr("x", (d) => projection([d.Longitude, d.Latitude])[0])
    .attr("y", (d) => projection([d.Longitude, d.Latitude])[1])
    .style("font-size", "20px")
    .text((d) => d.Emoji);

  // Update the map to highlight the selected continent
  d3.selectAll(".continent")
    .style("fill", function(d) {
      return d.properties.region === selectedContinent ? "red" : "#ccc";
    });

  // Add tooltips
  const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

  markers.on("mouseover", function (d) {
    tooltip.transition().duration(200).style("opacity", 1);
    tooltip.html(
      `<strong>${d.Country}</strong><br>
       Happiness Rank: ${d["Happiness Rank"]}<br>
       Ladder Score: ${d["Ladder score"]}<br>
       Population: ${d.Population.toLocaleString()}`
    )
    .style("left", d3.event.pageX + 10 + "px")
    .style("top", d3.event.pageY - 28 + "px");
  })
  .on("mouseout", function () {
    tooltip.transition().duration(500).style("opacity", 0);
  });
}

var pcpMargin = {top: 30, right: 10, bottom: 10, left: 80},
    width = 760 - pcpMargin.left - pcpMargin.right,
    height = 300 - pcpMargin.top - pcpMargin.bottom;

var x = d3.scalePoint().rangeRound([0, width]).padding(1),
    y = {},
    dragging = {};


var line = d3.line(),
    //axis = d3.axisLeft(x),
    background,
    foreground,
    extents,
    origDimensions;


 var container = d3.select("#pcp").append("div")
    .attr("class", "parcoords")
    .style("width", width + pcpMargin.left + pcpMargin.right + "px")
    .style("height", height + pcpMargin.top + pcpMargin.bottom + "px");

var svg = container.append("svg")
    .attr("width", width + pcpMargin.left + pcpMargin.right)
    .attr("height", height + pcpMargin.top + pcpMargin.bottom)
  .append("g")
    .attr("transform", "translate(" + pcpMargin.left + "," + pcpMargin.top + ")");

var quant_p = function(v){return (parseFloat(v) == v) || (v == "")};     

d3.json("/pcp_data", function (error, data) {
  if (error) throw error;
 
    dimensions = d3.keys(data[0]);
    origDimensions = dimensions.slice(0);

    x.domain(dimensions);

    dimensions.forEach(function(d) {
    var vals = data.map(function(p) {return p[d];});
    if (vals.every(quant_p)){ 
     y[d] = d3.scaleLinear()
        .domain(d3.extent(data, function(p) { 
            return +p[d]; }))
        .range([height, 0])

       
      }
    else{
     vals.sort();           
      y[d] = d3.scalePoint()
              .domain(vals.filter(function(v, i) {return vals.indexOf(v) == i;}))
              .range([height, 0],1);
       }
        
  })

 
 extents = dimensions.map(function(p) { return [0,0]; });


  // Add grey background lines for context.
  background = svg.append("g")
      .attr("class", "background")
    .selectAll("path")
      .data(data)
    .enter().append("path")
      .attr("d", path);

  // Add blue foreground lines for focus.
  foreground = svg.append("g")
      .attr("class", "foreground")
    .selectAll("path")
      .data(data)
    .enter().append("path")
      .attr("d", path);



  // Add a group element for each dimension.

  var g = svg.selectAll(".dimension")
      .data(dimensions)
    .enter().append("g")
      .attr("class", "dimension")
      .attr("transform", function(d) {  return "translate(" + x(d) + ")"; })
      .call(d3.drag()
        .subject(function(d) { return {x: x(d)}; })
        .on("start", function(d) {
          dragging[d] = x(d);
          background.attr("visibility", "hidden");
        })
        .on("drag", function(d) {
          dragging[d] = Math.min(width, Math.max(0, d3.event.x));
          foreground.attr("d", path);
          dimensions.sort(function(a, b) { 
            return position(a) - position(b); 
          });
          // extents.forEach(function(ext, idx) {
          //   if(origDi)  
            
          // })
          x.domain(dimensions);
          g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
        })
        .on("end", function(d) {
          delete dragging[d];
          transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
          transition(foreground).attr("d", path);
          background
              .attr("d", path)
            .transition()
              .delay(500)
              .duration(0)
              .attr("visibility", null);
              
              var new_extents = [];
              for(var i=0;i<dimensions.length;++i){
                  new_extents.push(extents[origDimensions.indexOf(dimensions[i])]);
	            }
	            extents = new_extents;
	            origDimensions = dimensions.slice(0);
        }));

        svg
        .append("text")
        .attr("text-anchor", "end")
        .attr("x", 0)
        .attr("y", -20)
        .text("Parallel Coordinate Plot")
        .attr("text-anchor", "start");
  // Add an axis and title.
   var g = svg.selectAll(".dimension");
  g.append("g")
      .attr("class", "axis")
      .each(function(d) {  d3.select(this).call(d3.axisLeft(y[d]));})
      //text does not show up because previous line breaks somehow
    .append("text")
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .attr("y", -9) 
      .text(function(d) { return d; });

  // Add and store a brush for each axis.
  g.append("g")
      .attr("class", "brush")
      .each(function(d) {
        if(y[d].name == 'r'){
         // console.log(this);

        d3.select(this).call(y[d].brush = d3.brushY().extent([[-8, 0], [8,height]]).on("start", brushstart).on("brush", brush_parallel_chart));
        }
		})
    .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16); 
      
    
});  // closing

function position(d) {
  var v = dragging[d];
  return v == null ? x(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
}


// brush start function
function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}

 
// Handles a brush event, toggling the display of foreground lines.
function brush_parallel_chart() {
 
    for(var i=0;i<dimensions.length;++i){

            if(d3.event.target==y[dimensions[i]].brush) {
                  extents[i]=d3.event.selection.map(y[dimensions[i]].invert,y[dimensions[i]]);
				  }
	}

     foreground.style("display", function(d) {
        return dimensions.every(function(p, i) {
            if(extents[i][0]==0 && extents[i][0]==0) {
                return true;
            }
          return extents[i][1] <= d[p] && d[p] <= extents[i][0];
        }) ? null : "none";
      }); 
}    


// Define variables
const percent = 0.5;
const barWidth = 50;
const numSections = 3;
const sectionPerc = 1 / numSections / 2;
const padRad = 0.05;
const chartInset = 10;

// Define helper functions
const percToDeg = (perc) => perc * 360;
const percToRad = (perc) => degToRad(percToDeg(perc));
const degToRad = (deg) => (deg * Math.PI) / 180;

// Set up SVG element
const gaugemargin = { top: 20, right: 20, bottom: 30, left: 20 };
const gaugewidth =
  document.querySelector(".chart-gauge").offsetWidth -
  gaugemargin.left -
  gaugemargin.right;
const gaugeheight = gaugewidth;
const gaugeradius = Math.min(gaugewidth, gaugeheight) / 2;

const gaugesvg = d3
  .select(".chart-gauge")
  .append("svg")
  .attr("width", gaugewidth + gaugemargin.left + gaugemargin.right)
  .attr("height", gaugeheight + gaugemargin.top + gaugemargin.bottom);

const chart = gaugesvg
  .append("g")
  .attr(
    "transform",
    `translate(${(gaugewidth + gaugemargin.left) / 2}, ${
      (gaugeheight + gaugemargin.top) / 2
    })`
  );

// Define arc function
const arc = d3
  .arc()
  .outerRadius(gaugeradius - chartInset)
  .innerRadius(gaugeradius - chartInset - barWidth);

// Draw gauge background sections
let totalPercent = 0.75; // Initialize totalPercent
for (let sectionIndx = 1; sectionIndx <= numSections; sectionIndx++) {
  const arcStartRad = percToRad(totalPercent);
  const arcEndRad = arcStartRad + percToRad(sectionPerc);
  totalPercent += sectionPerc;
  const startPadRad = sectionIndx === 1 ? 0 : padRad / 2;
  const endPadRad = sectionIndx === numSections ? 0 : padRad / 2;

  chart
    .append("path")
    .attr("class", `arc chart-color${sectionIndx}`)
    .attr(
      "d",
      arc
        .startAngle(arcStartRad + startPadRad)
        .endAngle(arcEndRad - endPadRad)()
    );
}

// Define Needle class
class Needle {
  constructor(len, radius) {
    this.len = len;
    this.radius = radius;
  }

  drawOn(el, perc) {
    el.append("circle")
      .attr("class", "needle-center")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", this.radius);

    el.append("path").attr("class", "needle").attr("d", this.mkCmd(perc));
  }

  animateOn(el, targetPerc) {
    const self = this;
    el.transition()
      .delay(500)
      .ease(d3.easeCubicInOut)
      .duration(3000)
      .selectAll(".needle")
      .tween("progress", function () {
        const node = this;
        const initialPerc = parseFloat(d3.select(node).attr("data-perc")) || 0; // Get the initial percentage or default to 0
        return function (percentOfPercent) {
          const progress =
            initialPerc + (targetPerc - initialPerc) * percentOfPercent;
          d3.select(node).attr("d", self.mkCmd(progress));
        };
      })
      .attr("data-perc", targetPerc);
  }

  mkCmd(perc) {
    const thetaRad = percToRad(perc / 2); // half circle
    const centerX = 0;
    const centerY = 0;
    const topX = centerX - this.len * Math.cos(thetaRad);
    const topY = centerY - this.len * Math.sin(thetaRad);
    const leftX = centerX - this.radius * Math.cos(thetaRad - Math.PI / 2);
    const leftY = centerY - this.radius * Math.sin(thetaRad - Math.PI / 2);
    const rightX = centerX - this.radius * Math.cos(thetaRad + Math.PI / 2);
    const rightY = centerY - this.radius * Math.sin(thetaRad + Math.PI / 2);

    return `M ${leftX} ${leftY} L ${topX} ${topY} L ${rightX} ${rightY} Z`;
  }
}

const needle = new Needle(90, 15);
needle.drawOn(chart, 0);
needle.animateOn(chart, percent);


const keys = [
  "Economy",
  "Social support",
  "Health",
  "Freedom",
  "Trust",
  "Generosity",
];
const colorScale = d3
  .scaleOrdinal()
  .domain(keys)

  .range([
    "#202020",
    "#202020",
    "#202020",
    "#202020",
    "#202020",
    "#202020",
    "#202020",
    "#202020",
  ]);

// .range(['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf']);


//Bubble chart code
const initialXAttribute = "Economy";
const yAttribute = "Ladder score";

const bubbleMargin = { top: 20, right: 20, bottom: 30, left: 40 };
const bubbleWidth = 500 - bubbleMargin.left - bubbleMargin.right;
const bubbleHeight = 300 - bubbleMargin.top - bubbleMargin.bottom;

const bubbleSvg = d3
  .select("#bubble-chart")
  .append("svg")
  .attr("width", bubbleWidth + bubbleMargin.left + bubbleMargin.right)
  .attr("height", bubbleHeight + bubbleMargin.top + bubbleMargin.bottom)
  .append("g")
  .attr("transform", `translate(${bubbleMargin.left}, ${bubbleMargin.top})`);

const bubbleX = d3.scaleLinear().range([0, bubbleWidth]);

const bubbleY = d3.scaleLinear().range([bubbleHeight, 0]);

const radius = d3.scaleSqrt().range([5, 20]);

// const color = d3.scaleOrdinal().range(d3.schemeCategory10);

  // Color palette
  const color = d3.scaleOrdinal()
  .domain(["Africa", "Asia", "Europe", "North America", "South America", "Australia", "Antarctica"])

  .range([
    "#e5c494", 
    "#ffd92f", 
    "#8da0cc",
    "#a6d955", 
    "#e88bc4", 
    "#fc8d62"
  ]);



// Existing axis setup
const xAxisGroup = bubbleSvg.append("g")
  .attr("transform", `translate(0, ${bubbleHeight})`)
  .call(d3.axisBottom(bubbleX));

const yAxisGroup = bubbleSvg.append("g")
  .call(d3.axisLeft(bubbleY));

// Add X Axis Label with a placeholder or initial value
// Assuming you have defined bubbleSvg and its dimensions already

const xAxisLabel = bubbleSvg.append("text")
    .attr("class", "x-axis-label")
    .attr("transform", `translate(${bubbleWidth / 2}, ${bubbleHeight + bubbleMargin.bottom})`)
    .style("text-anchor", "middle")
    // .text("Initial Attribute Label"); // Set an initial label if needed

// Add Y Axis Label
bubbleSvg.append("text")
  .attr("class", "axis-label")
  .attr("transform", "rotate(-90)")
  .attr("y",  -55 + bubbleMargin.left)
  .attr("x", 0 - (bubbleHeight / 2))
  .attr("dy", "-1.2em")
  .style("text-anchor", "middle")
  .text("Happiness Socre");  // Replace "Your Y-Axis Label" with the actual label

function updateCircles(selectedAttribute) {
    const circles = bubbleSvg.selectAll("circle").data(data);
  
  
    circles
      .enter()
      .append("circle")
      .attr("cx", (d) => bubbleX(d[selectedAttribute]))
      .attr("cy", (d) => bubbleY(d[yAttribute]))
      .attr("r", (d) => radius(d.Population) * 1.2) // Double the radius for larger bubbles
      .attr("fill", (d) => color(d.Region))
      .attr("opacity", 0.7) // Set transparency to 0.7 (adjust as needed)
      .merge(circles)
      .transition()
      .duration(500)
      .attr("cx", (d) => bubbleX(d[selectedAttribute]))
      .attr("cy", (d) => bubbleY(d[yAttribute]));
    circles.exit().remove();
  }
  
  function updateChart(selectedAttribute) {
    console.log("Selected Attribute:", selectedAttribute);
  
    if (!data) {
      console.log("Data not available yet.");
      return;
    }
  
    updateScales(selectedAttribute);
    updateAxes();
    updateCircles(selectedAttribute);
    xAxisLabel.text(selectedAttribute.replace(/_/g, " "));
  }





const legendmargin = { left: 20 };
const legendElement = createLegend(keys, colorScale, legendmargin).node();
document.getElementById("legend-chart").appendChild(legendElement);

function createLegend(keys, colorScale, bubbleMargin) {
  const legend = d3
    .select("body")
    .append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("min-height", "33px")
    .style("font", "10px sans-serif")
    .style("margin-left", `${bubbleMargin.left}px`);

  const legendItems = legend.append("div");

  const legendItem = legendItems
    .selectAll(".legend-item")
    .data(keys)
    .enter()
    .append("span")
    .classed("legend-item", true)
    .style("display", "inline-flex")
    .style("align-items", "center")
    .style("margin-right", "10px")
    .style("cursor", "pointer")
    .style("padding", "5px 10px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("background-color", "#f8f8f8")
    .on("mouseover", function () {
      d3.select(this).style("background-color", "#e8e8e8");
    })
    .on("mouseout", function () {
      d3.select(this).style("background-color", "#f8f8f8");
    })
    .on("click", function (selectedData) {
      // Remove the check mark from all items
      legendItems.selectAll(".check-mark").style("display", "none");

      // Display the check mark for the clicked item
      const checkMark = d3.select(this).select(".check-mark");
      checkMark.style("display", "inline");

      // Update the chart based on the selected item
      updateChart(selectedData);
    });

  legendItem
    .append("text")
    .classed("check-mark", true)
    .style("display", "none") // Initially hide the check mark
    .style("color", "red")
    .style("margin-right", "0.5em")
    .text("✔"); // Unicode character for the check mark

  legendItem.append("text").text((d) => d);

  return legend;
}

let data;

function updateScales(selectedAttribute) {
  bubbleX.domain(d3.extent(data, (d) => d[selectedAttribute]));
  bubbleY.domain(d3.extent(data, (d) => d[yAttribute]));
  radius.domain(d3.extent(data, (d) => d.Population));
  color.domain(d3.map(data, (d) => d.Region).keys());
}
function updateAxes() {
  const xAxis = d3.axisBottom(bubbleX);
  const yAxis = d3.axisLeft(bubbleY);

  // Update x axis
  xAxisGroup
    .call(xAxis)
    .selectAll("path") // Select the axis line
    .style("stroke", "#EA6A47"); // Change color of x axis line

  xAxisGroup
    .selectAll("text") // Select all text elements of x axis
    .style("fill", "#EA6A47"); // Change color of text labels

  // Update y axis
  yAxisGroup
    .call(yAxis)
    .selectAll("path") // Select the axis line
    .style("stroke", "#EA6A47"); // Change color of y axis line

  yAxisGroup
    .selectAll("text") // Select all text elements of y axis
    .style("fill", "#EA6A47"); // Change color of text labels
}


fetch("/data")
  .then((response) => response.json())
  .then((fetchedData) => {
    data = fetchedData;
    updateChart(initialXAttribute);
  })
  .catch((error) => console.error(error));


  var stackedMargin = { top: 60, right: 230, bottom: 50, left: 50 },
  stackedWidth = 660 - stackedMargin.left - stackedMargin.right,
  stackedHeight = 360 - stackedMargin.top - stackedMargin.bottom;

var stackedSvg = d3
  .select("#my_dataviz")
  .append("svg")
  .attr("width", stackedWidth + stackedMargin.left + stackedMargin.right)
  .attr("height", stackedHeight + stackedMargin.top + stackedMargin.bottom)
  .append("g")
  .attr("transform", "translate(" + stackedMargin.left + "," + stackedMargin.top + ")");

d3.json("/stacked_area_data", function (error, data) {
  if (error) throw error;

  // List of keys
  var keys = [
    "Economy",
    "Social_support",
    "Health",
    "Freedom",
    "Trust",
    "Generosity",
    "Dystopia_Residual",
  ];

  // Color palette
  const color = d3.scaleOrdinal()
  .domain(["Africa", "Asia", "Europe", "North America", "Oceania", "South America"])

  .range([
    "#e5c494", 
    "#ffd92f", 
    "#8da0cc",
    "#a6d955", 
    "#e88bc4", 
    "#fc8d62"
  ]);
  console.log("Data",data.data[0])
  // var data = data.data
  // Stack the data
  // var stackedData = d3.stack().keys(keys).order(d3.stackOrderNone).offset(d3.stackOffsetNone)(data);
  if (data.data && data.data.length > 0) {
    var stackedData = d3.stack().keys(keys).order(d3.stackOrderNone).offset(d3.stackOffsetNone)(data.data);
    console.log("stackedData",stackedData)
  } else {
    console.error("Error: Data is empty or undefined.");
    // Handle the case where there's no data (e.g., display an error message)
  }
  // Add X axis
  var x = d3
    .scaleLinear()
    .domain(d3.extent(data.data, function (d) { return d.year; }))
    .range([0, stackedWidth]);
  var xAxis = stackedSvg
    .append("g")
    .attr("transform", "translate(0," + stackedHeight + ")")
    .call(d3.axisBottom(x).ticks(5));

  // Add X axis label
  stackedSvg
    .append("text")
    .attr("text-anchor", "end")
    .attr("x", stackedWidth)
    .attr("y", stackedHeight + 40)
    .text("Time (year)");

  // Add Y axis label
  stackedSvg
    .append("text")
    .attr("text-anchor", "end")
    .attr("x", 0)
    .attr("y", -20)
    .text("Stacked Area Chart")
    .attr("text-anchor", "start");

  // Add Y axis
  var y = d3.scaleLinear().domain([0, 800]).range([stackedHeight, 0]);
  stackedSvg.append("g").call(d3.axisLeft(y).ticks(5));

  var area = d3.area()
  .x(function(d) { return x(d.data.year); }) // Assuming 'year' is the x value
  .y0(function(d) { return y(d[0]); }) // The starting y-coordinate of the stack
  .y1(function(d) { return y(d[1]); }); // The ending y-coordinate of the stack


  // Show the areas
  stackedSvg
  .selectAll(".myArea")
  .data(stackedData)
  .enter()
  .append("path")
  .attr("class", function (d) {
      return "myArea " + d.key;
  })
  .style("fill", function (d) {
      return color(d.key);
  })
  .attr("d", function(d) { return area(d); }); // Use the area function here


  // Add brushing
  var brush = d3
    .brushX()
    .extent([
      [0, 0],
      [stackedWidth, stackedHeight],
    ])
    .on("end", updateChart);

  stackedSvg
    .append("g")
    .attr("class", "brush")
    .call(brush);

  var idleTimeout;
  function idled() {
    idleTimeout = null;
  }

  function updateChart() {
    var extent = d3.event.selection;

    if (!extent) {
      if (!idleTimeout) return (idleTimeout = setTimeout(idled, 350));
      x.domain(d3.extent(data, function (d) { return d.year; }));
    } else {
      x.domain([x.invert(extent[0]), x.invert(extent[1])]);
      stackedSvg.select(".brush").call(brush.move, null);
    }

    xAxis.transition().duration(1000).call(d3.axisBottom(x).ticks(5));
    stackedSvg.selectAll(".myArea").transition().duration(1000).attr("d", area);
  }

  var highlight = function (d) {
    d3.selectAll(".myArea").style("opacity", 0.1);
    d3.select("." + d).style("opacity", 1);
  };

  var noHighlight = function () {
    d3.selectAll(".myArea").style("opacity", 1);
  };

  var size = 20;

  stackedSvg
    .selectAll("myrect")
    .data(keys)
    .enter()
    .append("rect")
    .attr("x", 400)
    .attr("y", function (d, i) {
      return 10 + i * (size + 5);
    })
    .attr("width", size)
    .attr("height", size)
    .style("fill", function (d) {
      return color(d);
    })
    .on("mouseover", highlight)
    .on("mouseleave", noHighlight);

  stackedSvg
    .selectAll("mylabels")
    .data(keys)
    .enter()
    .append("text")
    .attr("x", 400 + size * 1.2)
    .attr("y", function (d, i) {
      return 10 + i * (size + 5) + size / 2;
    })
    .style("fill", function (d) {
      return color(d);
    })
    .text(function (d) {
      return d;
    })
    .attr("text-anchor", "left")
    .style("alignment-baseline", "middle")
    .on("mouseover", highlight)
    .on("mouseleave", noHighlight);
});
