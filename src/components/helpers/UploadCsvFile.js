import {
    
    getAttributeDetails,
    isDuplicate,
    createTrackedEntity,
    getOrgUnitDetail,
    amrIdSqlView,
    getDataStoreNameSpace,
    getElementDetails,
    getOptionSetDetails,
    getEventId,
    updateEvent,
    getDataElementsDetails,
    getCategoryCombosOptionsDetails,
    createTrackedEntityInstance,
    getAggregatedDataValue,
    postAggregatedDataValue,

  } from '../api/API';
  import { formatDate } from './DateFormat';
  import * as config from '../../config/Config';
  import { hash } from './Hash';
  import { get } from '../api/CRUD';
  import { post } from '../api/CRUD';
  import { request } from '../api/Request';
import {AlertBar} from "@dhis2/ui-core";
import React from "react";

//https://ln2.hispindia.org/amr_vnimport/api/dataElements.json?paging=false&fields=id,displayName,formName,attributeValues[value,attribute[id,name]]
//https://ln2.hispindia.org/amr_vnimport/api/categoryCombos.json?paging=false&fields=id,displayName,code,categoryOptionCombos[id,displayName,categoryOptions[id,code,displayName]]
    export const uploadCsvFile = async (result, orgUnitId, importFileType, requiredColumnsAttValue, dataElements, attributes, eventDate, _this) => {
      //console.log(_this);
      let csvData = result.data;
      let elementId = "";
      let attributeId = "";
      let eventDateValue = "";
      let elementValue = "";
      let teiPayloadString = {};
      let trackedEntityJson;
      let dataStoreNamespaceElements   = [];
      let dataStoreNamespaceAttributes = [];
      let dataStoreNamespaceOptions    = [];
      let dataStoreNameSpaceEventDate = [];
      let duplicateRecordStatus = false;
      let eventPayloadString = {};
      let eventPayloadForPushToAggregatedDataValue = {};

      let dataElementObjects={};
      //const getDataElementObjects = await getDataElementsDetails();
     //dataElementObjects  = getDataElementObjects;
     await getDataElementsDetails().then((dataElementsResponse) => {
        let tempResponse = dataElementsResponse;
        dataElementObjects = dataElementsResponse;
     });

     let tempTEIImportResponse = "";
     let tempEventImportResponse = "";

     let categoryCombos={};
     const getCategoryCombosObjects = await getCategoryCombosOptionsDetails();
     categoryCombos  = getCategoryCombosObjects;

      if (importFileType === 'lab') {
        // Data store check
        await getDataStoreNameSpace(orgUnitId).then((response) => {
          dataStoreNamespaceElements   =  response.data.elements;
          dataStoreNamespaceAttributes =  response.data.attributes;
          dataStoreNamespaceOptions    = response.data.options;
          dataStoreNameSpaceEventDate    = response.data.eventDate;
          /*
          let tempEventDate =  {
              id : response.data.eventDate[0],
                name: 'Event Date',
                mapCode: response.data.eventDate[0]
            }
          dsNameSpaceEventDateObject.push(tempEventDate);

           */
        }).catch(error => {
          return { success: null, error: "Could not find organisation unit"} }
        );
      }

      // dataStoreNamespaceElements   = this.state.dataStoreNamespaceElements;
      // dataStoreNamespaceAttributes = this.state.dataStoreNamespaceAttributes;
      // dataStoreNamespaceOptions    = this.state.dataStoreNamespaceOptions;
      const csvLength = csvData.length;

      // Registration number
      let registrationNo = "";
      requiredColumnsAttValue.map((attribute)=>{
        registrationNo = attribute.code
      });

      /*let dataElements = [];
      await getPrograms().then((response) => {
          if (typeof response !== 'undefined') {
            dataElements = response.data.programs[0].programStages[0].programStageDataElements
          }
      });

      let attributes = [];
      await getAttributes().then((response) => {
        if (typeof response !== 'undefined') {
            attributes: response.data.trackedEntityAttributes
        }
      });*/

      // AmrId generate
      let orgUnitCode;
      const getOrgUnitCode = await getOrgUnitDetail(orgUnitId);
      if (typeof getOrgUnitCode.data !== 'undefined') {
        orgUnitCode = getOrgUnitCode.data.code;
      } else {
        orgUnitCode = "";
      }
      const getAmrId = await amrIdSqlView(orgUnitId, orgUnitCode); 

      let trackedEntityInstance;
      let tempTEICaseNo;

  for (let i = 0; i < csvData.length; i++) {

            //eventDateValue = csvData.data[i]['Req Date'];
            await (async (currentCsvData, duplicateStatus, currentIndex) => {
                let eventsPayload = {};
                //let eventsPayload = [];
                let teiPayload    = {};
                //let teiPayload    = [];
                const csvObj      = Object.entries(currentCsvData);
                let len           = csvObj.length;
                //console.log(  " 1 - " + currentCsvData + " - " + currentCsvData );
            for (let j = 0; j < len; j++) {
              duplicateStatus = await (async ([columnName, columnValue], duplicate, index) => {
                
                let elementsFilterResult, attributesFilterResult, optionsFilterResult;
                let splittedValue  = columnName.split(","); // remove the C,2 or C,6 portion
                let csvColumnName  = splittedValue[0];
                if (importFileType === 'whonet') {
                  
                  if (csvColumnName === eventDate) {                    
                    eventDateValue = formatDate(columnValue.replace(/[=><_]/gi, ''));
                  }

                  // Elements filter from whonet code
                  elementsFilterResult = dataElements.find((element) => {
                    return element.dataElement.code === csvColumnName;
                  });

                  if (elementsFilterResult && Object.keys(elementsFilterResult).length > 0) {

    
                    let matchResult = columnValue.match(/\//g);
                    if (matchResult !== null && matchResult.length === 2) {
                      elementValue = formatDate(columnValue);
                    } else {
                      elementValue = columnValue.replace(/[=><_]/gi, '');
                    }
                    elementId = elementsFilterResult.dataElement.id;

                    eventsPayload[index] = {
                      "dataElement": elementId, 
                      "value": elementValue
                    }; 

                  }

                  // Attributes filter from whonet code
                  
                  attributesFilterResult = attributes.find(function (attribute) {
                    if (attribute.code != undefined) {
                      return attribute.code.toUpperCase() === csvColumnName.toUpperCase();
                    }
                    else {
                      attribute.code === csvColumnName;
                    }
                  });
    
                } else { // Lab
    
                  // Elements filter from data store
                  elementsFilterResult = dataStoreNamespaceElements.find((element) => {
                    return element.mapCode === csvColumnName;
                  });
                    //console.log(  " 1 - " + elementId + " - " + elementValue );

                  //let tempEventDataValue = {}
                  //if (elementValue !== "") {
                      if (elementsFilterResult && Object.keys(elementsFilterResult).length >= 1) {

                          //onsole.log( Object.keys(elementsFilterResult).length + " 2 - " + elementId + " - " + elementValue );
                          let matchResult = columnValue.match(/\//g);
                          if (matchResult !== null && matchResult.length === 2) {
                              elementValue = formatDate(columnValue);
                          } else {
                              elementValue = columnValue.replace(/[=><_]/gi, '');
                          }
                          elementId = elementsFilterResult.id;
                          //console.log(  " elementId - " + elementId + " elementValue - " + elementValue );
                          // Options checking for data elements
                          await getElementDetails(elementId).then((deResponse) => {

                              if (typeof deResponse !== 'undefined' && typeof deResponse.data.optionSet !== 'undefined') {

                                  let updatedElId = deResponse.data.id;
                                  let optionSetId = deResponse.data.optionSet;

                                  // Get option sets with all options
                                  //getOptionSetDetails(optionSetId.id).then((osResponse) => {
                                      //if (typeof osResponse !== 'undefined') {

                                          //let optionsDetail = osResponse.data.options;
                                          //for (let i = 0; i < optionsDetail.length; i++) {

                                              // let optionName = optionsDetail[i].name;
                                              // Options map filter from data store
                                              optionsFilterResult = dataStoreNamespaceOptions.filter(function (option) {
                                                  return option.mapCode === columnValue;
                                              });

                                              //console.log(Object.keys(optionsFilterResult).length  + " 4 - " + updatedElId + " - " + optionsFilterResult[0].name);
                                              if (optionsFilterResult && Object.keys(optionsFilterResult).length >= 1) {

                                                  // Set option value as option name in the data element
                                                  //tempEventDataValue.dataElement = updatedElId;
                                                  //tempEventDataValue.value = optionsFilterResult[0].name;
                                                  //eventsPayload.push(tempEventDataValue);

                                                  eventsPayload[index] = {
                                                      "dataElement": updatedElId,
                                                      "value": optionsFilterResult[0].code
                                                  };

                                              }
                                          //}
                                      //} // end of osResponse
                                  //});

                              } else { // if this element has no option set, the value will be the excel/csv cell value

                                  //tempEventDataValue.dataElement = elementId;
                                  //tempEventDataValue.value = elementValue;
                                  //eventsPayload.push(tempEventDataValue);

                                  eventsPayload[index] = {
                                      "dataElement": elementId,
                                      "value": elementValue
                                  };


                              }

                          }); // end await
                      }
                  //}
                  /*
                  if (csvColumnName === eventDate) {
                    eventDateValue = formatDate(columnValue.replace(/[=><_]/gi, ''));
                  }

                   */

                  if (csvColumnName === dataStoreNameSpaceEventDate[0].mapCode) {
                    eventDateValue = formatDate(columnValue.replace(/[=><_]/gi, ''));
                  }

                  // Attributes filter from data store
                  attributesFilterResult = dataStoreNamespaceAttributes.find(function (attribute) {
                    return attribute.mapCode === csvColumnName;
                  });
                }
                
                if (attributesFilterResult && Object.keys(attributesFilterResult).length >= 1) {

                  let attributeValue;
                  attributeId = attributesFilterResult.id;
                  let matchResult = columnValue.match(/\//g);
    
                  if (matchResult !== null && matchResult.length === 2) {
                    attributeValue = formatDate(columnValue);
                  }
                  
                  if (csvColumnName === registrationNo) {                
                    attributeValue = hash(columnValue.replace(/[=><_]/gi, ''));
                  } else {
                    attributeValue = columnValue.replace(/[=><_]/gi, '');
                  }
                  //let tempTeiAttributeValue = {}
                  if (importFileType === 'lab') {

                  // Options checking for attributes
                    await getAttributeDetails(attributeId).then((attributeResponse) => {
                    
                    if(typeof attributeResponse !== 'undefined' && typeof attributeResponse.data.optionSet !== 'undefined'){
    
                      let attributeId = attributeResponse.data.id;
                      let optionSetId = attributeResponse.data.optionSet;
                      
                    // Get option sets with all options
                      //getOptionSetDetails(optionSetId.id).then((osResponse) => {
                        //if(typeof osResponse!== 'undefined'){
    
                          //let optionsDetail = osResponse.data.options;
                          //for (let i = 0; i < optionsDetail.length; i++) {
    
                            // let optionName = optionsDetail[i].name;
                    // Options map filter from data store 
                            optionsFilterResult = dataStoreNamespaceOptions.filter(function(option) {
                              return option.mapCode === columnValue;
                            });
                            if(optionsFilterResult.length >= 1){
                      
                    // Set option value as option name in the attributes
                              //tempTeiAttributeValue.attribute = attributeId;
                              //tempTeiAttributeValue.value = optionsFilterResult[0].name;
                              //teiPayload.push(tempTeiAttributeValue);

                              teiPayload[index] = {
                                "attribute": attributeId,
                                "value": optionsFilterResult[0].code
                              };

                            }
                          //}
                        //} // end of osResponse
                      //});
                        
                    } else { // if this element has no option set, the value will be the excel/csv cell value
                        //tempTeiAttributeValue.attribute = attributeId;
                        //tempTeiAttributeValue.value = attributeValue;
                        //teiPayload.push(tempTeiAttributeValue);

                        teiPayload[index] = {
                        "attribute": attributeId,
                        "value": attributeValue
                      };
                    }  
                    
                    }); // end await
    
                  } else { // If attributes are whonet
                      //tempTeiAttributeValue.attribute = attributeId;
                      //tempTeiAttributeValue.value = attributeValue;
                      //teiPayload.push(tempTeiAttributeValue);

                    teiPayload[index] = {
                        "attribute": attributeId,
                        "value": attributeValue
                      };
                  }                
                  
                  // Duplicate Patient ID checking
                  if (attributesFilterResult.code === 'PATIENT_ID') {
                  //if (csvColumnName === registrationNo) {
                    //const result = await isDuplicate(hash(columnValue.replace(/[=><_]/gi, '')), orgUnitId, attributeId);
                    const result = await isDuplicate(columnValue, orgUnitId, attributeId);
                    tempTEICaseNo = columnValue;
                    duplicate[index] = result;
                    if (typeof result !== 'undefined' && result.result >= 1) {
                      duplicateRecordStatus = true;
                      trackedEntityInstance = result.teiId;
                    } else {
                      duplicateRecordStatus = false;
                      trackedEntityInstance = null; 
                    }
                  }
                }
                return duplicate;
              })(csvObj[j], {}, j);
              
            }
    
            /**
            * Generates AMR Id by the combination of OU code and a random integer value.
            * AmrID is unique for all lab for all record
            * If the newly generated amrid is matched with existing one the new one will be re-genreated and return for this record
            * @eventsPayloadUpdated returns updated json payload with dynamically generated amrid
            */
            
            let amrIdPayload = {
              "dataElement": config.amrIdDataElement,
              "value": getAmrId
            };
            //let eventsPayloadUpdated = Object.assign(eventsPayload, amrIdPayload);
            /*
            let eventsPayloadUpdated =[eventsPayload];
            eventsPayloadUpdated.push(amrIdPayload);
            */

            eventsPayload[parseInt(eventsPayload.length) + 1] = {
                "dataElement": config.amrIdDataElement,
                "value": getAmrId
            };

            //eventsPayload.push(amrIdPayload);
            let eventsPayloadUpdated = eventsPayload;
            let eventPayloadForPushToAggregatedDataValue = eventsPayloadUpdated;



            /**
            * @{Object.keys(teiPayload)} checkes the json payload length
            * @{teiPayloadString} returns json payload with non-duplicate data to create new entity
            */

            if (!duplicateRecordStatus) {
              if (Object.keys(teiPayload).length || Object.keys(eventsPayloadUpdated).length) {
                //teiPayloadString = {
                  teiPayloadString[currentIndex] = {
                  "trackedEntityType": config.trackedEntityType,
                  "orgUnit": orgUnitId,
                  "attributes": Object.values(teiPayload),
                  "enrollments": [{
                    "orgUnit": orgUnitId,
                    "program": config.programId,
                    "enrollmentDate": eventDateValue,
                    "incidentDate": eventDateValue,
                    "events": [{
                      "program": config.programId,
                      "orgUnit": orgUnitId,
                      "eventDate": eventDateValue,
                      "status": "ACTIVE",
                      "programStage": config.programStage,
                      "dataValues": Object.values(eventsPayloadUpdated)
                      //"dataValues": eventsPayloadUpdated
                    }]
                  }]
                };
               /*
               let tempTEIPayLoadString = {
                   "trackedEntityType": config.trackedEntityType,
                   "orgUnit": orgUnitId,
                   "attributes": Object.values(teiPayload),
                   "enrollments": [{
                       "orgUnit": orgUnitId,
                       "program": config.programId,
                       "enrollmentDate": eventDateValue,
                       "incidentDate": eventDateValue,
                       "events": [{
                           "program": config.programId,
                           "orgUnit": orgUnitId,
                           "eventDate": eventDateValue,
                           "status": "ACTIVE",
                           "programStage": config.programStage,
                           "dataValues": Object.values(eventsPayloadUpdated)
                           //"dataValues": eventsPayloadUpdated
                       }]
                   }]
               }*/
               let tempTEIPayLoadString = {};
                  tempTEIPayLoadString.trackedEntityType = config.trackedEntityType;
                  tempTEIPayLoadString.orgUnit = orgUnitId;
                  tempTEIPayLoadString.attributes = Object.values(teiPayload);
                  tempTEIPayLoadString.enrollments = [{
                      "orgUnit": orgUnitId,
                      "program": config.programId,
                      "enrollmentDate": eventDateValue,
                      "incidentDate": eventDateValue,
                      "events": [{
                          "program": config.programId,
                          "orgUnit": orgUnitId,
                          "eventDate": eventDateValue,
                          "status": "ACTIVE",
                          "programStage": config.programStage,
                          "dataValues": Object.values(eventsPayloadUpdated)
                          //"dataValues": eventsPayloadUpdated
                      }]
                  }]


              let tempTeiResponseData   = await createTrackedEntityInstance(JSON.stringify(tempTEIPayLoadString));


              /*
               let postTEIsEnrollEvent = [];
               postTEIsEnrollEvent.push( tempTEIPayLoadString );
                if( postTEIsEnrollEvent.length > 0 ){
                  let postBulkTEIEnrollEvent = {};
                  postBulkTEIEnrollEvent.trackedEntityInstances = postTEIsEnrollEvent;
                  console.log(" final events : " + JSON.stringify(postBulkTEIEnrollEvent).length );
                  let tempTeiResponseData   = await createTrackedEntityInstance(JSON.stringify(postBulkTEIEnrollEvent));
                  console.log("New TEI inserted", tempTeiResponseData.data.response);
                }
               */

               //let postTEIEnrollEvent = {};
               //postTEIEnrollEvent.trackedEntityInstances = tempTEIPayLoadString;
                  if(tempTeiResponseData.status === 'ERROR' && tempTeiResponseData.ignored > 0){
                      const res = _this.state.res;
                      res.push({
                          teiCase: tempTEICaseNo,
                          status: tempTeiResponseData.importSummaries[0],
                          message: "Error in import TEI and Event"
                      })

                      _this.setState({
                          res: res
                      })
                  }
                  else if (tempTeiResponseData.data.httpStatus === "OK") {

                      tempTEIImportResponse = tempTeiResponseData.data.response;
                      //console.log("New TEI inserted", tempTeiResponseData.data.response);

                      const res = _this.state.res;
                      res.push({
                          teiCase: tempTEICaseNo,
                          status: tempTeiResponseData.data.response.importSummaries[0].status,
                          message: "TEI Not  found new TEI and event added"
                      })

                      _this.setState({
                         res: res
                      })
                      console.log(" TEI Not  found new TEI and event added ", tempTeiResponseData.data.response);
                      // for aggregation
                      let organismDataTEI = "";
                      let departmentDataTEI = "";
                      let locationDataTEI = "";
                      let sampleTypeDataTEI = "";
                      let purposeOfSampleDataTEI = "";
                      let antibioticCategoryOptionComboUIDsTEI = [];

                      let defaultDataSet = config.allOrganismsSampleWiseDataSet;
                      let antibioticWiseDataSet = config.allOrganismsAntibioticWiseDataSet;
                      let coDefault = categoryCombos[config.defaultCC_code].categoryOptionCombos[config.defaultCC_code];
                      let period = eventDateValue.substring(0, 7).replace('-', "");
                      let cc = categoryCombos[config.sampleLocationDepartment_Code].id;
                      Object.values(eventsPayloadUpdated).forEach( event => {
                          if( event.dataElement === 'KVYg3tnmNMU' ){
                              departmentDataTEI = event.value;
                          }
                          if( event.dataElement === 'JtPSS6ksvz0' ){
                              locationDataTEI = event.value;
                          }
                          if( event.dataElement === 'sCu0ugyEhus' ){
                              sampleTypeDataTEI = event.value;
                          }
                          if( event.dataElement === 'l4kqMRq38bm' ){
                              purposeOfSampleDataTEI = event.value;
                          }
                          if( event.dataElement === 'l9NuW9KD5mU' ){
                              organismDataTEI = event.value;
                          }
                          // collect coc for antibiotic test result value
                          if( event.value === 'Resistant' || event.value === 'Intermediate' || event.value === 'Susceptible'){
                              let tempArray = [dataElementObjects[event.dataElement].code, event.value]
                              tempArray = tempArray.sort();
                              let categoryOptionCombo = tempArray.join("");
                              categoryOptionCombo = categoryCombos[config.antibioticCategoryComboCode].categoryOptionCombos[categoryOptionCombo]
                              antibioticCategoryOptionComboUIDsTEI.push(categoryOptionCombo)
                          }

                      })

                      if( (locationDataTEI && sampleTypeDataTEI && departmentDataTEI && purposeOfSampleDataTEI && organismDataTEI ) ){
                          let tempCP = categoryCombos[config.sampleLocationDepartment_Code].categoryOptions[locationDataTEI];
                          tempCP = tempCP + ";" + categoryCombos[config.sampleLocationDepartment_Code].categoryOptions[sampleTypeDataTEI];
                          tempCP = tempCP + ";" + categoryCombos[config.sampleLocationDepartment_Code].categoryOptions[departmentDataTEI];
                          tempCP = tempCP + ";" + categoryCombos[config.sampleLocationDepartment_Code].categoryOptions[purposeOfSampleDataTEI];
                          let tempDe = dataElementObjects[organismDataTEI].id;
                          //let deAntibioticWise = dataElementObjects[organismData + '_AW'].id;
                          let defaultResponseTEI = await getAggregatedDataValue( period,defaultDataSet,tempDe,orgUnitId,cc,tempCP,coDefault, 'COMPLETE');
                          let defaultValue = 0;

                          if (defaultResponseTEI.response) { //this means that there have been a successfull fetching of data
                              defaultValue = defaultResponseTEI.value
                          }
                          else {
                              return {
                                  response: false,
                                  message: defaultResponseTEI.message
                              }
                          }

                          await postAggregatedDataValue(  period, defaultDataSet, tempDe, orgUnitId, cc, tempCP, coDefault, defaultValue ).then((aggregatedDataValuePostResponse) => {
                              console.log( aggregatedDataValuePostResponse.data.message);
                          });

                          // push antibiotic test result value to aggregated DataValue
                          if( organismDataTEI !== 'STERILE'){
                              let deAntibioticWise = dataElementObjects[organismDataTEI + '_AW'].id;
                              for (let index in antibioticCategoryOptionComboUIDsTEI) {
                                  let categoryOptionCombo = antibioticCategoryOptionComboUIDsTEI[index];
                                  let antibioticResultResponse = await getAggregatedDataValue( period,antibioticWiseDataSet,deAntibioticWise,orgUnitId,cc,tempCP,categoryOptionCombo, 'COMPLETE');

                                  let antibioticValue = 0;
                                  if (antibioticResultResponse.response) { //this means that there have been a successfull fetching of data
                                      antibioticValue = antibioticResultResponse.value
                                  }
                                  else {
                                      return {
                                          response: false,
                                          message: antibioticResultResponse.message
                                      }
                                  }
                                  await postAggregatedDataValue(  period, antibioticWiseDataSet, deAntibioticWise, orgUnitId, cc, tempCP, categoryOptionCombo, antibioticValue ).then((aggregatedAntibioticDataValuePostResponse) => {
                                      console.log( aggregatedAntibioticDataValuePostResponse.data.message);
                                  });
                              }
                          }
                      }
                  }
                  else if( tempTeiResponseData.data.status === "ERROR" ){
                      const res = _this.state.res;
                      res.push({
                          teiCase: tempTEICaseNo,
                          status: tempTeiResponseData.data.response.importSummaries[0].status,
                          message: "Error in import TEI and Event"
                      })

                      _this.setState({
                          res: res
                      })
                  }

              }
            }
            
            /**
            * @{duplicateStatus} checkes the existing enrollment 
            * @{teiPayloadString} returns json payload with duplicate data to update exinsting enrollment
            */
            if (duplicateRecordStatus) {

              // Get event id to update duplicate

              //const eventId = await getEventId(config.programId, orgUnitId,trackedEntityInstance);
              const eventResponse = await getEventId(config.programId, orgUnitId,trackedEntityInstance);

              /*teiPayloadString[currentIndex] = {
                "trackedEntityInstance": this.state.trackedEntityInstance,
                "trackedEntityType": config.trackedEntityType,
                "orgUnit": orgUnitId,
                "attributes": Object.values(teiPayload),
                "enrollments": [{
                  "orgUnit": orgUnitId,
                  "program": config.programId,
                  "enrollmentDate": eventDate,
                  "incidentDate": eventDate,
                  "events": [{
                    "program": config.programId,
                    "orgUnit": orgUnitId,
                    "eventDate": eventDate,
                    "status": "ACTIVE",
                    "programStage": config.programStage,
                    "dataValues": Object.values(eventsPayloadUpdated)
                  }]
                }]
              };*/
              //eventPayloadString = {
              /*
              eventPayloadString[currentIndex] = {
                
                  "program": config.programId,
                  "orgUnit": orgUnitId,
                  "event": eventId,
                  "eventDate": eventDateValue,
                  "status": "ACTIVE",
                  "programStage": config.programStage,
                  "dataValues": Object.values(eventsPayloadUpdated)
                  //"dataValues": eventsPayloadUpdated
              };
              */

              eventPayloadString[currentIndex] = {
                  "program": config.programId,
                   "orgUnit": orgUnitId,
                   "enrollment": eventResponse.enrollment,
                   "trackedEntityInstance": trackedEntityInstance,
                   "eventDate": eventDateValue,
                   "status": "ACTIVE",
                   "programStage": config.programStage,
                   "dataValues": Object.values(eventsPayloadUpdated)
                   //"dataValues": eventsPayloadUpdated
              };

              let tempEventPayload = {
                  "program": config.programId,
                  "orgUnit": orgUnitId,
                  "enrollment": eventResponse.enrollment,
                  "trackedEntityInstance": trackedEntityInstance,
                  "eventDate": eventDateValue,
                  "status": "ACTIVE",
                  "programStage": config.programStage,
                  "dataValues": Object.values(eventsPayloadUpdated)
              }

                let tempEventResponseData = await updateEvent(JSON.stringify(tempEventPayload));
                if (tempEventResponseData.status === 'ERROR' && tempEventResponseData.ignored > 0) {
                    const res = _this.state.res;
                    res.push({
                        teiCase: tempTEICaseNo,
                        status: tempEventResponseData.importSummaries[0].description,
                        message: "Error in import Event"
                    })

                    _this.setState({
                        res: res
                    })
                }
                else if (tempEventResponseData.data.httpStatus === "OK") {
                    tempEventImportResponse = tempEventResponseData.data.response;
                    const res = _this.state.res;
                    res.push({
                        teiCase: tempTEICaseNo,
                        status: tempEventResponseData.data.response.importSummaries[0].status,
                        message: "TEI found new event added"
                    })

                    _this.setState({
                        res: res
                    })
                    console.log(" TEI found new event added ", tempEventResponseData.data.response);
                    // for aggregation
                    let organismData = "";
                    let departmentData = "";
                    let locationData = "";
                    let sampleTypeData = "";
                    let purposeOfSampleData = "";
                    let antibioticCategoryOptionComboUIDs = [];

                    let defaultDataSet = config.allOrganismsSampleWiseDataSet;
                    let antibioticWiseDataSet = config.allOrganismsAntibioticWiseDataSet;
                    let coDefault = categoryCombos[config.defaultCC_code].categoryOptionCombos[config.defaultCC_code];
                    let period = eventDateValue.substring(0, 7).replace('-', "");
                    let cc = categoryCombos[config.sampleLocationDepartment_Code].id;
                    Object.values(eventsPayloadUpdated).forEach( event => {
                        if( event.dataElement === 'KVYg3tnmNMU' ){
                            departmentData = event.value;
                        }
                        if( event.dataElement === 'JtPSS6ksvz0' ){
                            locationData = event.value;
                        }
                        if( event.dataElement === 'sCu0ugyEhus' ){
                            sampleTypeData = event.value;
                        }
                        if( event.dataElement === 'l4kqMRq38bm' ){
                            purposeOfSampleData = event.value;
                        }
                        if( event.dataElement === 'l9NuW9KD5mU' ){
                            organismData = event.value;
                        }
                        // collect coc for antibiotic test result value
                        if( event.value === 'Resistant' || event.value === 'Intermediate' || event.value === 'Susceptible'){
                            let tempArray = [dataElementObjects[event.dataElement].code, event.value]
                            tempArray = tempArray.sort();
                            let categoryOptionCombo = tempArray.join("");
                            categoryOptionCombo = categoryCombos[config.antibioticCategoryComboCode].categoryOptionCombos[categoryOptionCombo]
                            antibioticCategoryOptionComboUIDs.push(categoryOptionCombo)
                        }

                    })

                    // push sample data value to aggregated DataValue

                    //let deAntibioticWise = dataElementObjects[organismData + '_AW'].id;
                    if( (locationData && organismData && sampleTypeData && departmentData && purposeOfSampleData ) ){

                        let cp = categoryCombos[config.sampleLocationDepartment_Code].categoryOptions[locationData];
                        cp = cp + ";" + categoryCombos[config.sampleLocationDepartment_Code].categoryOptions[sampleTypeData];
                        cp = cp + ";" + categoryCombos[config.sampleLocationDepartment_Code].categoryOptions[departmentData];
                        cp = cp + ";" + categoryCombos[config.sampleLocationDepartment_Code].categoryOptions[purposeOfSampleData];

                        let de = dataElementObjects[organismData].id;

                        let defaultResponse = await getAggregatedDataValue( period,defaultDataSet,de,orgUnitId,cc,cp,coDefault, 'COMPLETE');
                        let defaultValue = 0;

                        if (defaultResponse.response) { //this means that there have been a successfull fetching of data
                            defaultValue = defaultResponse.value
                        }
                        else {
                            return {
                                response: false,
                                message: defaultResponse.message
                            }
                        }

                        await postAggregatedDataValue(  period, defaultDataSet, de, orgUnitId, cc, cp, coDefault, defaultValue ).then((aggregatedDataValuePostResponse) => {
                            console.log( aggregatedDataValuePostResponse.data.message);
                        });

                        // push antibiotic test result value to aggregated DataValue
                        if( organismData !== 'STERILE'){
                            let deAntibioticWise = dataElementObjects[organismData + '_AW'].id;
                            for (let index in antibioticCategoryOptionComboUIDs) {
                                let categoryOptionCombo = antibioticCategoryOptionComboUIDs[index];
                                let antibioticResultResponse = await getAggregatedDataValue( period,antibioticWiseDataSet,deAntibioticWise,orgUnitId,cc,cp,categoryOptionCombo, 'COMPLETE');

                                let antibioticValue = 0;
                                if (antibioticResultResponse.response) { //this means that there have been a successfull fetching of data
                                    antibioticValue = antibioticResultResponse.value
                                }
                                else {
                                    return {
                                        response: false,
                                        message: antibioticResultResponse.message
                                    }
                                }
                                await postAggregatedDataValue(  period, antibioticWiseDataSet, deAntibioticWise, orgUnitId, cc, cp, categoryOptionCombo, antibioticValue ).then((aggregatedAntibioticDataValuePostResponse) => {
                                    console.log( aggregatedAntibioticDataValuePostResponse.data.message);
                                });
                            }
                        }
                    }

                }
                else if( tempEventResponseData.data.status === "ERROR" ){
                    const res = _this.state.res;
                    res.push({
                        teiCase: tempTEICaseNo,
                        status: tempEventResponseData.data.response.importSummaries[0].status,
                        message: "Error in import Event"
                    })

                    _this.setState({
                        res: res
                    })
                }
                //console.log(" TEI found new event added ", tempEventResponseData.data.response);

            }

            //return duplicateStatus;

            })(csvData[i], {}, i);

        }
    
        /**
        * @{teiPayloadString}-contains the new and duplicate payload
        * @{trackedEntityJson} - returns the final json payload 
        */
        /*
        if ((typeof teiPayloadString !== 'undefined' || teiPayloadString !== null)) {

          trackedEntityJson = '{"trackedEntityInstances": ' + JSON.stringify(Object.entries(teiPayloadString).map(payload => payload[1])) + '}';
          //let aggregatedDataValueResponse = await pushTrackerDataValueToAggregateDataValue(trackedEntityJson);
          console.log("Final teiPayloadString payload: ", trackedEntityJson);
        }

        if (typeof teiPayloadString !== 'undefined') {
            try {
              let finalEventUpdatePayload = '{"events": ' +JSON.stringify(Object.entries(eventPayloadString).map(payload => payload[1]))+ '}';

              console.log("Tracker Payload to send mapped data", trackedEntityJson);
              console.log("EVENTS Payload to send mapped data",finalEventUpdatePayload)
              let teiResponseData   = await createTrackedEntity(trackedEntityJson);
              let eventResponseData = await updateEvent(finalEventUpdatePayload);

              if (typeof teiResponseData.data !== 'undefined' && eventResponseData.data !== 'undefined') {  
                if (eventResponseData.status === 'ERROR' && eventResponseData.ignored > 0) {
                  return { 
                    success: false, 
                    error: eventResponseData.importSummaries[0].conflicts[0].value,
                    teiResponse: teiResponseData.data.response,
                    eventResponse: eventResponseData.importSummaries[0],
                  }

                 }
                  else if (teiResponseData.data.httpStatus === "OK") {


                    return {
                        success: "Your data was successfully uploaded", 
                        error: false, 
                        teiResponse: teiResponseData.data.response,
                        eventResponse: eventResponseData.data.response,

                      }


                } 
                else if (teiResponseData.status === "500") {
                  let errormsj = teiResponseData.data.message;

                      return { 
                        success:errormsj, 
                        error: true, 
                        teiResponse: teiResponseData.data,
                        eventResponse: eventResponseData.data,

                      } 
                  }
                  else {
                      return { success: false, error: "Unable to import Whonet file"} 
                  }
              } else if(teiResponseData.status === 'ERROR' && teiResponseData.ignored > 0){
                  
                  return { 
                    success: false, 
                    error: "Unable to import Whonet file. Conflict in updating!",
                    teiResponse: teiResponseData.importSummaries[0],
                    eventResponse: eventResponseData.data.response,
                  }
              } else { // Axios return 409 or ERROR
                return { success: false, error: "Unable to import Whonet file"}                     
              }
            } catch (err) {
              console.log(err)
          }
        } 
        else {
            return { success: false, error: "The selected file is empty"}             
        }
*/
        /*
        let pushTrackerDataValueToAggregateDataValue = async (trackedEntityInstances) => {
        try {
            // for aggregation
            let organismData = "";
            let departmentData = "";
            let locationData = "";
            let sampleTypeData = "";
            let purposeOfSampleData = "";
            let antibioticCategoryOptionComboUIDs = [];

            let defaultDataSet = config.allOrganismsSampleWiseDataSet;
            let antibioticWiseDataSet = config.allOrganismsAntibioticWiseDataSet;
            let coDefault = categoryCombos[config.defaultCC_code].categoryOptionCombos[config.defaultCC_code];

            let cc = categoryCombos[config.sampleLocationDepartment_Code].id;

            //trackedEntityInstances.forEach( trackedEntityInstance => {
            for (const trackedEntityInstance of trackedEntityInstances) {
                //trackedEntityInstance.enrollments.forEach( enrollment => {
                for (const enrollment of trackedEntityInstance.enrollments) {
                    //enrollment.events.forEach( event => {
                    for (const event of enrollment.events) {
                        let period = event.eventDate.substring(0, 7).replace('-', "");

                        //event.dataValues.forEach( dataValue => {
                        for (const dataValue of event.dataValues) {
                            if( dataValue.dataElement === 'KVYg3tnmNMU' ){
                                departmentData = dataValue.value;
                            }
                            if( dataValue.dataElement === 'JtPSS6ksvz0' ){
                                locationData = dataValue.value;
                            }
                            if( dataValue.dataElement === 'sCu0ugyEhus' ){
                                sampleTypeData = dataValue.value;
                            }
                            if( dataValue.dataElement === 'l4kqMRq38bm' ){
                                purposeOfSampleData = dataValue.value;
                            }
                            if( dataValue.dataElement === 'l9NuW9KD5mU' ){
                                organismData = dataValue.value;
                            }
                            // collect coc for antibiotic test result value
                            if( dataValue.value === 'Resistant' || dataValue.value === 'Intermediate' || dataValue.value === 'Susceptible'){
                                let tempArray = [dataElementObjects[dataValue.dataElement].code, dataValue.value]
                                tempArray = tempArray.sort();
                                let categoryOptionCombo = tempArray.join("");
                                categoryOptionCombo = categoryCombos[config.antibioticCategoryComboCode].categoryOptionCombos[categoryOptionCombo]
                                antibioticCategoryOptionComboUIDs.push(categoryOptionCombo)
                            }
                        }//);

                        // push sample data value to aggregated DataValue
                        let de = dataElementObjects[organismData].id;
                        //let deAntibioticWise = dataElementObjects[organismData + '_AW'].id;

                        let cp = categoryCombos[config.sampleLocationDepartment_Code].categoryOptions[locationData];
                        cp = cp + ";" + categoryCombos[config.sampleLocationDepartment_Code].categoryOptions[sampleTypeData];
                        cp = cp + ";" + categoryCombos[config.sampleLocationDepartment_Code].categoryOptions[departmentData];
                        cp = cp + ";" + categoryCombos[config.sampleLocationDepartment_Code].categoryOptions[purposeOfSampleData];

                        let defaultResponse = await getAggregatedDataValue( period,defaultDataSet,de,orgUnitId,cc,cp,coDefault, 'COMPLETE');
                        let defaultValue = 0;

                        if (defaultResponse.response) { //this means that there have been a successfull fetching of data
                            defaultValue = defaultResponse.value
                        }
                        else {
                            return {
                                response: false,
                                message: defaultResponse.message
                            }
                        }

                        await postAggregatedDataValue(  period, defaultDataSet, de, orgUnitId, cc, cp, coDefault, defaultValue ).then((aggregatedDataValuePostResponse) => {
                            console.log( aggregatedDataValuePostResponse.data.message);
                        });

                        // push antibiotic test result value to aggregated DataValue
                        if( organismData !== 'STERILE'){
                            let deAntibioticWise = dataElementObjects[organismData + '_AW'].id;
                            for (let index in antibioticCategoryOptionComboUIDs) {
                                let categoryOptionCombo = antibioticCategoryOptionComboUIDs[index];
                                let antibioticResultResponse = await getAggregatedDataValue( period,antibioticWiseDataSet,deAntibioticWise,orgUnitId,cc,cp,categoryOptionCombo, 'COMPLETE');

                                let antibioticValue = 0;
                                if (antibioticResultResponse.response) { //this means that there have been a successfull fetching of data
                                    antibioticValue = antibioticResultResponse.value
                                }
                                else {
                                    return {
                                        response: false,
                                        message: antibioticResultResponse.message
                                    }
                                }
                                await postAggregatedDataValue(  period, antibioticWiseDataSet, deAntibioticWise, orgUnitId, cc, cp, categoryOptionCombo, antibioticValue ).then((aggregatedAntibioticDataValuePostResponse) => {
                                    console.log( aggregatedAntibioticDataValuePostResponse.data.message);
                                });
                            }
                        }

                    }//);
                }//);

            }//);
        }catch (err) {
            console.log(err)
        }

        // aggregation
        // department  == DMG - KVYg3tnmNMU PAED HEM-LYMPH
        // Organism == l9NuW9KD5mU -- No growth
        // location -- JtPSS6ksvz0 -- OP
        // Sample type -- sCu0ugyEhus -- BLOOD
        // purposeOfSampleData - l4kqMRq38bm -- Diagnostic

        // end
    }
*/

    return {
        success: "Your data was successfully uploaded",
        error: false,
        teiResponse: tempTEIImportResponse,
        eventResponse: tempEventImportResponse

        /*teiResponseString: JSON.stringify(teiResponseData.data.response),
        eventResponseString: JSON.stringify(eventResponseData.data.response),*/
    }

}

