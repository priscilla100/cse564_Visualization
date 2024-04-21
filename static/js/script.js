// Define tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Initialize the map with default year
updateMap(2024);
// Initial pie chart with year 2024
createPieChart(2024);
// createBubbleChart(2024);

// Function to update the map based on the selected year
d3.select("#year-slider").on("input", function () {
  var year = +this.value;
  updateMap(year);
  createPieChart(year);
  // createBubbleChart(year);
  // loadDataAndCreateChart(year, region);

});


// Update map function
function updateMap(year) {
  document.getElementById('selected-year').innerText = year;
    d3.json("/data?year=" + year).then(function(data) {
      console.log(data)


        // Process data and update map

        // Remove existing map if any
        d3.select("#map svg").remove();

        // Create SVG element for the map
        var svg = d3
            .select("#map")
            .append("svg")
            .attr("width", 750)
            .attr("height", 550);

        // Define projection
        var projection = d3.geoMercator().scale(150).translate([400, 300]);

        // Define path generator
        var path = d3.geoPath().projection(projection);

        // Define zoom behavior
        var zoom = d3.zoom()
            .scaleExtent([0.5, 8]) // Set zoom scale limits
            .on("zoom", function zoomed(event) {
                svg.selectAll("path").attr("transform", event.transform); // Apply transform to the map paths
                svg.selectAll("text")
                    .attr("x", function(d) { return event.transform.apply([projection([d.Longitude, d.Latitude])[0], projection([d.Longitude, d.Latitude])[1]])[0]; })
                    .attr("y", function(d) { return event.transform.apply([projection([d.Longitude, d.Latitude])[0], projection([d.Longitude, d.Latitude])[1]])[1]; });
            });

        // Apply zoom behavior to SVG element
        svg.call(zoom);

        // Load world map data
        d3.json(
            "https://raw.githubusercontent.com/d3/d3.github.com/master/world-110m.v1.json"
        ).then(function(world) {
            // Draw world map
            svg
                .selectAll("path")
                .data(topojson.feature(world, world.objects.countries).features)
                .enter()
                .append("path")
                .attr("d", path)
                .style("fill", "lightgray")
                .style("stroke", "white");

            // Append emojis to the map
            svg.selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .attr("x", function(d) {
              return projection([d.Longitude, d.Latitude])[0];
            })
            .attr("y", function(d) {
              return projection([d.Longitude, d.Latitude])[1];
            })
            .text(function(d) {
              // Assign emojis based on score
              if (d['Ladder score'] >= 6 && d['Ladder score'] <= 8) {
                return '🤩';
              } else if (d['Ladder score'] >= 4.5 && d['Ladder score'] < 6) {
                return '😑';
              } else if (d['Ladder score'] >= 1 && d['Ladder score'] < 4.5) {
                return '😡';
              } else {
                return '';
              }
            })
            .attr("font-size", "20px")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("fill", function(d) {
              // Assign colors based on score
              if (d['Ladder score'] >= 6 && d['Ladder score'] <= 8) {
                return 'green';
              } else if (d['Ladder score'] >= 4.5 && d['Ladder score'] < 6) {
                return 'yellow';
              } else if (d['Ladder score'] >= 1 && d['Ladder score'] < 4.5) {
                return 'red';
              } else {
                return 'black';
              }
            })
            .on("mouseover", function(event, d) {
              // Get mouse coordinates relative to the SVG element
              var [x, y] = d3.pointer(event, this);
          
              // Show tooltip on mouseover
              tip
                .style("opacity", 1)
                .html(
                  `${d.Country}<br/>Happiness Score: ${d['Ladder score']}${d['Emoji']}<br/>Year: ${d.Year}`
                )
                .style("left", `${x - 25}px`)
                .style("top", `${y - 75}px`);
            })
            .on("mouseout", function() {
              // Hide tooltip on mouseout
              tip.style("opacity", 0);
            });
          
          var tip = d3
            .select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
        });
    });
}
// Get references to the slider and the span element for the selected year
const slider = document.getElementById('year-slider');
const selectedYearSpan = document.getElementById('selected-year');

// Function to update the position of the selected year span
function updateSelectedYearPosition() {
    // Get the value (year) selected by the user
    const year = slider.value;

    // Update the text content of the span element to display the selected year
    selectedYearSpan.textContent = year;

    // Calculate the position of the span element based on the slider's value
    const sliderRect = slider.getBoundingClientRect();
    const sliderWidth = slider.offsetWidth;
    const sliderMin = parseInt(slider.min, 10);
    const sliderMax = parseInt(slider.max, 10);
    const percent = ((year - sliderMin) / (sliderMax - sliderMin)) * 100;
    const offsetX = (percent / 100) * sliderWidth;

    // Set the left position of the span element to align with the slider handle
    selectedYearSpan.style.left = `${sliderRect.left + offsetX}px`;
}

// Call the function to initially position the selected year span
updateSelectedYearPosition();

// Add event listener to the slider for input change
slider.addEventListener('input', updateSelectedYearPosition);


// Fetch data from the endpoint
d3.json("/aggregated_data")
  .then(function(data) {
    // Process the fetched data here
    console.log(data); // Example: Log the data to see its structure
    // Call the function to create the line graph with the fetched data
    createLineGraph(data);
  })
  .catch(function(error) {
    // Handle any errors that occur during the fetch request
    console.error("Error fetching data:", error);
  });

  // Function to create line graph
// function createLineGraph(data) {
//   // Set up SVG dimensions and margins
//   var margin = { top: 20, right: 20, bottom: 30, left: 50 };
//   var width = 400 - margin.left - margin.right;
//   var height = 400 - margin.top - margin.bottom;

//   // Parse the data
//   var years = [...new Set(data.map(d => d.Year))]; // Get unique years
//   var regions = [...new Set(data.map(d => d.Region))]; // Get unique regions

//   // Define scales
//   var xScale = d3.scaleBand()
//       .domain(years)
//       .range([0, width])
//       .padding(0.1);

//   var yScale = d3.scaleLinear()
//       .domain([0, d3.max(data, d => d.Health)])
//       .nice()
//       .range([height, 0]);

//   // Define colors for regions
//   var colorScale = d3.scaleOrdinal()
//       .domain(regions)
//       .range(d3.schemeCategory10);

//   // Define line function
//   var line = d3.line()
//       .x(d => xScale(d.Year))
//       .y(d => yScale(d.Health));

//   // Append SVG
//   var svg = d3.select("#chart")
//       .append("svg")
//       .attr("width", width + margin.left + margin.right)
//       .attr("height", height + margin.top + margin.bottom)
//       .append("g")
//       .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//   // Draw x axis
//   svg.append("g")
//       .attr("transform", "translate(0," + height + ")")
//       .call(d3.axisBottom(xScale));

//   // Draw y axis
//   svg.append("g")
//       .call(d3.axisLeft(yScale));

//   // Draw lines for each region
//   regions.forEach(region => {
//       var regionData = data.filter(d => d.Region === region);
//       svg.append("path")
//           .datum(regionData)
//           .attr("fill", "none")
//           .attr("stroke", colorScale(region))
//           .attr("stroke-width", 2)
//           .attr("d", line);
//   });

//   // Add legend
//   var legend = svg.append("g")
//       .attr("transform", "translate(" + (width - 120) + "," + (margin.top + 10) + ")");

//   regions.forEach((region, i) => {
//       legend.append("rect")
//           .attr("x", 0)
//           .attr("y", i * 20)
//           .attr("width", 10)
//           .attr("height", 10)
//           .attr("fill", colorScale(region));

//       legend.append("text")
//           .attr("x", 15)
//           .attr("y", i * 20 + 9)
//           .attr("dy", "0.35em")
//           .text(region)
//           .style("fill", "#64ffda"); // Set text color to #64ffda
// // Adjust x-axis label position
// svg.append("text")
//     .attr("class", "x-axis-label")
//     .attr("text-anchor", "end")
//     .attr("x", width)
//     .attr("y", height + margin.top + margin.bottom)
//     .text("Year");

// // Adjust y-axis label position
// svg.append("text")
//     .attr("class", "y-axis-label")
//     .attr("transform", "rotate(-90)")
//     .attr("y", 0 - margin.left)
//     .attr("x", 0 - (height / 2))
//     .attr("dy", "1em")
//     .style("text-anchor", "middle")
//     .text("Average Health Score");

//   // Define tooltip
// var tooltip = d3.select("body").append("div")
// .attr("class", "tooltip")
// .style("opacity", 0);

// // Adjust tooltip position
// svg.selectAll(".dot")
// .on("mouseover", function(d) {
//     tooltip.transition()
//         .duration(200)
//         .style("opacity", .9);
//     tooltip.html(d.Region + "<br/>" + d.Year + ": " + d.Health)
//         .style("left", (d3.event.pageX) + "px")  // Adjust left position
//         .style("top", (d3.event.pageY - 28) + "px");  // Adjust top position
// })
// .on("mouseout", function(d) {
//     tooltip.transition()
//         .duration(500)
//         .style("opacity", 0);
// });

      
//   });
// }
function createLineGraph(data){
// Specify the chart’s dimensions.
const width = 928;
const height = 600;
const marginTop = 20;
const marginRight = 40;
const marginBottom = 30;
const marginLeft = 40;
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// Create the SVG container.
const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; -webkit-tap-highlight-color: transparent;");

    const nestedData = d3.group(data, d => d.Region);

    // Extract unique regions
    const regions = Array.from(nestedData.keys());

    // Create line generator
    const line = d3.line()
        .x(d => x(d.Year))
        .y(d => y(d.Health))
        .curve(d3.curveMonotoneX);

    // Create scales
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Year))
        .range([marginLeft, width - marginRight]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Health)])
        .range([height - marginBottom, marginTop]);

    // Create axes
    const xAxis = d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0);
    const yAxis = d3.axisLeft(y);

    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis)
        .call(g => g.select(".domain").remove());

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(yAxis)
        .call(g => g.selectAll(".tick line").clone()
            .attr("stroke-opacity", 0.2)
            .attr("x2", width - marginLeft - marginRight))
        .call(g => g.select(".domain").remove());

    // Plot lines for each region
    regions.forEach((region, i) => {
        const regionData = nestedData.get(region);
        svg.append("path")
            .datum(regionData)
            .attr("fill", "none")
            .attr("stroke", colorScale(region))
            .attr("stroke-width", 2)
            .attr("d", line);
    });


// Append the SVG container to the DOM.
document.getElementById("chart").appendChild(svg.node());
}

const w = 520;
const h = 300;
const startAngle = 0;
const endAngle = 4 * Math.PI;
const stroke = 5;
const innerRadius = h/4;
const outerRadius = h/2 - stroke;

// Create SVG
const pieSvg = d3.select("#pie-chart")
.append("svg")
  .attr('width', w)
  .attr('height', h);

// Create Arc for
const arc = d3.arc()
  .innerRadius(innerRadius)
  .outerRadius(outerRadius);

const cScale = d3.scaleOrdinal(d3.schemeCategory10);

// Function to create the pie chart
function createPieChart(year) {
 // Fetch data from Flask endpoint
 fetch(`/count_by_region_and_year?year=${year}`)
 .then(response => response.json())
 .then(data => {
   // Convert data to array of objects
   const dataset = Object.entries(data).map(([region, count]) => ({ name: region, value: count }));

   // Remove existing pie chart elements
   pieSvg.selectAll('.arc').remove();
   pieSvg.selectAll('#mainText').remove();

   // Create PIE Data converter
   const pie = d3.pie()
     .value(d => d.value)
     .startAngle(startAngle)
     .endAngle(endAngle);

   const center = pieSvg.append('g')
     .attr('transform', `translate(${h/2}, ${h/2})`);

   const centerSvg = center.append('circle')
     .attr('fill', cScale(0))
     .attr('r', outerRadius - innerRadius);

   const text = center.append('text')
     .attr('text-anchor', 'middle')
     .attr('transform', `translate(0, 10)`)
     .attr('font-size', ".8rem")
     .attr('fill', '#64ffda')
     .attr('id', "mainText")
     .html("Region");

   const arcs = pieSvg
     .selectAll('g.arc')
     .data(pie(dataset))
     .join('g')
       .classed('arc', true)
       .attr('transform', `translate(${h/2}, ${h/2})`);

   arcs.append('path')
     .attr('fill', (d, i) => cScale(i + 1))
     .attr('d', arc)
     .on("mousemove", handleMouseOver)
     .on("mouseout", handleMouseOut)
     .append('title')    // Alt-text for the pie slice
       .text(d => d.data.name);
   
   // Raise text elements to display in front of arcs
   arcs.selectAll('text')
     .style('z-index', 1); // Set z-index to bring text in front of arcs
 })
 .catch(error => console.error('Error fetching data:', error));
}



function handleMouseOver(d, i) {
  d3.select(this)
    .attr("stroke", "#64ffda")
    .attr("stroke-width", stroke);
  d3.select(this)
    .transition()
    .duration(500)
    .attr('transform', GetTransform);
  d3.select('#mainText')
    .html(`${d.target.__data__.data.name} ${d.target.__data__.data.value}%`)
    .style('z-index', 1); // Adjust the z-index to bring the text to the front
}


function GetTransform(d) {
  var dist = 1;
  d.midAngle = ((d.endAngle - d.startAngle)/2) + d.startAngle;
  var x = Math.sin(d.midAngle) * dist;
  var y = Math.cos(d.midAngle) * dist;
  return 'translate(' + x + ',' + y + ')';
}

function handleMouseOut(d,i){
  d3.select(this)
    .attr("stroke-width","0px");
  d3.select(this)
    .transition()
    .duration(500)
    .attr('transform','translate(0,0)');

    d3.select('#mainText')
    .html("Region")
    .style('z-index', 'auto'); // Reset the z-index to its default value
}


document.getElementById("pie-chart").appendChild(pieSvg.node());


// Define global variables for the initial state
let selectedRegion = "All"; // Initial region selection

// Function to load data and create the horizontal bar chart
function loadDataAndCreateChart(year, region) {
    fetch(`/data?year=${year}&region=${region}`)
        .then(response => response.json())
        .then(data => {
            // Sort the data by happiness score in descending order
            data.sort((a, b) => b["Ladder score"] - a["Ladder score"]);
            // Extract top 10 countries
            const topCountries = data.slice(0, 10);
            // Call the function to create the bar chart with the top 10 countries
            createBarChart(topCountries);
        })
        .catch(error => console.error("Error fetching data:", error));
}

// Function to handle dropdown selection change
function handleRegionChange() {
    selectedRegion = this.value; // Update the selected region
    // Reload the data and update the chart with the new region
    loadDataAndCreateChart(2024, selectedRegion);
}

// Initialize the dropdown and chart on page load
document.addEventListener("DOMContentLoaded", function() {
    // Create the dropdown of regions
    const regionDropdown = document.getElementById("region-dropdown");
    regionDropdown.addEventListener("change", handleRegionChange);

    // Fetch and populate the regions dropdown
    fetch("/regions")
        .then(response => response.json())
        .then(regions => {
            regions.forEach(region => {
                const option = document.createElement("option");
                option.value = region;
                option.textContent = region;
                regionDropdown.appendChild(option);
            });
        })
        .catch(error => console.error("Error fetching regions:", error));

    // Load the initial data and create the chart for the top 10 countries
    loadDataAndCreateChart(2024, selectedRegion);
});


// Function to create the horizontal bar chart
function createBarChart(data) {
  const marginTop = 3;

  // Specify the chart’s dimensions, based on a bar’s height.
  const margin = { top: 20, right: 30, bottom: 40, left: 150 };
  const width = 730 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create SVG container
  const svg = d3.select("#bar-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // Sort the data by happiness score in descending order
  data.sort((a, b) => b["Ladder score"] - a["Ladder score"]);

  // Extract top 10 countries
  const topCountries = data.slice(0, 10);

  // Define scales
  const xScale = d3.scaleLinear()
      .domain([0, d3.max(topCountries, d => d["Ladder score"])])
      .range([0, width]);

  const yScale = d3.scaleBand()
      .domain(topCountries.map(d => d.Country))
      .range([0, height])
      .padding(0.1);

  // Create a value format.
  const format = xScale.tickFormat(20, "%");

  // Append a rect for each data entry.
  svg.append("g")
      .attr("fill", "#8892b0")
      .selectAll()
      .data(topCountries)
      .join("rect")
      .attr("x", xScale(0))
      .attr("y", d => yScale(d.Country))
      .attr("width", d => xScale(d["Ladder score"]))
      .attr("height", yScale.bandwidth())
      .on("mouseover", (event, d) => handleMouseOver(event, d))
      .on("mouseout", handleMouseOut);

  // Append a label for each data entry.
  svg.append("g")
      .attr("fill", "white")
      .attr("text-anchor", "end")
      .selectAll()
      .data(topCountries)
      .join("text")
      .attr("x", (d) => xScale(d["Ladder score"]))
      .attr("y", (d) => yScale(d.Country) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("dx", -4)
      .text((d) => d["Ladder score"])
      .attr("fill", "#64ffda")
      .call((text) => text.filter(d => xScale(d["Ladder score"]) - xScale(0) < 20) // short bars
          .attr("dx", +4)
          .attr("fill", "#64ffda")
          .attr("text-anchor", "start"));

      svg.append("g")
      .attr("transform", `translate(0,${marginTop})`)
      .call(d3.axisTop(xScale))
      .call(g => g.select(".domain").remove());

  // Add y-axis
  svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale).tickSizeOuter(0));

  // Function to handle mouseover event
function handleMouseOver(event, d) {
  // Show tooltip with country name and happiness score
  tooltip.transition()
    .duration(200)
    .style("opacity", .9);
  tooltip.html(`<strong>${d.Country}</strong>: ${d["Ladder score"]}`)
    .style("left", (event.pageX) + "px")
    .style("top", (event.pageY - 28) + "px");
}


  // Function to handle mouseout event
  function handleMouseOut() {
    // Hide tooltip
    tooltip.transition()
      .duration(500)
      .style("opacity", 0);
  }
}



// Event listener for year slider
document.getElementById("year-slider").addEventListener("input", function () {
    const year = +this.value;
    const region = document.getElementById("region-dropdown").value;
    loadDataAndCreateChart(year, region);
});

// Event listener for region dropdown
document.getElementById("region-dropdown").addEventListener("change", function () {
    const year = document.getElementById("year-slider").value;
    const region = this.value;
    loadDataAndCreateChart(year, region);
});