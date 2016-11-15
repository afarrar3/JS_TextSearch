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

      // Executes on each button click
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
        // The execute() performs a LIKE SQL query based on the provided text value
        // showResults() is called once the promise returned here resolves
        // find.execute(params).then(showResults, rejectedPromise);

        find.execute(params)
          .then(doGeoQuery)
          .otherwise(rejectedPromise);
          //debugger;
      }

      function doGeoQuery(response) {
        // "response.results" is the data object containing fields and geometry from the found feature
        resultsarray = [];
        var results = response.results;
        // If no results are returned from the task, notify the user
        if (results.length === 0) {
          resultsTable.innerHTML = "<i>No results found</i>";
          loadingImg.style.visibility = "hidden";
          return;
        }
        arrayUtils.forEach(results, function(findResult, i) {
          resultsarray.length = 0;
          // Get each value of the desired attributes
          var geo = findResult.feature.geometry;
          var adr = findResult.feature.attributes.ADDRESS;
          var recnum = findResult.feature.attributes.RECNUM;
          //resultsarray.push(adr);
          //resultsarray.push(recnum);
          //console.log("geo",geo);
          //console.log("adr",adr);
          //console.log("recnum",recnum);
          var spatialquery = new Query();
          spatialquery.outFields = ["CITY"];
          spatialquery.geometry = geo;
          spatialquery.spatialRelationship = "intersects";
          // execute QueryTask
          qt.execute(spatialquery).then(function(spatialresults) {
            //console.log("spatialresults.features", spatialresults.features);
            resultsarray.push(adr);
            resultsarray.push(recnum);
            resultsarray.push(spatialresults.features[0].attributes.CITY);
            //resultsarray.push(spatialresults.features[0].attributes.PIN);
            //console.log("resultsarrayloop",resultsarray);
            //debugger;
            resultsTable.innerHTML = "";

            // If no results are returned from the task, notify the user
            if (resultsarray.length === 0) {
              resultsTable.innerHTML = "<i>No results found</i>";
              loadingImg.style.visibility = "hidden";
              return;
            }
            //console.log("resutls",results);

            // Set up row for descriptive headers to display results
            var topRow = resultsTable.insertRow(0);
            var cell1 = topRow.insertCell(0);
            var cell2 = topRow.insertCell(1);
            var cell3 = topRow.insertCell(2);
            //var cell4 = topRow.insertCell(3);
            //var cell5 = topRow.insertCell(4);
            cell1.innerHTML = "<b>Address</b>";
            cell2.innerHTML = "<b>Record Number</b>";
            cell3.innerHTML = "<b>Jurisdiction</b>";
            //cell4.innerHTML = "<b>PIN</b>";
            //cell5.innerHTML = "<b>geometry</b>";

            //console.log("resultsarray",resultsarray);

            // Loop through each result in the response and add as a row in the table
            var n = 0;
            arrayUtils.forEach(results, function(printResult, i) {
              // Get each value of the desired attributes
              var adr = resultsarray[n];
              n++;
              var recnum = resultsarray[n];
              n++;
              var city = resultsarray[n];
              n++;
              //var pin = resultsarray[n];
              //n++;


              // Add each resulting value to the table as a row
              var row = resultsTable.insertRow(i + 1);
              var cell1 = row.insertCell(0);
              var cell2 = row.insertCell(1);
              var cell3 = row.insertCell(2);
              //var cell4 = row.insertCell(3);
              //var cell5 = row.insertCell(4);
              cell1.innerHTML = adr;
              cell2.innerHTML = recnum;
              cell3.innerHTML = city;
              //cell4.innerHTML = pin;
              //cell5.innerHTML = geo;
              loadingImg.style.visibility = "hidden";
            });
          })
        });
      }

      var resultsTable = dom.byId("tblAddress");

      // Executes each time the promise from find.execute() is rejected.
      function rejectedPromise(err) {
        console.error("Promise didn't resolve: ", err.message);
        debugger;
      }

      // Run doFind() when button is clicked
      on(dom.byId("btnFind"), "click", doFind);
      //Run doFind() when "enter" is pressed on keyboard
      document.getElementById('txtAddress').addEventListener('keypress', function(event) {
        if (event.keyCode == 13) {
            document.getElementById('btnFind').click();
        }
      });
    });