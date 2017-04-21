var EVLIS_NAMESPACE = "xmlns:elvis='http://www.iscev.org/ElVisML-v1'";
var UNIT_CONVERSION = new Array();
UNIT_CONVERSION["nV"] = new Array();
UNIT_CONVERSION["micros"] = new Array(),
    UNIT_CONVERSION["s"] = new Array(),
    UNIT_CONVERSION["nV"]["microV"] = 1/1000;
UNIT_CONVERSION["micros"]["ms"] = 1/1000;
UNIT_CONVERSION["s"]["ms"] = 1000;

var CHANNEL_COLOR = new Array();
CHANNEL_COLOR["OD"] = "red";
CHANNEL_COLOR["OS"] = "blue";
CHANNEL_COLOR["BOTH"] = "black";
CHANNEL_COLOR["NONE"] = "black";

var plots = new Array();
var dataList = new Array();

function createDOMDocument(elvisml) {
    var xmlDoc = (new DOMParser()).parseFromString(elvisml, "text/xml");
    xmlDoc.setProperty("SelectionNamespaces", EVLIS_NAMESPACE);
    xmlDoc.setProperty("SelectionLanguage", "XPath");

    return xmlDoc;
}

function getSubjectNode(xmlDoc) {
    var path1 = "/elvis:ElVis/elvis:Subjects/elvis:Subject[1]";
    return xmlDoc.selectSingleNode(path1);
}

function getSubjectName(subjectNode) {
    var path1 = "elvis:Firstname/text()";
    var path2 = "elvis:Lastname/text()";

    var firstname = subjectNode.selectSingleNode(path1).nodeValue;
    var lastname = subjectNode.selectSingleNode(path2).nodeValue;

    return firstname + ' ' + lastname;
}

function getSubjectName4Step(elvisNode, stepNode) {
    var path1 = "@subjectRef";
    var subjectId = stepNode.parentNode.parentNode.selectSingleNode(path1).nodeValue;

    var path3 = "/*/*/elvis:Subject[@id = '" + subjectId + "']";

    var subjectNode = elvisNode.selectSingleNode(path3);
    var subjectName = getSubjectName(subjectNode);
    return subjectName;
}

function getSubjectBirthdate(subjectNode) {
    var path1 = "elvis:Birthdate/text()";

    return Date.parseIso8601(subjectNode.selectSingleNode(path1).nodeValue);
}

function getSubjectGender(subjectNode) {
    path1 = "elvis:Gender/text()";

    return subjectNode.selectSingleNode(path1).nodeValue;
}

function getRecordingSessionNode(xmlDoc) {
    var path1 = "/elvis:ElVis/elvis:RecordingSessions/elvis:RecordingSession[1]";

    return xmlDoc.selectSingleNode(path1);
}

function getRecordingDate(recordingSessionNode) {
    var path1 = "elvis:RecordingDate/text()";

    return Date.parseIso8601(recordingSessionNode.selectSingleNode(path1).nodeValue);
}

function getRecordingComments(recordingSessionNode) {
    var path1 = "elvis:Comments/elvis:Comment";
    var path2 = "@creator";
    var path3 = "@created";
    var path4 = "text()";
    var commentNodes = recordingSessionNode.selectNodes(path1);
        
    var commentString = "";
    for (i = 0; i < commentNodes.length; i++) {
        var commentNode = commentNodes[i];
        var creator = commentNode.selectSingleNode(path2).nodeValue;
        var created = Date.parseIso8601(commentNode.selectSingleNode(path3).nodeValue).format("mmmm dS, yyyy HH:MM");
        var text = commentNode.selectSingleNode(path4).nodeValue;

        commentString += text + " <i>(" + creator + ", " + created + ")</i>" + "\n";
    }

    return commentString;
}

function calcAge(birthdate, recordingdate) {
    var age = recordingdate.getFullYear() - birthdate.getFullYear();

    return age;
}

function getProtocol(xmlDoc) {
    var path = "/elvis:ElVis/elvis:Protocols/elvis:Protocol[1]";
    return xmlDoc.selectNodes(path)[0];
}

function getProtocolName(elvisNode, stepNode) {
  var stepDefinitionNode = getStepDefinition4Step(elvisNode, stepNode);
  var protocolNode = stepDefinitionNode.parentNode.parentNode;
  var protocolName = protocolNode.selectSingleNode("elvis:Name/text()").nodeValue;
  return protocolName;
}

function getStepNames(protocolNode) {
    var path1 = "elvis:SequenceDefinition/elvis:StepDefinition/elvis:Name/text()";
    var stepNameNodes = protocolNode.selectNodes(path1);

    var stepNames = new Array();
    for (i = 0; i < stepNameNodes.length; i++) {
        stepNames[i] = stepNameNodes[i].nodeValue;
    }
    return stepNames;
}

function getStepNodes(recordingSessionNode) {
    var path = "elvis:Sequence/elvis:Step";
    return recordingSessionNode.selectNodes(path);
}

/*
 function getStepNodeByName(protocolNode, recordingSessionNode, stepName) {
 var stepDefinitionId = protocolNode.selectSingleNode("elvis:SequenceDefinition/elvis:StepDefinition[elvis:Name='" + stepName + "']/@id").nodeValue;
 var stepNode = recordingSessionNode.selectSingleNode("elvis:Sequence/elvis:Step[@stepDefinition='" + id + "']");
 return stepNode;
 }
 */

function getStepNodeByIndex(recordingSessionNode, index) {
    var stepNode = recordingSessionNode.selectSingleNode("elvis:Sequence/elvis:Step[" + (index + 1) + "]");
    return stepNode;
}

function getChannelNodes(stepNode) {
    var path = "elvis:Channels/elvis:Channel";
    return stepNode.selectNodes(path);
}

function getAverageNodes(channelNode) {
    var path = "elvis:Averages/elvis:Average";
    return channelNode.selectNodes(path);
}

function getCursorNodes(averageNode) {
    var path = "elvis:Cursors/elvis:Cursor";
    return averageNode.selectNodes(path);
}

function getCursorCoordinates(elvisNode, cursorNode, xUnit, yUnit) {
    var path1 = "elvis:Domain/text()";
    var path2 = "elvis:Range/text()";
    var path3 = "elvis:Domain/@unit";
    var path4 = "elvis:Range/@unit";
    var x = cursorNode.selectSingleNode(path1).nodeValue;
    var y = cursorNode.selectSingleNode(path2).nodeValue;
    var xCurrentUnit = cursorNode.selectSingleNode(path3).nodeValue;
    var yCurrentUnit = cursorNode.selectSingleNode(path4).nodeValue;

    x = convert(xCurrentUnit, xUnit, x);
    y = convert(yCurrentUnit, yUnit, y);

    var path7 = "@cursorDefinitionRef";
    var cursorDefinitionRef = cursorNode.selectSingleNode(path7).nodeValue;

    var path5 = "/*/*/*/*/*/*/elvis:CursorDefinition[@id='" + cursorDefinitionRef + "']";
    var cursorDefinitionNode = elvisNode.selectSingleNode(path5);

    var path8 = "elvis:RelativeTo/elvis:CursorDefinitionRef/text()";
    var temp = cursorDefinitionNode.selectSingleNode(path8);
    if (temp != null) {
        var relativeCursorDefinitionRef = temp.nodeValue;


        var path10 = "ancestor::*/elvis:Cursor[@cursorDefinitionRef='" + relativeCursorDefinitionRef + "']";
        var relativeCursorNode = cursorNode.selectSingleNode(path10);
        var relativeCoords = getCursorCoordinates(elvisNode, relativeCursorNode, xUnit, yUnit);

        y = y + relativeCoords[1];
    }

    var path6 = "elvis:Name/text()";
    var name = cursorDefinitionNode.selectSingleNode(path6).nodeValue;

    return [x, y, name];
}

function getData(averageNode, samplingRate, preTriggerTime, rangeFromUnit, rangeToUnit) {
    var path2 = "elvis:Values/text()";

    var yArray = string2floatArray(averageNode.selectSingleNode(path2).nodeValue);

    var result = new Array();
    for (i = 0; i < yArray.length; i++) {
        var x = convert("s", "ms", i * 1/samplingRate) - preTriggerTime;
        var y = convert(rangeFromUnit, rangeToUnit, yArray[i]);
        result.push([x , y]);
    }

    return result;
}

function getStepDefinition4Step(elvisNode, stepNode) {
    var path1 = "@stepDefinitionRef";
    var stepDefinitionId = stepNode.selectSingleNode(path1).nodeValue;

    var path3 = "/*/*/*/*/elvis:StepDefinition[@id = '" + stepDefinitionId + "']";

    var stepDefinitionNode = elvisNode.selectSingleNode(path3);
    return stepDefinitionNode;
}

function getSamplingRate(elvisNode, stepNode) {
    var stepDefinitionNode = getStepDefinition4Step(elvisNode, stepNode);

    var path4 = "elvis:AcquisitionSettings/elvis:SamplingRate/text()";
    var samplingRate = stepDefinitionNode.selectSingleNode(path4).nodeValue;

    return parseFloat(samplingRate);
}

function getPreTriggerTime(elvisNode, stepNode, toUnit) {
    var stepDefinitionNode = getStepDefinition4Step(elvisNode, stepNode);

    var path4 = "elvis:AcquisitionSettings/elvis:PreTriggerTime/text()";
    var preTriggerTime = stepDefinitionNode.selectSingleNode(path4).nodeValue;

    var path5 = "elvis:AcquisitionSettings/elvis:PreTriggerTime/@unit";
    var unit = stepDefinitionNode.selectSingleNode(path5).nodeValue;

    return convert(unit, toUnit, parseFloat(preTriggerTime));
}

function getRangeUnit(averageNode) {
    var path1 = "elvis:Values/@unit";
    return averageNode.selectSingleNode(path1).nodeValue;
}

function getChannelDefinition4Channel(elvisNode, channelNode) {
    var path1 = "@channelDefinitionRef";

    var channelDefinitionId = channelNode.selectSingleNode(path1).nodeValue;

    var path3 = "/*/*/*/*/*/*/elvis:ChannelDefinition[@id = '" + channelDefinitionId + "']";

    var channelDefinitionNode = elvisNode.selectSingleNode(path3);

    return channelDefinitionNode;
}

function getChannelName(elvisNode, channelNode) {
    var channelDefinitionNode = getChannelDefinition4Channel(elvisNode, channelNode);
    var path1 = "elvis:Name/text()";
    var name = channelDefinitionNode.selectSingleNode(path1).nodeValue;
    return name;
}

function getChannelEye(elvisNode, channelNode) {
    var channelDefinitionNode = getChannelDefinition4Channel(elvisNode, channelNode);
    var path1 = "elvis:Eye/text()";
    var eye = channelDefinitionNode.selectSingleNode(path1).nodeValue;
    return eye;
}

function getStepName(elvisNode, stepNode) {
  var stepDefinitionNode = getStepDefinition4Step(elvisNode, stepNode);  
  var path1 = "elvis:Name/text()";
  var stepName = stepDefinitionNode.selectSingleNode(path1).nodeValue;
  return stepName;
}

function string2floatArray(arrayString) {
    var array = arrayString.match(/-?\d+\.?\d*|"[^"]+"/g);
    for(var i = 0; i < array.length; i++) {
        array[i] = parseFloat(array[i])
    }

    return array;
}

function convert(fromUnit, toUnit, value) {
    return value * UNIT_CONVERSION[fromUnit][toUnit];
}
var clipboardText;

function createPlots(tabContent, elvisNode, stepNode) {
    clipboardText = ['Protocol', 'Subject', 'DOE', 'comments', 'Step','Channel #','Eye','Cursor','Implicit time (ms)','amplitude (microVolt)'].join('\t');
    
    plots.splice(0, plots.length);
    dataList.splice(0, dataList.length);

    var subjectName = getSubjectName4Step(elvisNode, stepNode);
    var comments = getRecordingComments(stepNode.parentNode.parentNode).replace('\n', ',');
    var doe = getRecordingDate(stepNode.parentNode.parentNode).format("yyyy-mm-dd HH:MM Z");
    var protocolName = getProtocolName(elvisNode, stepNode);
    var stepName = getStepName(elvisNode, stepNode);
    var samplingRate = getSamplingRate(elvisNode, stepNode);
    var channelNodes = getChannelNodes(stepNode);

    var tabContentNode = document.getElementById(tabContent);

    for (var i = 0; i < plots.length; i++) {
        plots[i].destroy();
    }
    while(tabContentNode.hasChildNodes()) {
        tabContentNode.removeChild(tabContentNode.childNodes[0]);
    }

    var yMin = Number.MAX_VALUE;
    var yMax = Number.MIN_VALUE;

    for (var j = 0; j < channelNodes.length; j++) {
        var channelNode = channelNodes[j];
        var averageNode = getAverageNodes(channelNode)[0];

        var eye = getChannelEye(elvisNode, channelNode);
        var channelName = getChannelName(elvisNode, channelNode);

        var cursorNodes = getCursorNodes(averageNode);
        var cursorCoordinates = new Array();
        for (var k = 0; k < cursorNodes.length; k++) {
            var coords = getCursorCoordinates(elvisNode, cursorNodes[k], "ms", "microV");
            cursorCoordinates.push(coords);
        }
        var cursorVisible = (cursorCoordinates.length > 0);
        if (!cursorVisible) {
            cursorCoordinates.push(new Array(0));
        }

        var plotContainer = document.createElement("div");
        plotContainer.id = "c" + j;
        plotContainer.style.cssFloat = "left";
        plotContainer.style.width = "480px";
        tabContentNode.appendChild(plotContainer);

        if (cursorVisible) {
            var cursorContainer = document.createElement("div");
            cursorContainer.id = "cc" + j;
            cursorContainer.style.cssFloat = "left";
            cursorContainer.style.position = "relative";
            cursorContainer.style.top = "9px";

            tabContentNode.appendChild(cursorContainer);
            plotContainer.style.width = "400px";
        }

        var cursors = new Array(new Array('Cursor', 'ms', '&#956;V'));
        for (var i = 0; i < cursorCoordinates.length; i++) {
            cursors.push(new Array(cursorCoordinates[i][2], Math.round(cursorCoordinates[i][0]), Math.round(cursorCoordinates[i][1] * 10) / 10));
            clipboardText += '\n';
            clipboardText += [
              '"' + protocolName + '"',
              '"' + subjectName + '"',
              doe,
              '"' + comments + '"',
              '"' + stepName + '"',
              '"' + channelName + '"',
              '"' + eye + '"',
              '"' + cursorCoordinates[i][2] + '"',
              Math.round(cursorCoordinates[i][0]),
              (Math.round(cursorCoordinates[i][1] * 10) / 10)
            ].join('\t');
        }
        $('div#cc' + j).arrayToTable(cursors, {tHeader: true, tCaption: false, tCaptionText: 'Captiontext.', columnFilter: false, rowCount: false});

        if (j % 2 == 1) {
            var br = document.createElement("br");
            br.style.clear = "both";
            tabContentNode.appendChild(br);
        }

        var preTriggerTime = getPreTriggerTime(elvisNode, stepNode, "ms");
        var rangeUnit = getRangeUnit(averageNode);
        var data = getData(averageNode, samplingRate, preTriggerTime, rangeUnit, "microV");

        var entry = new Object();
        entry[channelName + " (" + eye + ")"] = data;
        dataList.push(entry);
        
        var xMin = data[0][0];
        var xMax = data[data.length-1][0];


        for (var i = 0; i < data.length; i++) {
            if (data[i][1] < yMin) {
                yMin = data[i][1];
            } else if (data[i][1] > yMax) {
                yMax = data[i][1];
            }
        }
        yMin = Math.round(yMin / 10) * 10 - 10;
        yMax = Math.round(yMax / 10) * 10 + 10;

        var color = CHANNEL_COLOR[eye];

        var plotData = new Array();
        plotData.push(data);
        if (cursorVisible) {
            plotData.push(cursorCoordinates);
        }
        var plot = $.jqplot(
            plotContainer.id,
            plotData, {
                axes: {
                    yaxis: {
                        label: '&#956;V',
//                        tickInterval: 10
                        autoscale: false,
                        rendererOptions: {
                            forceTickAt0: true
                        }
                    },
                    xaxis: {
                        min: xMin,
                        max: xMax,
                        label: 'ms',
//                        tickInterval: 10
                        autoscale: false,
                        rendererOptions: {
                            forceTickAt0: true
                        }
                    }
                },

                series: [{
                    label: channelName + " (" + eye + ")",
                    color: color,
                    showMarker: false,
                    neighborThreshold: 0,
                    pointLabels: {
                        show: false
                    }
                }, {
                    showLabel: false,
                    showLine: false,
                    markerRenderer: $.jqplot.MarkerRenderer,
                    markerOptions: {
                        style: 'square'
                    },
                    color: '#666666',
                    showMarker: cursorVisible,
                    pointLabels: {
                        show: cursorVisible,
                        location: 'n',
                        ypadding: 5
                    }
                }
                ],

                legend: {
                    renderer: $.jqplot.EnhancedLegendRenderer,
                    rendererOptions: {
                        numberRows: null,
                        numberColumns: 0,
                        seriesToggle: "fast",
                        disableIEFading: true
                    },
                    show: true,
                    location: 'ne',
                    xoffset: 30,
                    yoffset: 12
                },

                cursor: {
                    style: 'crosshair',
                    show: true,
                    showTooltip: true,
                    intersectionThreshold: 1,
                    tooltipLocation: 'se',
                    zoom: true,
                    showTooltipDataPosition: true,
                    showVerticalLine: true,
                    tooltipFormatString: "%d %s ms, %s &#956;V"
                }
            });


        plots.push(plot);
    }
    for (var i = 0; i < plots.length; i++) {
        plots[i].axes.yaxis.min = yMin;
        plots[i].axes.yaxis.max = yMax;
        plots[i].redraw();
    }
}