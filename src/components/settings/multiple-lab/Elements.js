import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import * as styleProps  from '../../ui/Styles';
import { AlertBar, CircularLoader } from '@dhis2/ui-core';
import '../../../style/dhis2UiStyle.css';
import { 
    metaDataUpdate,
    getElementDetails,
    getPrograms,
    getDataStoreNameSpace,
    createDateStoreNameSpace
} from '../../api/API';


class DataElementsTable extends React.Component {
   constructor(props) {
    super(props);
    this.state = {
      value   : '',
      loading : false,
      dataElements: [],
      orgUnitId: "",
      OrgUnitName: "",
      dataStoreNamespace: [],
      mergedArrayData: [],
      feedbackToUser: '',      
    };
    this.handleInputChange   = this.handleInputChange.bind(this);
    this.renderDataElements  = this.renderDataElements.bind(this);
    this.handleSubmitElements= this.handleSubmitElements.bind(this);
    this.saveMapping = this.saveMapping.bind(this);
  }
 

  async componentWillMount(){
    this.setState({
      orgUnitId: this.props.orgUnitId,
      OrgUnitName: this.props.OrgUnitName
    });
    let self = this;
    await getPrograms().then((response) => {
      self.setState({
        dataElements : response.data.programs[0].programStages[0].programStageDataElements       
      }); 
    }).catch(error => this.setState({error: true}));
    await getDataStoreNameSpace(this.props.orgUnitId).then((response) => {
      self.setState({
        dataStoreNamespace : response.data.elements      
      }); 
    }).catch(error => this.setState({error: true}));
    // Merge two array
    const mergeById = (jsonPayload1, jsonPayload2) =>
    jsonPayload1.map(itm => ({
        ...jsonPayload2.find((item) => (item.id === itm.dataElement.id) && item),
        ...itm
    }));
    if (typeof this.state.dataStoreNamespace !== 'undefined') { // If data store elementskey is not empty
      let mergedArray = mergeById(this.state.dataElements, this.state.dataStoreNamespace);
      this.setState({mergedArrayData: mergedArray});
    }
  }


  giveFeedbackToUser = (feedback) => {
    if (feedback==='success') {
      this.setState({feedbackToUser: 
        <AlertBar duration={8000} icon success className="alertBar" onHidden={this.setState({feedbackToUser: ''})}>
          Mapping was successfully updated
        </AlertBar>
      })
    }
    else {
      this.setState({
        feedbackToUser:
          <AlertBar duration={8000} icon critical className="alertBar" onHidden={this.setState({feedbackToUser: ''})}>
            Mapping could not be updated
          </AlertBar>
        });
    } 
  }
  

  saveMapping() {
    let myForm = document.getElementById('whonetsetting');
    myForm.dispatchEvent(new Event('submit'))
  }


  /**
  * {id, value} returns the element id and input value
  * {dataElements} store the current state elements array
  * {targetIndex} return the 
  * If there is data in the setting input text field, then update/ set the values `dataElements` state
  */
  handleInputChange(e) {    
    const {id, value}  = e.target;
    let {mergedArrayData} = this.state;
    const targetIndex  = mergedArrayData.findIndex(datum => {
      return datum.id === id;
    });
    if(targetIndex !== -1){ 
      if(mergedArrayData[targetIndex].mapCode !== '' || typeof mergedArrayData[targetIndex].mapCode !== 'undefined' ){
        mergedArrayData[targetIndex].mapCode = value;
        this.setState({mergedArrayData});
      } else {
        mergedArrayData[targetIndex].mapCode=value;
        this.setState({mergedArrayData});
      }     
    } else {
      const targetIndex  = mergedArrayData.findIndex(datum => {
        return datum.dataElement.id === id;
      });
      mergedArrayData[targetIndex].id=id;
      mergedArrayData[targetIndex].mapCode=value;
      this.setState({mergedArrayData});
    }
  }
 

  async handleSubmitElements(e) {
    this.setState({ 
      loading: true,
    });
    e.preventDefault();
    let updateArray = e.target;
    const dataLength = updateArray.length;
    let updateElementsPayload = [];
    for(let i=0; i< dataLength; i++) {
      await ( async(currentData, currentIndex) => {
        const elementObj = Object.entries(currentData);

        for( let j=0; j < 1; j++  ) {
          await ( async ([columnName, columnValue], index ) => {
            if(updateArray[i].value !== '' ){
              const result= await getElementDetails(updateArray[i].id);
                let customElementString = result.data;
                updateElementsPayload.push({
                  "id": customElementString.id,
                  "name": customElementString.name,
                  "mapCode": updateArray[i].value,
                  "code": customElementString.code
                });                
            }    
          } ) (elementObj[j], {}, j);
        } 
      } ) ( updateArray[i], {}, i );
    }
    // Find the setting key exist or not
    const dataStoreNameSpace = await getDataStoreNameSpace(this.state.orgUnitId)
    .then((response) => {      
      return response.data;
    }).catch(error => {
      console.log("error.response.data.httpStatusCode: ", error.response.data.httpStatusCode);
    });
    // If there is no key exist then create first then add settings data
    if (typeof dataStoreNameSpace === 'undefined') {
      await createDateStoreNameSpace('api/dataStore/whonet/'+this.state.orgUnitId, JSON.stringify(this.state.orgUnitId)).then(info=>{
          console.log("Info: ", info.data);
      });
      await metaDataUpdate('api/dataStore/whonet/'+this.state.orgUnitId, JSON.stringify({"elements": updateElementsPayload, "attributes":[], "options": [], "eventDate":[] }) )
      .then((response) => {
        if(response.data.httpStatus === "OK" ){
          this.setState({
            loading: false,
          });
          this.giveFeedbackToUser('success')
        }
        console.log("Console results: ", response.data);
      }).catch(error => { 
        console.log({error}); 
        this.giveFeedbackToUser('fail')
      });
    } else {
      dataStoreNameSpace.elements = updateElementsPayload; // update existing elements
      let finalPayload = dataStoreNameSpace;
      await metaDataUpdate('api/dataStore/whonet/'+this.state.orgUnitId, JSON.stringify(finalPayload) )
      .then((response) => {
        if(response.data.httpStatus === "OK" ){
          this.setState({
            loading: false,
          });
          this.giveFeedbackToUser('success')
        }
        console.log("Console results: ", response.data);
      }).catch(error => { 
        console.log({error}); 
        this.giveFeedbackToUser('fail')
      });
    }
  }


  renderDataElements() {
    const classes = this.props;
    let {mergedArrayData} = this.state;
    let content = mergedArrayData.map(datum => {
      return (
        <TableRow key={datum.dataElement.id}>
          <TableCell component="th" scope="row" style={styleProps.styles.tableHeader}>
            {datum.dataElement.name}
          </TableCell>
          <TableCell style={styleProps.styles.tableHeader}>
            {datum.dataElement.code}
          </TableCell> 
          <TableCell style={styleProps.styles.tableHeader}>
            <input type="text" id={datum.dataElement.id} value={datum.mapCode || ''}
            onChange={this.handleInputChange} style={styleProps.styles.inputText}/>
          </TableCell> 
        </TableRow>
      )
    });
    let spinner;
    if(this.state.loading){
      spinner = <CircularLoader className="circularLoader"/>
    }
    return (
      <div>
          <form onSubmit={(e) => this.handleSubmitElements(e)} id="whonetsetting">
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell style={styleProps.styles.tableHeader}> 
                  <strong><h3> DHIS2 data element name </h3></strong>
                </TableCell>
                <TableCell style={styleProps.styles.tableHeader}> 
                  <strong><h3> WHONET data element name </h3></strong>
                </TableCell>
                <TableCell style={styleProps.styles.tableHeader}> 
                  <strong><h3> Special name for this org. unit </h3></strong> 
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>            
              {content}             
            </TableBody>          
          </Table>
          </form> 
          {spinner}
      </div>
    )
  }
  

  render(){
    const dataElementList = this.renderDataElements();
    return (
      <div>
        {this.state.feedbackToUser}
        {dataElementList}
      </div>
    );
  }          
}


export default DataElementsTable;