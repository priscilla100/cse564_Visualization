fetch("/compute_pca_and_kmeans")
  .then((response) => response.json())
  .then((data) => {
    const mseScores = data.mse_scores;
    const kmeansElbow = data.kmeans_elbow;
    renderKMeansMSEPlot(mseScores, kmeansElbow);
  })
  .catch((error) => console.error("Error:", error));

const colorscale = d3.scaleOrdinal(d3.schemeCategory10);
let selectedBars = [];
let biplotInitialized = false;

var selectedDimensions = [];

// Function to handle click events on MDS plot elements
function handleMDSClick(d, data) {
  selectedDimensions.push(d);
  redrawPCP(selectedDimensions, data);
}

var margin = { top: 50, right: 10, bottom: 10, left: 10 },
width = 800 - margin.left - margin.right;
height = 520 - margin.top - margin.bottom;

var xScale = d3.scalePoint().rangeRound([0, width]).padding(1),
yScale = {},
dragging = {};
var c = d3
.select("#parallel-coordinates-plot")
.append("div")
.attr("class", "parcoords")
.style("width", width + margin.left + margin.right + "px")
.style("height", height + margin.top + margin.bottom + "px");

var svgDiv = c
.append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var num_line = d3.line(),
//axis = d3.axisLeft(x),
num_background,
num_foreground,
num_extents,
// dimensions,
origDimensions;
  var quant_p = function (v) {
    return parseFloat(v) == v || v == "";
  };

//numerical data
fetch("/get_numerical_data")
  .then((response) => response.json())
  .then((data) => {

    dimensions = d3.keys(data[0]);
    origDimensions = dimensions.slice(0);

    xScale.domain(dimensions);

    dimensions.forEach(function (d) {
      var vals = data.map(function (p) {
        return p[d];
      });
      if (vals.every(quant_p)) {
        yScale[d] = d3
          .scaleLinear()
          .domain(
            d3.extent(data, function (p) {
              return +p[d];
            })
          )
          .range([height, 0]);
      } else {
        vals.sort();
        yScale[d] = d3
          .scalePoint()
          .domain(
            vals.filter(function (v, i) {
              return vals.indexOf(v) == i;
            })
          )
          .range([height, 0], 1);
      }
    });

    num_extents = dimensions.map(function (p) {
      return [0, 0];
    });

    // Add grey background lines for context.
    num_background = svgDiv
      .append("g")
      .attr("class", "background")
      .selectAll("path")
      .data(data)
      .enter()
      .append("path")
      .attr("d", path_num);

    // Add blue foreground lines for focus.
    num_foreground = svgDiv
      .append("g")
      .attr("class", "foreground")
      .selectAll("path")
      .data(data)
      .enter()
      .append("path")
      .attr("d", path_num);

    var g = svgDiv
      .selectAll(".dimension")
      .data(dimensions)
      .enter()
      .append("g")
      .attr("class", "dimension")
      .attr("transform", function (d) {
        return "translate(" + xScale(d) + ")";
      })
      .call(
        d3
          .drag()
          .subject(function (d) {
            return { x: xScale(d) };
          })
          .on("start", function (d) {
            dragging[d] = xScale(d);
            num_background.attr("visibility", "hidden");
          })
          .on("drag", function (d) {
            dragging[d] = Math.min(width, Math.max(0, d3.event.x));
            num_foreground.attr("d", path_num);
            dimensions.sort(function (a, b) {
              return position_num(a) - position_num(b);
            });
            // extents.forEach(function(ext, idx) {
            //   if(origDi)

            // })
            xScale.domain(dimensions);
            g.attr("transform", function (d) {
              return "translate(" + position_num(d) + ")";
            });
          })
          .on("end", function (d) {
            delete dragging[d];
            transition_num(d3.select(this)).attr(
              "transform",
              "translate(" + xScale(d) + ")"
            );
            transition_num(num_foreground).attr("d", path_num);
            num_background
              .attr("d", path_num)
              .transition()
              .delay(500)
              .duration(0)
              .attr("visibility", null);

            var new_extents = [];
            for (var i = 0; i < dimensions.length; ++i) {
              new_extents.push(num_extents[origDimensions.indexOf(dimensions[i])]);
            }
            num_extents = new_extents;
            origDimensions = dimensions.slice(0);
          })
      );

    // Add an axis and title.
    var g = svgDiv.selectAll(".dimension");
    g.append("g")
      .attr("class", "axis")
      .each(function (d) {
        d3.select(this).call(d3.axisLeft(yScale[d]));
      })
      //text does not show up because previous line breaks somehow
      .append("text")
      .attr("fill", "black")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function (d) {
        return d;
      });

    // Add and store a brush for each axis.
    g.append("g")
      .attr("class", "brush")
      .each(function (d) {
        if (yScale[d].name == "r") {
          // console.log(this);

          d3.select(this).call(
            (yScale[d].brush = d3
              .brushY()
              .extent([
                [-8, 0],
                [8, height],
              ])
              .on("start", brushstart_num)
              .on("brush", brush_parallel_chart_num))
          );
        }
      })
      .selectAll("rect")
      .attr("x", -8)
      .attr("width", 16);

       // Add title
       svgDiv
  .append("text")
  .attr("x", 390)
  .attr("y", -35 )
  .attr("text-anchor", "middle")
  .style("font-size", "18px")
  .style("font-weight", "bold")
  .text("Parallel Coordinates Plot (PCP) - Numeric Only");
  });
function position_num(d) {
  var v = dragging[d];
  return v == null ? xScale(d) : v;
}

function transition_num(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path_num(d) {
  return num_line(
    dimensions.map(function (p) {
      return [position_num(p), yScale[p](d[p])];
    })
  );
}

// brush start function
function brushstart_num() {
  d3.event.sourceEvent.stopPropagation();
}

// Handles a brush event, toggling the display of foreground lines.
function brush_parallel_chart_num() {
  for (var i = 0; i < dimensions.length; ++i) {
    if (d3.event.target == yScale[dimensions[i]].brush) {
      num_extents[i] = d3.event.selection.map(
        yScale[dimensions[i]].invert,
        yScale[dimensions[i]]
      );
    }
  }

  num_foreground.style("display", function (d) {
    return dimensions.every(function (p, i) {
      if (num_extents[i][0] == 0 && num_extents[i][0] == 0) {
        return true;
      }
      return num_extents[i][1] <= d[p] && d[p] <= num_extents[i][0];
    })
      ? null
      : "none";
  });
}

function redrawPCP(selectedDimensions,data) {
  // Update axis labels
  // svgDiv.selectAll(".dimension")
  //   .style("display", function(d) {
  //     return selectedDimensions.includes(d) ? null : "none";
  //   })
  //   .attr("transform", function(d) {
  //     return "translate(" + xScale(d) + ")";
  //   });
  // svgDiv.selectAll(".background").remove();
  //  // Update scale domains
  //  xScale.domain(selectedDimensions);

  //  // Update axis labels
  //  svgDiv.selectAll(".dimension")
  //      .attr("transform", function(d) {
  //          return "translate(" + xScale(d) + ")";
  //      });

  //  // Redraw polylines
  //  svgDiv.selectAll(".foreground path")
  //      .attr("d", path_num)
  //      .style("display", function(d) {
  //     return selectedDimensions.every(function(dim) {
  //       return !isNaN(d[dim]);
  //     }) ? null : "none";
  //   })
  //   .attr("d", function(d) {
  //     return path_num(d);
  //   });

// Reorder dimensions based on the selectedDimensions
dimensions = selectedDimensions.concat(dimensions.filter(d => !selectedDimensions.includes(d)));
    
// Update xScale domain
xScale.domain(dimensions);

// Update dimension groups
svgDiv.selectAll(".dimension")
    .transition()
    .duration(1000)
    .attr("transform", function (d) {
        return "translate(" + xScale(d) + ")";
    });

// Update axis labels
svgDiv.selectAll(".dimension .axis")
    .each(function (d) {
        d3.select(this).call(d3.axisLeft(yScale[d]));
    });

// Update brush for each axis
svgDiv.selectAll(".dimension .brush")
    .each(function (d) {
        if (yScale[d].name == "r") {
            d3.select(this).call(yScale[d].brush);
        }
    });

// Update foreground lines
svgDiv.selectAll(".foreground path")
    .transition()
    .duration(1000)
    .attr("d", path_num);
}

function generatePath(selectedDimensions, d) {
return path_num(selectedDimensions.map(function(dim) {
    return [xScale(dim), yScale[dim](d[dim])];
}));
}


let selectedK;

function renderKMeansMSEPlot(mseScores, kmeansElbow) {
  const margin = { top: 30, right: 50, bottom: 60, left: 50 };
  const width = 650 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select("#kmeans-plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Create x and y scales
  const xScale = d3
    .scaleBand()
    .domain(d3.range(1, mseScores.length + 1)) // Adjusted to include all values
    .range([0, width])
    .padding(0.1);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(mseScores)])
    .nice()
    .range([height, 0]);

  // Create bars for k-means MSE plot
  svg
    .selectAll(".bar")
    .data(mseScores)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d, i) => xScale(i + 1)) // Adjusted for correct positioning
    .attr("y", (d) => yScale(d))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => height - yScale(d))
    // .style("fill", "steelblue")
    .style("fill", (d, i) => (i + 1 === kmeansElbow ? "red" : "steelblue"))
    // Add event listener for click event
    .on("click", function (d, i) {
      const selectedK = i + 1; // Index i is 0-based, k starts from 1
      // Reset colors of all bars
      svg.selectAll(".bar").style("fill", "steelblue");
      // Highlight the clicked bar
      d3.select(this).style("fill", "red");
      // Log the selectedK value
      console.log("Selected K:", selectedK);
      fetch("/update_pcp_data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cluster_id: selectedK }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("/update_pcp_data", data);
          updatePCPDataPlot(data.data, data.cluster_labels);
        });
      // Fetch data and update as needed
      fetch("/update_cluster", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cluster_id: selectedK }),
      })
        .then((response) => response.json())
        .then((data) => {
          updateMDSDataPlot(data);
        })
        .catch((error) => console.error("Error updating MDS:", error));
    });

 

  // Add x-axis
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale).tickSizeOuter(0));

  // Add y-axis
  svg.append("g").call(d3.axisLeft(yScale));

  // Add x-axis label
  svg
    .append("text")
    .attr(
      "transform",
      "translate(" + width / 2 + " ," + (height + margin.top + 20) + ")"
    )
    .style("text-anchor", "middle")
    .text("Number of Clusters (k)");

  // Add y-axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("MSE Score");

  // Add title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 0 - margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("K-Means MSE Plot");
}
function updateMDSDataPlot(data) {

  d3.select("#mds-plot").selectAll("*").remove(); // Clear existing plot

  var margin = { top: 30, right: 20, bottom: 60, left: 40 },
    width = 720 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;

  var x = d3
    .scaleLinear()
    .domain([d3.min(data, (d) => d.MDS1), d3.max(data, (d) => d.MDS1)])
    .range([0, width]);

  var y = d3
    .scaleLinear()
    .domain([d3.min(data, (d) => d.MDS2), d3.max(data, (d) => d.MDS2)])
    .range([height, 0]);

  var xAxis = d3.axisBottom(x);
  var yAxis = d3.axisLeft(y);

  var svg = d3
    .select("#mds-plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // X-axis label
  svg
    .append("text")
    .attr(
      "transform",
      "translate(" + width / 2 + " ," + (height + margin.top + 20) + ")"
    )
    .style("text-anchor", "middle")
    .text("MDS1");

  // Y-axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("MDS2");

  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g").attr("class", "y-axis").call(yAxis);

  svg
    .selectAll(".dot")
    .data(data, d => d.id)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("r", 3.5)
    .attr("cx", (d) => x(d.MDS1))
    .attr("cy", (d) => y(d.MDS2))
    .style("fill", (d) => colorscale(d.Cluster_ID));

  // Add title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 0 - margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text(" MDS Data plots (Numeric Data Only)");

}


// Function to initialize the MDS plot
function initMDSDataPlot(data) {
  var margin = { top: 30, right: 20, bottom: 60, left: 40 },
      width = 720 - margin.left - margin.right,
      height = 450 - margin.top - margin.bottom;

  var x = d3.scaleLinear()
      .domain([d3.min(data, (d) => d.MDS1), d3.max(data, (d) => d.MDS1)])
      .range([0, width]);

  var y = d3.scaleLinear()
      .domain([d3.min(data, (d) => d.MDS2), d3.max(data, (d) => d.MDS2)])
      .range([height, 0]);

  var xAxis = d3.axisBottom(x);
  var yAxis = d3.axisLeft(y);

  var svg = d3.select("#mds-plot")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  // data.forEach(d => { d.originalX = x(d.MDS1); d.originalY = y(d.MDS2); });  // Store original positions

  // X-axis label
  svg.append("text")
      .attr("transform", "translate(" + width / 2 + " ," + (height + margin.top + 20) + ")")
      .style("text-anchor", "middle")
      .text("MDS1");

  // Y-axis label
  svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("MDS2");

  svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g").attr("class", "y-axis").call(yAxis);

  svg.selectAll(".dot")
      .data(data,d => d.id)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("r", 3.5)
      .attr("cx", (d) => x(d.MDS1))
      .attr("cy", (d) => y(d.MDS2))
      .style("fill", (d) => colorscale(d.Cluster_ID));

  // Add title
  svg.append("text")
      .attr("x", width / 2)
      .attr("y", 0 - margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text(" MDS Data plots (Numeric Data Only)");
}

// Function to fetch initial data and update the plot
fetch("/initial_data")
  .then((response) => response.json())
  .then((data) => {
    initMDSDataPlot(data)
    // updateMDSDataPlot(data);
  });
var dimensionOrder = []; // This will store the order of dimensions based on clicks

function updateMDSVariablePlot(data) {
  d3.select("#mds-variable-plot").selectAll("*").remove(); // Clear existing plot

  var margin = { top: 30, right: 70, bottom: 60, left: 40 },
    width = 650 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  var x = d3
    .scaleLinear()
    .domain([d3.min(data, (d) => d.MDS1), d3.max(data, (d) => d.MDS1)])
    .range([0, width]);

  var y = d3
    .scaleLinear()
    .domain([d3.min(data, (d) => d.MDS2), d3.max(data, (d) => d.MDS2)])
    .range([height, 0]);

  var xAxis = d3.axisBottom(x);
  var yAxis = d3.axisLeft(y);

  var svg = d3
    .select("#mds-variable-plot")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Add dots
  svg
    .selectAll(".dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("r", 4.5)
    .attr("cx", (d) => x(d.MDS1))
    .attr("cy", (d) => y(d.MDS2))
    .style("fill", "steelblue")
    .on("click", function (d) {
      handleMDSClick(d.DimensionName, data); // Assuming 'DimensionName' is the key for dimension names
    }); // Set color of dots

  // Add labels to points with different colors
  svg
    .selectAll(".text")
    .data(data)
    .enter()
    .append("text")
    .attr("x", (d) => x(d.MDS1) + 5)
    .attr("y", (d) => y(d.MDS2) + 5)
    .text((d) => d.DimensionName) // Assuming 'DimensionName' is the key for dimension names
    .style("font-size", "12px")
    .style("fill", (d, i) => colorscale(i % 10)); // Use color scale with 10 colors

  // X-axis label
  svg
    .append("text")
    .attr(
      "transform",
      "translate(" + width / 2 + " ," + (height + margin.top + 20) + ")"
    )
    .style("text-anchor", "middle")
    .text("MDS1");

  // Y-axis label
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("MDS2");
  svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g").attr("class", "y-axis").call(yAxis);

  // Add title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 0 - margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text(" MDS Variable plots (Numerical Data only)");
}

// Function to fetch initial data and update the plot
fetch("/mds_data")
  .then((response) => response.json())
  .then((data) => {
    updateMDSVariablePlot(data);
  });

  var margin = { top: 50, right: 10, bottom: 10, left: 10 },
  width = 1450 - margin.left - margin.right;
height = 500 - margin.top - margin.bottom;

  var data_line = d3.line(),
  //axis = d3.axisLeft(x),
  data_background,
  data_foreground,
  data_extents,
  dims,
  origdims;
  var x = d3.scalePoint().rangeRound([0, width]).padding(1),
  y = {},
  data_dragging = {};
  var container = d3
  .select("#parallel-plot") // Change the selector to match the initial container
  .append("div")
  .attr("class", "parcoords")
  .style("width", width + margin.left + margin.right + "px")
  .style("height", height + margin.top + margin.bottom + "px");

var svg = container
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


var quant_p = function (v) {
  return parseFloat(v) == v || v == "";
};
// Fetch initial data and cluster ID
fetch("/data")
  .then((response) => response.json())
  .then((data) => {
    // Fetch cluster ID data
    fetch("/cluster_id")
      .then((response) => response.json())
      .then((clusterData) => {
        const cluster_id = clusterData.cluster_id;
   
      dims = d3.keys(data[0]);
      origdims = dims.slice(0);
  
      x.domain(dims);
  
      dims.forEach(function (d) {
        var vals = data.map(function (p) {
          return p[d];
        });
        if (vals.every(quant_p)) {
          y[d] = d3
            .scaleLinear()
            .domain(
              d3.extent(data, function (p) {
                return +p[d];
              })
            )
            .range([height, 0]);
        } else {
          vals.sort();
          y[d] = d3
            .scalePoint()
            .domain(
              vals.filter(function (v, i) {
                return vals.indexOf(v) == i;
              })
            )
            .range([height, 0], 1);
        }
      });
  
      data_extents = dims.map(function (p) {
        return [0, 0];
      });
  
      // Add grey background lines for context.
      data_background = svg
        .append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "background-path") // Assign a class to the background paths
        .attr("d", path);
  
      // Add blue foreground lines for focus.
      data_foreground = svg
        .append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "foreground-path") // Assign a class to the foreground paths
        .attr("d", path);
  
        // Define color scale based on cluster ID
        const colorScale = d3
          .scaleOrdinal(d3.schemeCategory10)
          .domain(d3.range(cluster_id));

        // Update polylines' color based on cluster ID
        data_foreground.style("stroke", (d, i) => colorScale(i % cluster_id));
    
        var g = svg
        .selectAll(".dimension")
        .data(dims)
        .enter()
        .append("g")
        .attr("class", "dimension")
        .attr("transform", function (d) {
          return "translate(" + x(d) + ")";
        })
        .call(
          d3
            .drag()
            .subject(function (d) {
              return { x: x(d) };
            })
            .on("start", function (d) {
              data_dragging[d] = x(d);
              data_background.attr("visibility", "hidden");
            })
            .on("drag", function (d) {
              data_dragging[d] = Math.min(width, Math.max(0, d3.event.x));
              data_foreground.attr("d", path);
              dims.sort(function (a, b) {
                return position(a) - position(b);
              });
              // extents.forEach(function(ext, idx) {
              //   if(origDi)
  
              // })
              x.domain(dims);
              g.attr("transform", function (d) {
                return "translate(" + position(d) + ")";
              });
            })
            .on("end", function (d) {
              delete data_dragging[d];
              transition(d3.select(this)).attr(
                "transform",
                "translate(" + x(d) + ")"
              );
              transition(data_foreground).attr("d", path);
              data_background
                .attr("d", path)
                .transition()
                .delay(500)
                .duration(0)
                .attr("visibility", null);
  
              var new_extents = [];
              for (var i = 0; i < dims.length; ++i) {
                new_extents.push(data_extents[origdims.indexOf(dims[i])]);
              }
              data_extents = new_extents;
              origdims = dims.slice(0);
            })
        );
  
      // Add an axis and title.
      var g = svg.selectAll(".dimension");
      g.append("g")
        .attr("class", "axis")
        .each(function (d) {
          d3.select(this).call(d3.axisLeft(y[d]));
        })
        //text does not show up because previous line breaks somehow
        .append("text")
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("font-size", "11px")
        .attr("y", -9)
        .text(function (d) {
          return d;
        });
  
      // Add and store a brush for each axis.
      g.append("g")
        .attr("class", "brush")
        .each(function (d) {
          if (y[d].name == "r") {
            // console.log(this);
  
            d3.select(this).call(
              (y[d].brush = d3
                .brushY()
                .extent([
                  [-8, 0],
                  [8, height],
                ])
                .on("start", brushstart)
                .on("brush", brush_parallel_chart))
            );
          }
        })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);

        svg
        .append("text")
        .attr("x", 690)
        .attr("y", -30 )
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Parallel Coordinates Plot (PCP)");


        updatePCPDataPlot(data, cluster_id);

      });
  });

  // function path(d) {
  //   return data_line(dims.map(function(p) { return [position(p), y[p](d[p])]; }));
  // }
  function position(d) {
    var v = data_dragging[d];
    return v == null ? x(d) : v;
  }

  function transition(g) {
    return g.transition().duration(500);
  }

function path(d) {
  return data_line(dims.map(function(p) { return [position(p), y[p](d[p])]; }));
}

  // brush start function
  function brushstart() {
    d3.event.sourceEvent.stopPropagation();
  }

  // Handles a brush event, toggling the display of foreground lines.
  function brush_parallel_chart() {
    for (var i = 0; i < dims.length; ++i) {
      if (d3.event.target == y[dims[i]].brush) {
        data_extents[i] = d3.event.selection.map(y[dims[i]].invert, y[dims[i]]);
      }
    }

    data_foreground.style("display", function (d) {
      return dims.every(function (p, i) {
        if (data_extents[i][0] == 0 && data_extents[i][0] == 0) {
          return true;
        }
        return data_extents[i][1] <= d[p] && d[p] <= data_extents[i][0];
      })
        ? null
        : "none";
    });
  }
  function updatePCPDataPlot(data, clusterLabels) {
    data_foreground = d3.select("#parallel-plot").selectAll(".foreground-path").data(data);
    const colorScale = d3
      .scaleOrdinal()
      .domain([...new Set(clusterLabels)])
      .range(d3.schemeCategory10); // or any other color scheme
  
    data_foreground.style("stroke", (d, i) => colorScale(clusterLabels[i]));
    data_foreground.attr("d", path);

  }