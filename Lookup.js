    require([
      "esri/tasks/QueryTask",
      "esri/tasks/support/Query",
      "esri/tasks/FindTask",
      "esri/tasks/support/FindParameters",
      "dojo/_base/array",
      "dojo/dom",
      "dojo/on",
      "dojo/domReady!"
    ], function(QueryTask, Query, FindTask, FindParameters, arrayUtils, dom, on) {

      var loadingImg = dom.byId("loading");

      // Create a FindTask pointing to a map service containing point layer for text lookup and polygon layer for spatial query
      var find = new FindTask({
        url: "http://gis2.co.frederick.va.us/arcgisweb/rest/services/FC_GIS/TextAddressLookup_COR/MapServer"
      });

      // Set parameters to only query the point layer by field name
      var params = new FindParameters({
        // Set Layer ID for point layer from map service
        layerIds: [0],
        // Set Field name for lookup from point layer in map service
        searchFields: ["ADDRESS"],
        returnGeometry: true
      });

      // Query task REST endpoint for polygon layer to be queried.
      var qt = new QueryTask({
        url: "http://gis2.co.frederick.va.us/arcgisweb/rest/services/FC_GIS/TextAddressLookup_COR/MapServer/1"
      });



      // Called on each button click
      function doFind() {

        // Display loading gif to provide the user feedback on search progress
        loadingImg.style.visibility = "visible";
        // Set the search text to the value of the input box
        if ((document.getElementById("txtAddress").value).length == 0) {
          //alert("Please enter an address in the box.");
          resultsTable.innerHTML = "<i>Please enter an address in the box above.</i>";
          loadingImg.style.visibility = "hidden";
          return;
        }
        params.searchText = dom.byId("txtAddress").value;
        // The execute() performs a LIKE SQL (FindTask) query based on the provided text value
        // showResults() is called once the promise returned here resolves
        // find.execute(params).then(showResults, rejectedPromise);

        find.execute(params)
          .then(doGeoQuery)
          .otherwise(rejectedPromise);
      }



      // Called if the Promise Resolves for the FindTask "find"
      function doGeoQuery(response) {

        //Empty the HTML table from previous results
        resultsTable.innerHTML = "";
        // Setup HTML table for new results
        // Set up row for descriptive headers to display results
        var topRow = resultsTable.insertRow(0);
        var cell1 = topRow.insertCell(0);
        var cell2 = topRow.insertCell(1);
        var cell3 = topRow.insertCell(2);
        
        cell1.innerHTML = "<b>Address</b>";
        cell2.innerHTML = "<b>Record Number</b>";
        cell3.innerHTML = "<b>Jurisdiction</b>";
        
        // "response.results" is the data object containing fields and geometry from the found feature
        // empty the array from previous results
        resultsarray = [];
        var results = response.results;
        // If no results are returned from the FindTask "find", notify the user
        if (results.length === 0) {
          resultsTable.innerHTML = "<i>No results found</i>";
          loadingImg.style.visibility = "hidden";
          return;
        }
        
        // Performs Spatial Query and writes results for each result returned from the FindTask "find"
        arrayUtils.forEach(results, function(findResult, i) {
          // Get each value of the desired attributes from the FindTask "find"
          var geo = findResult.feature.geometry;
          var adr = findResult.feature.attributes.ADDRESS;
          var recnum = findResult.feature.attributes.RECNUM;
          
          //Setup Spatial Query
          var spatialquery = new Query();
          spatialquery.outFields = ["CITY"];
          spatialquery.geometry = geo;
          spatialquery.spatialRelationship = "intersects";
          
          // execute QueryTask for Spatial Query
          qt.execute(spatialquery).then(function(spatialresults) {
            // grab attribute from spatial query 
            var city = spatialresults.features[0].attributes.CITY;
            //push results to array
            resultsarray.push(adr);
            resultsarray.push(recnum);
            resultsarray.push(city);

            // If no results are returned from the task, notify the user
            if (resultsarray.length === 0) {
              resultsTable.innerHTML = "<i>No results found</i>";
              loadingImg.style.visibility = "hidden";
              return;
            }

            // Write html table underneath header row
            var i = 1;
            // Add each resulting value to the table as a new row, and create cells
            var row = resultsTable.insertRow(i);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            // Assign values to cells
            cell1.innerHTML = adr;
            cell2.innerHTML = recnum;
            cell3.innerHTML = city;
            // hide loading gif
            loadingImg.style.visibility = "hidden";
            i++;
          })
        });
      }
      
      // Assign results table to the html table by ID
      var resultsTable = dom.byId("tblAddress");

      // Executes each time the promise from find.execute() is rejected.
      function rejectedPromise(err) {
        console.error("Promise didn't resolve: ", err.message);
      }

      // methods to execute the function
      // Run doFind() when button is clicked
      on(dom.byId("btnFind"), "click", doFind);

      // "Clicks" btnFind when "Enter" is pressed on keyboard, thereby running doFind()
      document.getElementById('txtAddress').addEventListener('keypress', function(event) {
        if (event.keyCode == 13) {
            document.getElementById('btnFind').click();
        }
      });
    });
