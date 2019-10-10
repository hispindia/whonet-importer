import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import * as styleProps  from '../../ui/Styles';
import { AlertBar, CircularLoader } from '@dhis2/ui-core';
import { 
    metaDataUpdate,
    getOptionDetails,
    getDataStoreNameSpace,
    createDateStoreNameSpace,
    getOptionSets
} from '../../api/API';

class OptionsTable extends React.Component {
   constructor(props) {
    super(props);
    this.state = {
      value   : '',
      loading : false,
      optionSets: [],
      orgUnitId: "",
      OrgUnitName: "",
      dataStoreNamespace: [],
      mergedArrayData: [],
      feedbackToUser: '',            
    };
    this.handleInputChange   = this.handleInputChange.bind(this);
    this.renderOptionSets    = this.renderOptionSets.bind(this);
    this.handleOptionsSubmit = this.handleOptionsSubmit.bind(this);
  }
 

  async componentWillMount(){
    this.setState({
      orgUnitId: this.props.orgUnitId,
      OrgUnitName: this.props.OrgUnitName
    });
    let self = this;
    let customizedOptionSets = [];
    await getOptionSets().then((response) => {
      response.data.optionSets.map( data => {
        data.options.map(option=>{
          let arr = {
            "optionSetId": data.id,
            "optionSetName": data.name,
            "id": option.id,
            "name": option.name,
            "code": option.code,
          }
        customizedOptionSets.push(arr);  // Custom array with the combinations of option set and options
        })
      });
    }).catch(error => this.setState({error: true}));
    self.setState({
        optionSets : customizedOptionSets       
    }); 
    await getDataStoreNameSpace(this.props.orgUnitId).then((response) => {
      self.setState({
        dataStoreNamespace : response.data.options      
      }); 
    }).catch(error => this.setState({error: true}));
    // Merge two array
    const mergeById = (jsonPayload1, jsonPayload2) =>
    jsonPayload1.map(itm => ({
        ...jsonPayload2.find((item) => (item.id === itm.id) && item),
        ...itm
    }));
    if (typeof this.state.dataStoreNamespace !== 'undefined') {
      let mergedArray = mergeById(this.state.optionSets, this.state.dataStoreNamespace);
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
  * {optionSets} store the current state options array
  * {targetIndex} return the 
  * If there is data in the setting input text field, then update/ set the values `optionSets` state
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
      mergedArrayData[targetIndex].mapCode=value;
      this.setState({mergedArrayData});
    }
  }
  

  async handleOptionsSubmit(e) {
    this.setState({ 
      loading: true,
    });
    e.preventDefault();
    let updateArray = e.target;
    const dataLength = updateArray.length;
    let updateOptionsPayload = [];

    for(let i=0; i< dataLength; i++) {
      await ( async(currentData, currentIndex) => {
        const elementObj = Object.entries(currentData);
        for( let j=0; j < 1; j++  ) {
          await ( async ([columnName, columnValue], index ) => {
            if(updateArray[i].value !== '' ){
              const result= await getOptionDetails(updateArray[i].id);
                let optionDetailInfo = result.data;
                // Array for datastore update
                updateOptionsPayload.push({
                  "optionSetId": optionDetailInfo.optionSet.id,
                  "optionSetName": optionDetailInfo.optionSet.name,
                  "id": optionDetailInfo.id,
                  "name": optionDetailInfo.name,
                  "code": optionDetailInfo.code,
                  "mapCode": updateArray[i].value,
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
    // If there is no key exist then create first the option,element and attributes the add settings data
    if (typeof dataStoreNameSpace === 'undefined') {

      await createDateStoreNameSpace('api/dataStore/whonet/'+this.state.orgUnitId, JSON.stringify(this.state.orgUnitId)).then(info=>{
          console.log("Info: ", info.data);
      });
      await metaDataUpdate('api/dataStore/whonet/'+this.state.orgUnitId, JSON.stringify({"elements": [], "attributes": [], "options": updateOptionsPayload }) )
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
      dataStoreNameSpace.options = updateOptionsPayload; // Update existing options
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


  renderOptionSets() {
    const classes         = this.props;
    let {mergedArrayData} = this.state;
    let content = mergedArrayData.map(datum => {
      return (
        <TableRow key={datum.id}>
          <TableCell component="th" scope="row" style={styleProps.styles.tableHeader}>
            {datum.optionSetName}
          </TableCell> 
          <TableCell component="th" scope="row" style={styleProps.styles.tableHeader}>
            {datum.name}
          </TableCell>
          <TableCell component="th" scope="row" style={styleProps.styles.tableHeader}>
            {datum.code}
          </TableCell>
          <TableCell style={styleProps.styles.tableHeader}>
            <input 
            type="text" 
            id={datum.id}
            value={ datum.mapCode || ''}
            onChange={this.handleInputChange} 
            style={styleProps.styles.inputText}/>
          </TableCell> 
        </TableRow>
        )
    });
    let spinner;
    if(this.state.loading){
      spinner = <CircularLoader className="circularLoader"/>
    }
    return (
      <div >
        <form onSubmit={(e) => this.handleOptionsSubmit(e)} id="whonetsetting">
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell style={styleProps.styles.tableHeader}> 
                <strong><h3> Option sets </h3></strong>
              </TableCell>
              <TableCell style={styleProps.styles.tableHeader}> 
                <strong><h3> Option name </h3></strong>
              </TableCell>
              <TableCell style={styleProps.styles.tableHeader}> 
                <strong><h3> Option code</h3></strong>
              </TableCell>
              <TableCell style={styleProps.styles.tableHeader}> 
                <strong><h3> Map code </h3></strong> 
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
    const optionSetsList = this.renderOptionSets(); 
    return (
      <div>
        {this.state.feedbackToUser}
        {optionSetsList}
      </div>
    );
  }
  
  
}


export default OptionsTable;