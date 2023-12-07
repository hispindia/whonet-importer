import axios from 'axios';
import * as config  from '../../config/Config';
import { get } from './CRUD';
import { request } from './Request';
import { post } from './CRUD';

/**
* Check the selected org unit is assigned under this program or not
* If does not assign then to stop the import
*/
export const checkOrgUnitInProgram = async (orgUnitId) => {
    return await get(request('api/programs/'+config.programId+'.json?', {
        order: 'created:asc',
        fields: 'id,name,organisationUnits',
        filters: `organisationUnits.id:eq:${orgUnitId}`,
        //options: [`trackedEntityInstance=${entity}`],
    }))
  	.then(function (responseObj) {
  	
  		if(Object.entries(responseObj.data).length !== 0) {
  			return responseObj.data.organisationUnits.filter(function(orgUnit) {
          return orgUnit.id === orgUnitId;  
      	});	
  		}  				
  	})
  	.catch(function (error) {
  		console.log(error.response);
  	});   
};
/**
* Gets duplicate record
* @param {String} input - hashed patient id
* @returns {Object} duplicate values
*/
export const getAlltrackedEntityInstances = (orgUnitId) => {

    return get('api/trackedEntityInstances.json?program='+config.programId+'&ou='+orgUnitId+'&fields: trackedEntityInstance,attributes[attribute,value]&paging=false').then(function (response) {
         return response.data.trackedEntityInstances;           
      }).catch(function (error) {
        if(typeof error.response !== 'undefined'){
          console.log(error.response);
        }
      }); 
};

export const isDuplicateTei = (trackedEntityInstances, input) => {
 
      let duplicateValue = trackedEntityInstances[0].attributes;
      let teiId = trackedEntityInstances[0].trackedEntityInstance;
      console.log({duplicateValue});
      let matchResult = duplicateValue.filter(function(data){
          return data.value === input;
      });
      return {"teiId": teiId, "result": matchResult.length};
};


export const isDuplicate = (input, orgUnitId, attributeId) => {


	let duplicateValue=[];
	let matchResult;
    if(typeof attributeId !== 'undefined' && typeof input !== 'undefined'){
      return get(request('api/trackedEntityInstances.json?program='+config.programId+'&ou='+orgUnitId, {
          order: 'created:asc',
          fields: 'trackedEntityInstance,attributes[attribute,value]',
          filters: `${attributeId}:eq:${input}`,
      }))
      .then(function (response) {
          if(typeof response.data.trackedEntityInstances !== 'undefined'){
              duplicateValue = response.data.trackedEntityInstances[0].attributes;
              let teiId = response.data.trackedEntityInstances[0].trackedEntityInstance;
              matchResult = duplicateValue.filter(function(data){
                  return data.value === input;
              });
              // console.log({"teiId": teiId, "result": matchResult.length});
              return {"teiId": teiId, "result": matchResult.length};
          }           
      }).catch(function (error) {
        if(typeof error.response !== 'undefined'){
          console.log(error.response);
        }
      });
    }  
};
/**
* Create trackedEntityInstances
* @returns {Object} create response
*/
export const createTrackedEntity = async (trackedEntityJson) => {

    return axios(config.baseUrl+'api/trackedEntityInstances?strategy=CREATE_AND_UPDATE', {
        method: 'POST',
        headers: config.fetchOptions.headers,
        data: trackedEntityJson,
        withCredentials: true,        
    }).then(response => {
       return response;
     })
      .catch(error => {
       console.log("Error Data",error.response.data.message)
       return error.response;
     }); 

};

export const createTrackedEntityInstance = async (trackedEntityJson) => {

    return axios(config.baseUrl+'api/trackedEntityInstances', {
        method: 'POST',
        headers: config.fetchOptions.headers,
        data: trackedEntityJson,
        withCredentials: true,
    }).then(response => {
        return response;
    })
        .catch(error => {
            console.log("Error Data",error.response.data.message)
            return error.response;
        });

};



/**
* Get event id by TEI id to update duplicate record
* @param {String} programId - program id
* @param {String} orgUnitId - org unit id
* @param {String} teiId - trackedEntityInstance id
* @returns {Object} event id
*/

export const getEventId = (programId, orgUnitId, teiId) => {

  return get('api/events.json?program='+programId+'&ou='+orgUnitId+'&fields=event,enrollment,trackedEntityInstance&trackedEntityInstance='+teiId)
      .then(function (response) { 
      //return response.data.events[0].event;
      return response.data.events[0];
    })
    .catch(function (error) {
      console.log(error);
    });

};
/**
* Update event
* @returns {Object} update response
*/
export const updateEvent = async (eventPayload) => {

    return axios(config.baseUrl+'api/events/', {
        method: 'POST',
        headers: config.fetchOptions.headers,
        data: eventPayload,
        withCredentials: true,        
    }).then(response => {
       return response;
     })
     .catch(error => {
       return error.response.data.response;
     }); 

};

export const getMe = async () => {
  return await get('api/me.json?fields=organisationUnits[id,name,level,parent,children::isNotEmpty]');
};

/**
* @getPrograms() returns all the programs with programStageDataElements
*/
export const getPrograms = async () => {	
    return await get('api/programs.json?filter=id:eq:'+config.programId+'&fields=id,name,programStages[id,name,programStageDataElements[dataElement[id,name,code]]]&paging=false')
    	.then(function (response) {    		
			return response;
		})
		.catch(function (error) {
			console.log(error);
		});
};

/**
* @getAttributes() returns all the TEI attributes with attributes values
*/
export const getAttributes = async () => {
    return await get('api/trackedEntityAttributes.json?fields=id,name,code,attributeValues[value,attribute]')
    	.then(function (response) {    		
			return response;
		})
		.catch(function (error) {
			console.log(error);
		});
};

/**
* @returns list of options from option groups
*/
export const getOptionsInOptionGroups = async () => {
    return await get('api/optionGroups/'+config.optionGroupsId+'.json?fields=id,name,code,options[:id,name,code,attributeValues]')
    	.then(function (response) {    		
			return response;
		})
		.catch(function (error) {
			console.log(error);
		});
};

/**
* @getOptionSets return all option sets
*/
export const getOptionSets = async () => { 
 
    return await get('api/optionSets?filter=id:neq:hRHti3LG2H9&fields=id,name,code,options[:id,name,code]&paging=false')
      .then(function (response) {       
      return response;
    })
    .catch(function (error) {
      console.log(error);
    });
};

/**
* @retunrs single element detail
*/
export const getElementDetails = async (elementId) => {
    return await get('api/dataElements/'+elementId)
    	.then(function (response) {    		
			return response;
		})
		.catch(function (error) {
			console.log("error: ",error);
		});
};
/**
* @retunrs multiple element detail
*/
export const getMultipleElements = async (elementArray) => {
    return await get('api/dataElements.json?filter=id:in:['+elementArray+']&fields=name,code')
      .then(function (response) {       
      return response;
    })
    .catch(function (error) {
      console.log("error: ",error);
    });
};

export const getDataElementsDetails = async () => {
    const dataElements = {}
    //This is to hold the data elements with their codes and have the whole DE object referenced.
    const dataElementObjects = {}
    //this is used to distinguish which data element contains which attribute value.
    dataElementObjects.attributeGroups={}

    return await get('api/dataElements.json?paging=false&fields=id,code,displayName,formName,attributeValues[value,attribute[id,name]]')
        .then(function (response) {

            response.data.dataElements.forEach(
                de => {
                    dataElements[de.id] = de.formName ? de.formName : de.displayName

                    //remap the attributeOptionValue with code
                    de.attributeValues.forEach(attributeValue=>{
                        de[attributeValue.attribute.code]=attributeValue.value
                        if(!dataElementObjects.attributeGroups[attributeValue.value]){
                            dataElementObjects.attributeGroups[attributeValue.value] =[]
                        }
                        dataElementObjects.attributeGroups[attributeValue.value].push(de.id)
                    })

                    dataElementObjects[de.id]=de
                    dataElementObjects[de.code]=de
                }
            )
            //return response;
            return dataElementObjects;
        })
        .catch(function (error) {
            console.log("error: ",error);
        });
};


export const getCategoryCombosOptionsDetails = async () => {
    const categoryCombos={}

    return await get('api/categoryCombos.json?paging=false&fields=id,displayName,code,categoryOptionCombos[id,displayName,code,categoryOptions[id,code,displayName]]')
        .then(function (response) {

            response.data.categoryCombos.forEach(categoryCombo=>{
                categoryCombo.categoryOptions={}
                categoryCombo.categoryOptionCombos.forEach(categoryOptionCombo=>{
                    //use the code of the options as the identifier for the categoryOptionCode
                    let categoryOptionCodes = []
                    categoryOptionCombo.categoryOptions.forEach(categoryOption => {

                        categoryOptionCodes.push(categoryOption.code)
                        //This adds the categoryOptions as a child of the catCombo it is usefull for DS attributes.
                        if (!categoryCombo.categoryOptions[categoryOption.code]) {
                            categoryCombo.categoryOptions[categoryOption.code]=categoryOption.id
                        }
                    })
                    //sort Ids for handling more than two categoyOptions
                    categoryOptionCodes = categoryOptionCodes.sort();
                    let identifierWithOptionCodes = categoryOptionCodes.join("")
                    categoryCombo.categoryOptionCombos[identifierWithOptionCodes]=categoryOptionCombo.id
                })
                categoryCombos[categoryCombo.code]=categoryCombo
            })
            //return response;
            return categoryCombos;
        })
        .catch(function (error) {
            console.log("error: ",error);
        });
};

/*
export const postAggregatedDataValue = async (aggregatedDataValueJson) => {

    return axios(config.baseUrl+'api/dataValues', {
        method: 'POST',
        headers: config.fetchOptions.headers,
        data: JSON.stringify(aggregatedDataValueJson),
        withCredentials: true,
    }).then(response => {
        return response;
    })
    .catch(error => {
        console.log("Error Data",error.response.data.message)
        return error.response;
    });

};
*/
export const postAggregatedDataValue = async ( period, dataSet, de, orgUnit, cc, cp, co, defaultValue ) => {
    return await post('api/dataValues.json?paging=false&pe='+period+'&ds='+dataSet+ '&de='+de+ '&ou='+orgUnit+'&cc='+cc +'&cp='+cp +'&co='+co +'&value='+defaultValue )
        .then(function (response) {
            return response;
        })
        .catch(function (error) {
            console.log("Error Data",error.response.data.message)
            return error.response;
        });


};

export const getAggregatedDataValue = async ( period, dataSet, de, orgUnit, cc, cp, co, operation ) => {

    let value = 0
    return await get('api/dataValues.json?paging=false&pe='+period+'&ds='+dataSet+ '&de='+de+ '&ou='+orgUnit+'&cc='+cc +'&cp='+cp +'&co='+co )
        .then(function (response) {

            //alert( response.data.httpStatusCode + " -- " + response.data.message);
            //alert( response.data.status + " -- " + response.data.httpStatus);
            if (response.data.httpStatus === "Conflict") {
                //this means that the value does not exist so return 0
            } else {
                //this means that the value exists and is returned so return that.
                value = parseInt(response.data[0]);
            }
            //Now that we have the value, perform increment or decrement
            if (operation === "COMPLETE") {
                value = value + 1
            } else if (operation === "INCOMPLETE") {
                value = (value === 0 ? 0 : value - 1); //if value is 0 return 0 else return decremented value
            } else {
                //if code reaches here, then it is in an unstable state so respond with an error
                return {
                    response: false,
                    message: 'Received an invalid value when aggregating for dataSet' + dataSet
                }
            }
            return {
                response: true,
                value: value
            }

            //return response.data.events[0].event;
        })
        .catch(function (error) {
            console.log(error);
            if (operation === "COMPLETE") {
                value = value + 1
            }
            return {
                response: true,
                value: value
            }
        });

/*
    let a = await get(
        request(`api/dataValues.json?paging=false`, {
            options: [`pe=${period}&ds=${dataSet}&de=${de}&ou=${orgUnit}&cc=${cc}&cp=${cp}&co=${co}`],
        })
    )

    if (a.httpStatus === "Conflict") {
        //this means that the value does not exist so return 0
    } else {
        //this means that the value exists and is returned so return that.
        value = parseInt(a[0]);
    }

    //Now that we have the value, perform increment or decrement
    if (operation === "COMPLETE") {
        value = value + 1
    } else if (operation === "INCOMPLETE") {
        value = (value === 0 ? 0 : value - 1); //if value is 0 return 0 else return decremented value
    } else {
        //if code reaches here, then it is in an unstable state so respond with an error
        return {
            response: false,
            message: `Received an invalid value when aggregating for dataSet,${dataSet}.`
        }
    }
    return {
        response: true,
        value: value
    }
    */
}


/**
 * @retunrs single attribute detail
 */
export const getAttributeDetails = async (attributeId) => {
    return await get('api/trackedEntityAttributes/'+attributeId)
        .then(function (response) {
            return response;
        })
        .catch(function (error) {
            console.log(error);
        });
};


/**
* @retunrs single attribute detail
*/
export const getMultipleAttributes = async (attributeArray) => {
    return await get('api/trackedEntityAttributes.json?filter=id:in:['+attributeArray+']&fields=name,code')    
      .then(function (response) {       
      return response;
    })
    .catch(function (error) {
      console.log(error);
    });
};
/**
* Category Options
* @retunrs single option detail
*/
export const getOptionDetails = async (optionId) => {
    return await get('api/options/'+optionId+'.json?fields=id,code,name,optionSet[id,name]')
    	.then(function (response) {    		
			return response;
		})
		.catch(function (error) {
			console.log(error);
		});
};
/**
* Option Set
* @retunrs single optionSet detail
*/
export const getOptionSetDetails = async (optionSetId) => {
    return await get('api/optionSets/'+optionSetId+'.json?fields=id,code,name,options[id,name,code]')
      .then(function (response) {       
      return response;
    })
    .catch(function (error) {
      console.log(error);
    });
};

/**
* Meta attribute-elements-options update
* updates of attributes values
*/
export const metaDataUpdate = async (api, jsonPayload) => {
    return await axios(config.baseUrl+api, {
        method: 'PUT',
        headers: config.fetchOptions.headers,
        data: jsonPayload,
        withCredentials: true,        
    })   
};

/**
* Get organisation unit detail
* @returns {string} org unit detail
*/
export const getOrgUnitDetail = async (orgUnitId) => {
  return get('api/organisationUnits/'+orgUnitId+'.json?fields=id,name,shortName,level,code');
   
};

/**
 * Generates AMR Id consisting of OU code and a random integer.
 * @param {string} orgUnitId - Organisation unit ID.
 * @returns {string} AMR Id.
 */
export const generateAmrId = async (orgUnitId, orgUnitCode) => {
    const newId = () =>
    orgUnitCode + (Math.floor(Math.random() * 90000) + 10000)
     let amrId = newId();
    return get(
      request('api/events.json?', {
        fields: 'event',
        filters: `${config.amrIdDataElement}:eq:${amrId}`,
        options: [`orgUnit=${orgUnitId}`],
      })
    ).then( response =>{
      if (typeof response.data.events === 'undefined' || response.data.events.length === 0) {
        return amrId;
      } 
    });
}
export const amrIdSqlView = async (orgUnitId, orgUnitCode) => {

    const newId = () =>
    orgUnitCode + (Math.floor(Math.random() * 90000) + 10000)
     let amrId = newId();

    return get('api/sqlViews/joGfuhbHQUx/data?paging=false&var=orgunit:'+orgUnitId).then( response =>{

        let result = response.data.listGrid.rows.filter(function (existingId) {
          return existingId[0] === amrId;
        });

        if (typeof result === 'undefined' || result.length === 0) {
          return amrId; // return newly generated id
        } else {
          return amrId+(Math.floor(Math.random() * 900) + 100); // generate and return new id
        }
    });
}

/**
* Get data store
* @returns {string} org unit detail
*/
export const getDataStoreNameSpace = async (key) => {
  return await get('api/dataStore/whonet/'+key);  
};

/**
* To create new data store namespace
*/
export const createDateStoreNameSpace = async (api, jsonPayload) => {
    return await axios(config.baseUrl+api, {
        method: 'POST',
        headers: config.fetchOptions.headers,
        data: jsonPayload,
        withCredentials: true,        
    })   
};